import { addLeadEvent, canAccessModule, clean, isValidEmail, isValidPhone, json, managerAuth, now, readJson, requireDb } from "../_lib/api.js";

const clampLimit = (value) => Math.min(Math.max(Number(value || 50) || 50, 1), 100);

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = managerAuth(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = clampLimit(url.searchParams.get("limit"));
  const paymentStatus = clean(url.searchParams.get("payment_status"), 40);
  const fulfillmentStatus = clean(url.searchParams.get("fulfillment_status"), 40);
  const filters = [];
  const binds = [];

  if (paymentStatus) {
    filters.push("payment_status = ?");
    binds.push(paymentStatus);
  }
  if (fulfillmentStatus) {
    filters.push("fulfillment_status = ?");
    binds.push(fulfillmentStatus);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const result = await env.DB.prepare(
    `SELECT id, lead_id, workspace_id, source, customer_name, customer_email, customer_phone,
            item_name, item_type, amount_cents, currency, payment_status, fulfillment_status,
            metadata_json, created_at, updated_at
     FROM orders
     ${where}
     ORDER BY created_at DESC
     LIMIT ?`
  )
    .bind(...binds, limit)
    .all();

  return json({ ok: true, orders: result.results || [] });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = managerAuth(request, env);
  if (!auth.ok) return auth.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const payload = parsed.payload || {};
  const itemName = clean(payload.item_name || payload.product || payload.service, 180);
  if (!itemName) return json({ ok: false, error: "Order needs item_name." }, 400);

  const createdAt = now();
  const id = crypto.randomUUID();
  const leadId = clean(payload.lead_id, 120) || null;
  const workspaceId = clean(payload.workspace_id, 120) || null;
  const amount = Math.max(Number(payload.amount_cents || 0) || 0, 0);
  const customerEmail = clean(payload.customer_email, 180).toLowerCase();
  const customerPhone = clean(payload.customer_phone, 80);

  if (workspaceId && !(await canAccessModule(env, workspaceId, "smart-checkout"))) {
    return json({ error: "module_locked", module: "smart-checkout" }, 403);
  }

  if (leadId) {
    const lead = await env.DB.prepare("SELECT id FROM leads WHERE id = ?").bind(leadId).first();
    if (!lead) return json({ ok: false, error: "Linked lead_id was not found." }, 404);
  }

  if (!leadId && !customerEmail && !customerPhone) {
    return json({ ok: false, error: "Order needs lead_id, customer_email, or customer_phone." }, 400);
  }

  if (customerEmail && !isValidEmail(customerEmail)) {
    return json({ ok: false, error: "Invalid customer_email." }, 400);
  }

  if (customerPhone && !isValidPhone(customerPhone)) {
    return json({ ok: false, error: "Invalid customer_phone." }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO orders (
      id, lead_id, workspace_id, source, customer_name, customer_email, customer_phone,
      item_name, item_type, amount_cents, currency, payment_status, fulfillment_status,
      metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      leadId,
      workspaceId,
      clean(payload.source || "manager", 80),
      clean(payload.customer_name, 160),
      customerEmail,
      customerPhone,
      itemName,
      clean(payload.item_type || "service", 80),
      amount,
      clean(payload.currency || "USD", 8).toUpperCase(),
      clean(payload.payment_status || "pending", 40),
      clean(payload.fulfillment_status || "pending", 40),
      JSON.stringify(payload.metadata || {}),
      createdAt,
      createdAt
    )
    .run();

  if (leadId) {
    await addLeadEvent(env, {
      lead_id: leadId,
      event_type: "order.created",
      payload: { order_id: id, item_name: itemName, amount_cents: amount },
      created_at: createdAt
    });
  }

  return json({ ok: true, id, stored: true }, 201);
}
