import { clean, defaultWorkspaceId, isValidEmail, json, jsonError, now, readJson, requireDb, requireRole, requireSession, requireWorkspaceAccess } from "../_lib/api.js";

const reservationColumns = `
  order_reservations.id, order_reservations.workspace_id, order_reservations.product_id,
  order_reservations.payment_link_id, order_reservations.user_id, order_reservations.guest_email,
  order_reservations.status, order_reservations.reservation_type, order_reservations.metadata_json,
  order_reservations.expires_at, order_reservations.created_at, order_reservations.updated_at,
  payment_links.title AS payment_link_title, payment_links.amount_cents, payment_links.currency,
  products.title AS product_title, products.product_type
`;

function metadata(payload, link) {
  return JSON.stringify({
    customer_name: clean(payload.customer_name || payload.name, 160),
    customer_phone: clean(payload.customer_phone || payload.phone, 80),
    customer_contact: clean(payload.customer_contact || payload.contact, 180),
    note: clean(payload.note, 800),
    source: clean(payload.source || "public_smart_link", 80),
    no_real_payment: true,
    payment_status: "not_charged",
    link_title: link.title,
    amount_cents: link.amount_cents,
    currency: link.currency
  });
}

async function publicSession(request, env) {
  try {
    const auth = await requireSession(request, env);
    return auth.ok ? auth : null;
  } catch {
    return null;
  }
}

async function writeActivity(env, workspaceId, userId, reservationId, link) {
  try {
    await env.DB.prepare(
      `INSERT INTO activity_events (id, workspace_id, user_id, event_type, title, body, metadata_json, created_at)
       VALUES (?, ?, ?, 'order_reservation.created', 'Smart Link reservation created', ?, ?, ?)`
    )
      .bind(crypto.randomUUID(), workspaceId, userId || null, link.title, JSON.stringify({ reservation_id: reservationId, payment_link_id: link.id, product_id: link.product_id }), now())
      .run();
  } catch {}
}

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, ["admin", "manager", "partner", "client", "artist", "producer", "creator", "seller", "agent_later"]);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const workspaceId = clean(url.searchParams.get("workspace_id"), 120) || defaultWorkspaceId(auth);
  const access = requireWorkspaceAccess(auth, workspaceId);
  if (!access.ok) return access.response;
  const status = clean(url.searchParams.get("status"), 40);
  const filters = ["order_reservations.workspace_id = ?"];
  const binds = [workspaceId];
  if (status) { filters.push("order_reservations.status = ?"); binds.push(status); }
  const result = await env.DB.prepare(
    `SELECT ${reservationColumns}
     FROM order_reservations
     LEFT JOIN payment_links ON payment_links.id = order_reservations.payment_link_id
     LEFT JOIN products ON products.id = order_reservations.product_id
     WHERE ${filters.join(" AND ")}
     ORDER BY order_reservations.created_at DESC
     LIMIT 100`
  )
    .bind(...binds)
    .all();
  return json({ ok: true, reservations: result.results || [] });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};
  const paymentLinkId = clean(payload.payment_link_id, 160);
  if (!paymentLinkId) return jsonError("payment_link_id_required", "payment_link_id is required.", 400, { fields: ["payment_link_id"] });
  const link = await env.DB.prepare(
    `SELECT id, workspace_id, product_id, title, status, amount_cents, currency,
            checkout_mode, requires_account, allow_guest_checkout
     FROM payment_links
     WHERE id = ? AND status = 'active'
     LIMIT 1`
  )
    .bind(paymentLinkId)
    .first();
  if (!link?.id) return jsonError("payment_link_not_found", "Smart Link not found or inactive.", 404);
  const email = clean(payload.guest_email || payload.email, 180).toLowerCase();
  if (!email || !isValidEmail(email)) return jsonError("valid_email_required", "A valid email is required to reserve this offer.", 400, { fields: ["email"] });
  const auth = await publicSession(request, env);
  const userId = auth?.user?.id || null;
  const id = crypto.randomUUID();
  const timestamp = now();
  const reservationType = Number(link.requires_account || 0) === 1 ? "account_required" : "guest_allowed";
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(
    `INSERT INTO order_reservations (
       id, workspace_id, product_id, payment_link_id, user_id, guest_email,
       status, reservation_type, metadata_json, expires_at, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, 'reserved', ?, ?, ?, ?, ?)`
  )
    .bind(id, link.workspace_id, link.product_id || null, link.id, userId, email, reservationType, metadata(payload, link), expiresAt, timestamp, timestamp)
    .run();
  await writeActivity(env, link.workspace_id, userId, id, link);
  return json({ ok: true, reservation: { id, status: "reserved", reservation_type: reservationType, payment_status: "not_charged", expires_at: expiresAt } }, 201);
}
