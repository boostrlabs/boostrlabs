import { clean, defaultWorkspaceId, json, jsonError, now, readJson, requireDb, requireRole, requireWorkspaceAccess } from "../_lib/api.js";
import { customOsRoles } from "../_lib/custom-os.js";
import { productColumns } from "../_lib/products.js";
import { normalizePaymentLinkPayload, paymentLinkColumns, paymentLinkHealth, validatePaymentLinkForWrite } from "../_lib/payment-links.js";

const clampLimit = (value) => Math.min(Math.max(Number(value || 50) || 50, 1), 100);

function resolveWorkspace(auth, requestedWorkspaceId) {
  const workspaceId = clean(requestedWorkspaceId, 120) || defaultWorkspaceId(auth);
  const access = requireWorkspaceAccess(auth, workspaceId);
  if (!access.ok) return { ok: false, response: access.response };
  return { ok: true, workspace_id: workspaceId };
}

async function loadProduct(env, workspaceId, productId) {
  const id = clean(productId, 120);
  if (!id) return null;
  return env.DB.prepare(`SELECT ${productColumns} FROM products WHERE id = ? AND workspace_id = ? AND status != 'archived' LIMIT 1`)
    .bind(id, workspaceId)
    .first();
}

async function activity(env, auth, workspaceId, linkId, link) {
  try {
    await env.DB.prepare(
      `INSERT INTO activity_events (id, workspace_id, user_id, event_type, title, body, metadata_json, created_at)
       VALUES (?, ?, ?, 'payment_link.created', 'Smart Link created', ?, ?, ?)`
    )
      .bind(crypto.randomUUID(), workspaceId, auth.user?.id || null, link.title, JSON.stringify({ payment_link_id: linkId, product_id: link.product_id, status: link.status }), now())
      .run();
  } catch {}
}

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const workspace = resolveWorkspace(auth, url.searchParams.get("workspace_id"));
  if (!workspace.ok) return workspace.response;
  const filters = ["payment_links.workspace_id = ?", "payment_links.status != 'archived'"];
  const binds = [workspace.workspace_id];
  const status = clean(url.searchParams.get("status"), 40);
  const q = clean(url.searchParams.get("q"), 120).toLowerCase();
  if (status) { filters.push("payment_links.status = ?"); binds.push(status); }
  if (q) { filters.push("(lower(payment_links.title) LIKE ? OR lower(products.title) LIKE ?)"); binds.push(`%${q}%`, `%${q}%`); }
  const result = await env.DB.prepare(
    `SELECT payment_links.*, products.title AS product_title, products.product_type
     FROM payment_links
     LEFT JOIN products ON products.id = payment_links.product_id
     WHERE ${filters.join(" AND ")}
     ORDER BY payment_links.updated_at DESC, payment_links.created_at DESC
     LIMIT ?`
  )
    .bind(...binds, clampLimit(url.searchParams.get("limit")))
    .all();
  const payment_links = (result.results || []).map((link) => ({ ...link, public_url: `/pay/${link.id}`, health: paymentLinkHealth(link) }));
  return json({ ok: true, workspace_id: workspace.workspace_id, payment_links });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};
  const workspace = resolveWorkspace(auth, payload.workspace_id);
  if (!workspace.ok) return workspace.response;
  const product = await loadProduct(env, workspace.workspace_id, payload.product_id);
  if (payload.product_id && !product?.id) return jsonError("product_not_found", "Product not found in this workspace.", 404);
  const link = normalizePaymentLinkPayload(payload, product);
  const valid = validatePaymentLinkForWrite(link);
  if (!valid.ok) return valid.response;
  const id = crypto.randomUUID();
  const timestamp = now();
  await env.DB.prepare(
    `INSERT INTO payment_links (
       id, workspace_id, product_id, title, status, amount_cents, currency,
       checkout_mode, requires_account, allow_guest_checkout, license_metadata_json,
       disclosure_json, metadata_json, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, workspace.workspace_id, link.product_id, link.title, link.status, link.amount_cents, link.currency, link.checkout_mode, link.requires_account, link.allow_guest_checkout, link.license_metadata_json, link.disclosure_json, link.metadata_json, timestamp, timestamp)
    .run();
  await activity(env, auth, workspace.workspace_id, id, link);
  return json({ ok: true, payment_link: { id, workspace_id: workspace.workspace_id, ...link, public_url: `/pay/${id}`, health: paymentLinkHealth(link) } }, 201);
}
