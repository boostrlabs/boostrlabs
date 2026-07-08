import { clean, json, jsonError, now, readJson, requireDb, requireRole, requireWorkspaceAccess } from "../../_lib/api.js";
import { customOsRoles } from "../../_lib/custom-os.js";
import { normalizeProductPayload, productColumns, productHealth, validateProductForWrite } from "../../_lib/products.js";

async function loadProduct(env, auth, id) {
  const product = await env.DB.prepare(`SELECT ${productColumns} FROM products WHERE id = ? LIMIT 1`).bind(id).first();
  if (!product?.id) return { ok: false, response: jsonError("product_not_found", "Product not found.", 404) };
  const access = requireWorkspaceAccess(auth, product.workspace_id);
  if (!access.ok) return { ok: false, response: access.response };
  return { ok: true, product };
}

async function writeActivity(env, auth, product, eventType, title) {
  try {
    await env.DB.prepare(
      `INSERT INTO activity_events (id, workspace_id, user_id, event_type, title, body, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        crypto.randomUUID(),
        product.workspace_id,
        auth.user?.id || null,
        eventType,
        title,
        product.title,
        JSON.stringify({ product_id: product.id, status: product.status, product_type: product.product_type }),
        now()
      )
      .run();
  } catch {}
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const loaded = await loadProduct(env, auth, clean(params.id, 120));
  if (!loaded.ok) return loaded.response;
  return json({ ok: true, product: { ...loaded.product, health: productHealth(loaded.product) } });
}

export async function onRequestPatch({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const loaded = await loadProduct(env, auth, clean(params.id, 120));
  if (!loaded.ok) return loaded.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const product = normalizeProductPayload(parsed.payload || {}, loaded.product);
  const valid = validateProductForWrite(product);
  if (!valid.ok) return valid.response;
  await env.DB.prepare(
    `UPDATE products
     SET title = ?, product_type = ?, status = ?, price_amount = ?, currency = ?,
         description = ?, asset_status = ?, fulfillment_type = ?, requires_account = ?,
         allow_guest_checkout = ?, metadata_json = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(
      product.title,
      product.product_type,
      product.status,
      product.price_amount,
      product.currency,
      product.description,
      product.asset_status,
      product.fulfillment_type,
      product.requires_account,
      product.allow_guest_checkout,
      product.metadata_json,
      now(),
      loaded.product.id
    )
    .run();
  const refreshed = await env.DB.prepare(`SELECT ${productColumns} FROM products WHERE id = ? LIMIT 1`).bind(loaded.product.id).first();
  await writeActivity(env, auth, refreshed, "product.updated", "Product updated");
  return json({ ok: true, product: { ...refreshed, health: productHealth(refreshed) } });
}

export async function onRequestDelete({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const loaded = await loadProduct(env, auth, clean(params.id, 120));
  if (!loaded.ok) return loaded.response;
  await env.DB.prepare("UPDATE products SET status = 'archived', updated_at = ? WHERE id = ?")
    .bind(now(), loaded.product.id)
    .run();
  await writeActivity(env, auth, { ...loaded.product, status: "archived" }, "product.archived", "Product archived");
  return json({ ok: true, id: loaded.product.id, status: "archived" });
}
