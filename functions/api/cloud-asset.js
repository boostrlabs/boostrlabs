import {
  authCanSeeAll,
  clean,
  json,
  jsonError,
  requireDb,
  requireSession,
  requireWorkspaceAccess
} from "../_lib/api.js";

function bucket(env) {
  return env.BOOSTR_ASSETS || env.JOHANKARRD_ASSETS || env.ASSETS_BUCKET || env.R2_BUCKET || null;
}

function parseMetadata(record) {
  try { return JSON.parse(record?.metadata_json || "{}"); } catch { return {}; }
}

function workspaceFromKey(key = "") {
  const match = String(key).match(/^cloud\/([^/]+)\//);
  return match ? clean(match[1], 120) : null;
}

async function canRead(auth, record) {
  if (!record?.workspace_id) return false;
  if (authCanSeeAll(auth)) return true;
  const access = requireWorkspaceAccess(auth, record.workspace_id);
  if (!access.ok) return false;
  if (record.uploaded_by_user_id === auth.user.id) return true;

  const metadata = parseMetadata(record);
  const visibility = clean(record.visibility || metadata.visibility || "workspace", 30).toLowerCase();
  if (visibility === "workspace") return true;
  if (visibility === "users") {
    const allowed = Array.isArray(metadata.allowed_user_ids) ? metadata.allowed_user_ids : [];
    return allowed.includes(auth.user.id);
  }
  if (visibility === "role") {
    const allowed = Array.isArray(metadata.allowed_roles) ? metadata.allowed_roles : [];
    return auth.roles?.some((role) => allowed.includes(role)) || false;
  }
  return false;
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  try {
    const auth = await requireSession(request, env);
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const key = clean(url.searchParams.get("key"), 1000);
    if (!key || !key.startsWith("cloud/") || key.includes("..")) {
      return jsonError("invalid_asset_key", "Invalid asset key.", 400);
    }

    const workspaceId = workspaceFromKey(key);
    if (!workspaceId) return jsonError("invalid_asset_key", "Invalid asset key.", 400);

    const encodedUrl = `/api/cloud?key=${encodeURIComponent(key)}`;
    const fastUrl = `/api/cloud-asset?key=${encodeURIComponent(key)}`;
    let record = await env.DB.prepare(
      `SELECT id, workspace_id, uploaded_by_user_id, visibility, metadata_json
       FROM workspace_files
       WHERE workspace_id = ? AND related_type = 'cloud_asset' AND status = 'active'
         AND (file_url = ? OR file_url = ?)
       LIMIT 1`
    ).bind(workspaceId, encodedUrl, fastUrl).first();

    if (!record?.id) {
      const candidates = await env.DB.prepare(
        `SELECT id, workspace_id, uploaded_by_user_id, visibility, metadata_json
         FROM workspace_files
         WHERE workspace_id = ? AND related_type = 'cloud_asset' AND status = 'active'
         ORDER BY created_at DESC LIMIT 400`
      ).bind(workspaceId).all();
      record = (candidates.results || []).find((item) => parseMetadata(item).r2_key === key) || null;
    }

    if (!record?.id) return jsonError("asset_not_found", "Asset not found.", 404);
    if (!(await canRead(auth, record))) return jsonError("cloud_access_denied", "No tienes acceso a este archivo.", 403);

    const store = bucket(env);
    if (!store) return jsonError("r2_missing", "Cloud storage is not configured.", 503);
    const object = await store.get(key);
    if (!object) return jsonError("asset_not_found", "Asset not found.", 404);

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "private, max-age=3600");
    headers.set("x-content-type-options", "nosniff");
    headers.set("content-disposition", "inline");
    if (!headers.get("content-type")) headers.set("content-type", "application/octet-stream");
    if (object.size) headers.set("content-length", String(object.size));
    return new Response(object.body, { headers });
  } catch (error) {
    console.error("BOOSTR Cloud asset delivery failed:", error);
    return jsonError("cloud_asset_failed", "No se pudo cargar este archivo.", 500, {
      detail: clean(error?.message || error, 500)
    });
  }
}
