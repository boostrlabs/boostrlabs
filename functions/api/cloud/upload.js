import {
  clean,
  json,
  jsonError,
  now,
  requireDb,
  requireSession,
  requireWorkspaceAccess
} from "../../_lib/api.js";

const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function bucket(env) {
  return env.BOOSTR_ASSETS || env.JOHANKARRD_ASSETS || env.ASSETS_BUCKET || env.R2_BUCKET || null;
}

function safeName(name = "asset") {
  return String(name || "asset")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "asset";
}

async function ensureCloudSchema(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS workspace_files (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      uploaded_by_user_id TEXT,
      related_type TEXT,
      related_id TEXT,
      title TEXT NOT NULL,
      file_url TEXT,
      file_type TEXT DEFAULT 'link',
      visibility TEXT DEFAULT 'workspace',
      status TEXT DEFAULT 'active',
      metadata_json TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();
}

function fail(error, stage) {
  console.error(`Johanka Cloud binary upload failed during ${stage}:`, error);
  return jsonError(
    "cloud_upload_failed",
    "No se pudo subir la imagen.",
    500,
    { stage, detail: clean(error?.message || error, 500) }
  );
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  let stage = "auth";
  let storedKey = null;
  try {
    const auth = await requireSession(request, env);
    if (!auth.ok) return auth.response;

    const contentType = clean(request.headers.get("content-type"), 120).toLowerCase();
    if (!ALLOWED_TYPES.has(contentType)) {
      return jsonError("unsupported_type", `Formato no soportado: ${contentType || "desconocido"}. Usa JPG, PNG, WEBP o GIF.`, 415);
    }

    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > MAX_BYTES) return jsonError("file_too_large", "La imagen excede 12 MB.", 413);

    const url = new URL(request.url);
    const workspaceId = clean(url.searchParams.get("workspace_id") || request.headers.get("x-boostr-workspace-id"), 120);
    if (!workspaceId) return jsonError("workspace_required", "Selecciona un workspace antes de subir.", 400);
    const access = requireWorkspaceAccess(auth, workspaceId);
    if (!access.ok) return access.response;

    stage = "body";
    const body = await request.arrayBuffer();
    if (!body.byteLength) return jsonError("file_required", "La imagen llegó vacía.", 400);
    if (body.byteLength > MAX_BYTES) return jsonError("file_too_large", "La imagen excede 12 MB.", 413);

    stage = "storage";
    const store = bucket(env);
    if (!store) return jsonError("r2_missing", "Cloud storage is not configured.", 503);

    await ensureCloudSchema(env);

    const filename = clean(url.searchParams.get("filename") || request.headers.get("x-boostr-filename") || "imagen", 180);
    const title = clean(url.searchParams.get("title") || request.headers.get("x-boostr-title") || filename, 180);
    const category = clean(url.searchParams.get("category") || request.headers.get("x-boostr-category") || "inbox", 80) || "inbox";
    const source = clean(url.searchParams.get("source") || request.headers.get("x-boostr-source") || "johanka_custom_cloud", 80);
    const width = Number(url.searchParams.get("width") || request.headers.get("x-boostr-width") || 0) || null;
    const height = Number(url.searchParams.get("height") || request.headers.get("x-boostr-height") || 0) || null;
    const originalBytes = Number(url.searchParams.get("original_bytes") || request.headers.get("x-boostr-original-bytes") || body.byteLength) || body.byteLength;

    const id = crypto.randomUUID();
    const timestamp = now();
    const key = `cloud/${workspaceId}/${auth.user.id}/${Date.now()}-${id}-${safeName(filename)}`;
    storedKey = key;

    stage = "r2_write";
    await store.put(key, body, {
      httpMetadata: { contentType },
      customMetadata: {
        workspace_id: workspaceId,
        uploaded_by_user_id: auth.user.id,
        category,
        source,
        bytes: String(body.byteLength)
      }
    });

    const fileUrl = `/api/cloud?key=${encodeURIComponent(key)}`;
    const metadata = JSON.stringify({
      r2_key: key,
      category,
      source,
      original_name: filename,
      bytes: body.byteLength,
      original_bytes: originalBytes,
      width,
      height
    });

    stage = "d1_write";
    await env.DB.prepare(
      `INSERT INTO workspace_files
        (id, workspace_id, uploaded_by_user_id, related_type, related_id, title, file_url, file_type, visibility, status, metadata_json, created_at, updated_at)
       VALUES (?, ?, ?, 'cloud_asset', ?, ?, ?, 'image', 'workspace', 'active', ?, ?, ?)`
    ).bind(id, workspaceId, auth.user.id, category, title, fileUrl, metadata, timestamp, timestamp).run();

    storedKey = null;
    return json({
      ok: true,
      asset: {
        id,
        workspace_id: workspaceId,
        title,
        file_url: fileUrl,
        file_type: "image",
        category,
        bytes: body.byteLength,
        created_at: timestamp
      }
    }, 201);
  } catch (error) {
    if (storedKey) {
      try { await bucket(env)?.delete(storedKey); } catch {}
    }
    return fail(error, stage);
  }
}
