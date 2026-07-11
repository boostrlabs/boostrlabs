import {
  clean,
  json,
  jsonError,
  now,
  requireDb,
  requireSession,
  requireWorkspaceAccess
} from "../../_lib/api.js";

const MAX_BYTES = 50 * 1024 * 1024;
const BLOCKED_TYPES = new Set([
  "text/html",
  "application/javascript",
  "text/javascript",
  "application/x-msdownload",
  "application/x-sh",
  "application/x-bat"
]);
const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif"
]);

function bucket(env) {
  return env.BOOSTR_ASSETS || env.JOHANKARRD_ASSETS || env.ASSETS_BUCKET || env.R2_BUCKET || null;
}

function safeName(name = "asset") {
  return String(name || "asset")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140) || "asset";
}

function extension(name = "") {
  const match = String(name).toLowerCase().match(/\.([a-z0-9]{1,12})$/);
  return match ? match[1] : "";
}

function classify(contentType, filename) {
  const ext = extension(filename);
  if (IMAGE_TYPES.has(contentType) || ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(ext)) return "image";
  if (contentType === "application/zip" || ext === "zip") return "archive";
  return "file";
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
    "No se pudo subir el archivo.",
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

    const rawType = clean(request.headers.get("content-type"), 120).toLowerCase();
    const contentType = rawType || "application/octet-stream";
    if (BLOCKED_TYPES.has(contentType)) {
      return jsonError("unsupported_type", "Ese tipo de archivo no está permitido.", 415);
    }

    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > MAX_BYTES) return jsonError("file_too_large", "El archivo excede 50 MB.", 413);

    const url = new URL(request.url);
    const workspaceId = clean(url.searchParams.get("workspace_id") || request.headers.get("x-boostr-workspace-id"), 120);
    if (!workspaceId) return jsonError("workspace_required", "Selecciona un workspace antes de subir.", 400);
    const access = requireWorkspaceAccess(auth, workspaceId);
    if (!access.ok) return access.response;

    stage = "body";
    const body = await request.arrayBuffer();
    if (!body.byteLength) return jsonError("file_required", "El archivo llegó vacío.", 400);
    if (body.byteLength > MAX_BYTES) return jsonError("file_too_large", "El archivo excede 50 MB.", 413);

    stage = "storage";
    const store = bucket(env);
    if (!store) return jsonError("r2_missing", "Cloud storage is not configured.", 503);
    await ensureCloudSchema(env);

    const filename = clean(url.searchParams.get("filename") || request.headers.get("x-boostr-filename") || "archivo", 220);
    const title = clean(url.searchParams.get("title") || request.headers.get("x-boostr-title") || filename, 220);
    const category = clean(url.searchParams.get("category") || request.headers.get("x-boostr-category") || "inbox", 80) || "inbox";
    const source = clean(url.searchParams.get("source") || request.headers.get("x-boostr-source") || "johanka_custom_cloud", 80);
    const width = Number(url.searchParams.get("width") || request.headers.get("x-boostr-width") || 0) || null;
    const height = Number(url.searchParams.get("height") || request.headers.get("x-boostr-height") || 0) || null;
    const originalBytes = Number(url.searchParams.get("original_bytes") || request.headers.get("x-boostr-original-bytes") || body.byteLength) || body.byteLength;
    const archiveName = clean(url.searchParams.get("archive_name"), 220) || null;
    const entryPath = clean(url.searchParams.get("entry_path"), 500) || null;
    const fileType = classify(contentType, filename);

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
        filename,
        file_type: fileType,
        bytes: String(body.byteLength)
      }
    });

    const fileUrl = `/api/cloud?key=${encodeURIComponent(key)}`;
    const metadata = JSON.stringify({
      r2_key: key,
      category,
      source,
      original_name: filename,
      mime_type: contentType,
      file_type: fileType,
      bytes: body.byteLength,
      original_bytes: originalBytes,
      width,
      height,
      archive_name: archiveName,
      entry_path: entryPath
    });

    stage = "d1_write";
    await env.DB.prepare(
      `INSERT INTO workspace_files
        (id, workspace_id, uploaded_by_user_id, related_type, related_id, title, file_url, file_type, visibility, status, metadata_json, created_at, updated_at)
       VALUES (?, ?, ?, 'cloud_asset', ?, ?, ?, ?, 'workspace', 'active', ?, ?, ?)`
    ).bind(id, workspaceId, auth.user.id, category, title, fileUrl, fileType, metadata, timestamp, timestamp).run();

    storedKey = null;
    return json({
      ok: true,
      asset: {
        id,
        workspace_id: workspaceId,
        title,
        file_url: fileUrl,
        file_type: fileType,
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
