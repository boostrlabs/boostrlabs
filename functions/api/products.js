import { clean, defaultWorkspaceId, json, now, readJson, requireDb, requireRole, requireWorkspaceAccess } from "../_lib/api.js";
import { customOsRoles } from "../_lib/custom-os.js";
import { normalizeProductPayload, productColumns, productHealth, validateProductForWrite } from "../_lib/products.js";

const clampLimit = (value) => Math.min(Math.max(Number(value || 50) || 50, 1), 100);

function resolveWorkspace(auth, requestedWorkspaceId) {
  const workspaceId = clean(requestedWorkspaceId, 120) || defaultWorkspaceId(auth);
  const access = requireWorkspaceAccess(auth, workspaceId);
  if (!access.ok) return { ok: false, response: access.response };
  return { ok: true, workspace_id: workspaceId };
}

function addProductFilters(filters, binds, searchParams) {
  const status = clean(searchParams.get("status"), 40).toLowerCase();
  const productType = clean(searchParams.get("product_type"), 40).toLowerCase();
  const q = clean(searchParams.get("q"), 120).toLowerCase();
  if (status) {
    filters.push("status = ?");
    binds.push(status);
  }
  if (productType) {
    filters.push("product_type = ?");
    binds.push(productType);
  }
  if (q) {
    filters.push("(lower(title) LIKE ? OR lower(description) LIKE ?)");
    binds.push(`%${q}%`, `%${q}%`);
  }
}

async function writeProductActivity(env, auth, workspaceId, productId, product) {
  try {
    await env.DB.prepare(
      `INSERT INTO activity_events (id, workspace_id, user_id, event_type, title, body, metadata_json, created_at)
       VALUES (?, ?, ?, 'product.created', 'Product created', ?, ?, ?)`
    )
      .bind(
        crypto.randomUUID(),
        workspaceId,
        auth.user?.id || null,
        product.title,
        JSON.stringify({ product_id: productId, product_type: product.product_type, status: product.status }),
        now()
      )
      .run();
  } catch {}
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const workspace = resolveWorkspace(auth, url.searchParams.get("workspace_id"));
  if (!workspace.ok) return workspace.response;
  const filters = ["workspace_id = ?", "status != 'archived'"];
  const binds = [workspace.workspace_id];
  addProductFilters(filters, binds, url.searchParams);
  const limit = clampLimit(url.searchParams.get("limit"));
  const result = await env.DB.prepare(
    `SELECT ${productColumns}
     FROM products
     WHERE ${filters.join(" AND ")}
     ORDER BY updated_at DESC, created_at DESC
     LIMIT ?`
  )
    .bind(...binds, limit)
    .all();
  const products = (result.results || []).map((product) => ({ ...product, health: productHealth(product) }));
  return json({ ok: true, workspace_id: workspace.workspace_id, products });
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
  const product = normalizeProductPayload(payload);
  const valid = validateProductForWrite(product);
  if (!valid.ok) return valid.response;
  const id = crypto.randomUUID();
  const timestamp = now();
  const health = productHealth(product);
  await env.DB.prepare(
    `INSERT INTO products (
       id, workspace_id, title, product_type, status, price_amount, currency,
       description, asset_status, fulfillment_type, requires_account,
       allow_guest_checkout, metadata_json, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      workspace.workspace_id,
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
      timestamp,
      timestamp
    )
    .run();
  await writeProductActivity(env, auth, workspace.workspace_id, id, product);
  return json({ ok: true, product: { id, workspace_id: workspace.workspace_id, ...product, health } }, 201);
}
