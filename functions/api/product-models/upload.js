import { clean, json, jsonError, now, requireDb, requireSession, requireWorkspaceAccess } from "../../_lib/api.js";

const MAX_BYTES = 35 * 1024 * 1024;

function bucket(env) {
  return env.BOOSTR_ASSETS || env.JOHANKARRD_ASSETS || env.ASSETS_BUCKET || env.R2_BUCKET || null;
}

function extension(name = "") {
  const match = String(name).toLowerCase().match(/\.([a-z0-9]{1,12})$/);
  return match ? match[1] : "";
}

function safeName(name = "model") {
  return String(name || "model").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140) || "model";
}

async function ensureSchema(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS workspace_files (
    id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, uploaded_by_user_id TEXT,
    related_type TEXT, related_id TEXT, title TEXT NOT NULL, file_url TEXT,
    file_type TEXT DEFAULT 'link', visibility TEXT DEFAULT 'workspace',
    status TEXT DEFAULT 'active', metadata_json TEXT, created_at TEXT, updated_at TEXT
  )`).run();
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const workspaceId = clean(url.searchParams.get("workspace_id"), 120);
  if (!workspaceId) return jsonError("workspace_required", "Selecciona un workspace.", 400);
  const access = requireWorkspaceAccess(auth, workspaceId);
  if (!access.ok) return access.response;

  const filename = clean(url.searchParams.get("filename") || request.headers.get("x-boostr-filename") || "product.glb", 220);
  const ext = extension(filename);
  if (!["glb", "gltf", "usdz"].includes(ext)) {
    return jsonError("model_type_not_supported", "Archivo no compatible. Usa GLB, GLTF o USDZ.", 415);
  }

  const body = await request.arrayBuffer();
  if (!body.byteLength) return jsonError("file_required", "El archivo llegó vacío.", 400);
  if (body.byteLength > MAX_BYTES) return jsonError("file_too_large", "El modelo excede 35 MB.", 413);

  const store = bucket(env);
  if (!store) return jsonError("r2_missing", "Cloud storage is not configured.", 503);
  await ensureSchema(env);

  const id = crypto.randomUUID();
  const timestamp = now();
  const key = `product-models/${workspaceId}/${auth.user.id}/${Date.now()}-${id}-${safeName(filename)}`;
  const contentType = ext === "glb" ? "model/gltf-binary" : ext === "gltf" ? "model/gltf+json" : "model/vnd.usdz+zip";

  await store.put(key, body, {
    httpMetadata: { contentType },
    customMetadata: { workspace_id: workspaceId, uploaded_by_user_id: auth.user.id, category: "product-3d", source: "product_builder_v3", filename, extension: ext }
  });

  const metadata = JSON.stringify({ r2_key: key, category: "product-3d", source: "product_builder_v3", original_name: filename, mime_type: contentType, extension: ext, bytes: body.byteLength });
  const publicUrl = `/api/public/models/${id}`;
  await env.DB.prepare(`INSERT INTO workspace_files
    (id, workspace_id, uploaded_by_user_id, related_type, related_id, title, file_url, file_type, visibility, status, metadata_json, created_at, updated_at)
    VALUES (?, ?, ?, 'product_model', 'product-3d', ?, ?, 'model3d', 'public_link', 'active', ?, ?, ?)`)
    .bind(id, workspaceId, auth.user.id, filename, publicUrl, metadata, timestamp, timestamp).run();

  return json({ ok: true, model: { id, workspace_id: workspaceId, filename, extension: ext, bytes: body.byteLength, public_url: publicUrl } }, 201);
}
