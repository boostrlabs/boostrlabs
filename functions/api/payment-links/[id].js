import { clean, json, jsonError, now, readJson, requireDb, requireRole, requireWorkspaceAccess } from "../../_lib/api.js";
import { customOsRoles } from "../../_lib/custom-os.js";
import { productColumns } from "../../_lib/products.js";
import { normalizePaymentLinkPayload, paymentLinkColumns, paymentLinkHealth, validatePaymentLinkForWrite } from "../../_lib/payment-links.js";

async function loadLink(env, auth, id) {
  const link = await env.DB.prepare(`SELECT ${paymentLinkColumns} FROM payment_links WHERE id = ? LIMIT 1`).bind(id).first();
  if (!link?.id) return { ok: false, response: jsonError("payment_link_not_found", "Payment link not found.", 404) };
  const access = requireWorkspaceAccess(auth, link.workspace_id);
  if (!access.ok) return { ok: false, response: access.response };
  return { ok: true, link };
}

async function loadProduct(env, workspaceId, productId) {
  const id = clean(productId, 120);
  if (!id) return null;
  return env.DB.prepare(`SELECT ${productColumns} FROM products WHERE id = ? AND workspace_id = ? AND status != 'archived' LIMIT 1`)
    .bind(id, workspaceId)
    .first();
}

async function activity(env, auth, link, eventType, title) {
  try {
    await env.DB.prepare(
      `INSERT INTO activity_events (id, workspace_id, user_id, event_type, title, body, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(crypto.randomUUID(), link.workspace_id, auth.user?.id || null, eventType, title, link.title, JSON.stringify({ payment_link_id: link.id, status: link.status }), now())
      .run();
  } catch {}
}

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestGet({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const loaded = await loadLink(env, auth, clean(params.id, 120));
  if (!loaded.ok) return loaded.response;
  return json({ ok: true, payment_link: { ...loaded.link, public_url: `/pay/${loaded.link.id}`, health: paymentLinkHealth(loaded.link) } });
}

export async function onRequestPatch({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const loaded = await loadLink(env, auth, clean(params.id, 120));
  if (!loaded.ok) return loaded.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};
  const product = await loadProduct(env, loaded.link.workspace_id, payload.product_id ?? loaded.link.product_id);
  if (payload.product_id && !product?.id) return jsonError("product_not_found", "Product not found in this workspace.", 404);
  const link = normalizePaymentLinkPayload(payload, product, loaded.link);
  const valid = validatePaymentLinkForWrite(link);
  if (!valid.ok) return valid.response;
  await env.DB.prepare(
    `UPDATE payment_links
     SET product_id = ?, title = ?, status = ?, amount_cents = ?, currency = ?,
         checkout_mode = ?, requires_account = ?, allow_guest_checkout = ?,
         license_metadata_json = ?, disclosure_json = ?, metadata_json = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(link.product_id, link.title, link.status, link.amount_cents, link.currency, link.checkout_mode, link.requires_account, link.allow_guest_checkout, link.license_metadata_json, link.disclosure_json, link.metadata_json, now(), loaded.link.id)
    .run();
  const refreshed = await env.DB.prepare(`SELECT ${paymentLinkColumns} FROM payment_links WHERE id = ? LIMIT 1`).bind(loaded.link.id).first();
  await activity(env, auth, refreshed, "payment_link.updated", "Smart Link updated");
  return json({ ok: true, payment_link: { ...refreshed, public_url: `/pay/${refreshed.id}`, health: paymentLinkHealth(refreshed) } });
}

export async function onRequestDelete({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const loaded = await loadLink(env, auth, clean(params.id, 120));
  if (!loaded.ok) return loaded.response;
  await env.DB.prepare("UPDATE payment_links SET status = 'archived', updated_at = ? WHERE id = ?")
    .bind(now(), loaded.link.id)
    .run();
  await activity(env, auth, { ...loaded.link, status: "archived" }, "payment_link.archived", "Smart Link archived");
  return json({ ok: true, id: loaded.link.id, status: "archived" });
}
