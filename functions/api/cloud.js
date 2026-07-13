import {
  authCanSeeAll,
  canAccessModule,
  clean,
  defaultWorkspaceId,
  json,
  jsonError,
  now,
  requireDb,
  requireSession,
  requireWorkspaceAccess
} from "../_lib/api.js";

function bucket(env) {
  return env.BOOSTR_ASSETS || env.JOHANKARRD_ASSETS || env.ASSETS_BUCKET || env.R2_BUCKET || null;
}

function cloudError(error, stage) {
  console.error(`BOOSTR Cloud failed during ${stage}:`, error);
  return jsonError(
    "cloud_operation_failed",
    "No se pudo completar la operación de BOOSTR Cloud.",
    500,
    { stage, detail: clean(error?.message || error, 500) },
    { "Content-Type": "application/json; charset=utf-8" }
  );
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

  const info = await env.DB.prepare("PRAGMA table_info(workspace_files)").all();
  const columns = new Set((info.results || []).map((row) => row.name));
  const additions = [
    ["uploaded_by_user_id", "TEXT"], ["related_type", "TEXT"], ["related_id", "TEXT"],
    ["file_url", "TEXT"], ["file_type", "TEXT"], ["visibility", "TEXT"],
    ["status", "TEXT"], ["metadata_json", "TEXT"], ["created_at", "TEXT"], ["updated_at", "TEXT"]
  ];
  for (const [name, definition] of additions) {
    if (!columns.has(name)) await env.DB.prepare(`ALTER TABLE workspace_files ADD COLUMN ${name} ${definition}`).run();
  }

  await env.DB.prepare(`
    UPDATE workspace_files
    SET file_type = COALESCE(NULLIF(file_type, ''), 'link'),
        visibility = COALESCE(NULLIF(visibility, ''), 'workspace'),
        status = COALESCE(NULLIF(status, ''), 'active'),
        created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
        updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
    WHERE file_type IS NULL OR file_type = '' OR visibility IS NULL OR visibility = ''
       OR status IS NULL OR status = '' OR created_at IS NULL OR updated_at IS NULL
  `).run();

  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_workspace_files_workspace ON workspace_files(workspace_id, created_at DESC)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_workspace_files_related ON workspace_files(related_type, related_id)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_workspace_files_status ON workspace_files(status)").run();
}

function resolveWorkspace(auth, requested) {
  const workspaceId = clean(requested, 120) || defaultWorkspaceId(auth);
  if (!workspaceId) return { ok: false, response: jsonError("workspace_required", "Selecciona un workspace.", 400) };
  const access = requireWorkspaceAccess(auth, workspaceId);
  if (!access.ok) return { ok: false, response: access.response };
  return { ok: true, workspace_id: workspaceId };
}

function parseMetadata(record) {
  try { return JSON.parse(record?.metadata_json || "{}"); } catch { return {}; }
}

function cloudKeyWorkspace(key = "") {
  const match = String(key).match(/^cloud\/([^/]+)\//);
  return match ? clean(match[1], 120) : null;
}

async function findRecordByKey(env, key) {
  const fields = "id, workspace_id, uploaded_by_user_id, related_id, title, file_url, file_type, visibility, metadata_json, created_at, updated_at";
  const encodedUrl = `/api/cloud?key=${encodeURIComponent(key)}`;
  const rawUrl = `/api/cloud?key=${key}`;

  let record = await env.DB.prepare(
    `SELECT ${fields}
     FROM workspace_files
     WHERE related_type = 'cloud_asset'
       AND status = 'active'
       AND (file_url = ? OR file_url = ?)
     LIMIT 1`
  ).bind(encodedUrl, rawUrl).first();

  if (record?.id) return record;

  const workspaceId = cloudKeyWorkspace(key);
  if (!workspaceId) return null;

  const candidates = await env.DB.prepare(
    `SELECT ${fields}
     FROM workspace_files
     WHERE workspace_id = ?
       AND related_type = 'cloud_asset'
       AND status = 'active'
     ORDER BY created_at DESC
     LIMIT 1000`
  ).bind(workspaceId).all();

  return (candidates.results || []).find((item) => parseMetadata(item).r2_key === key) || null;
}

async function canReadRecord(auth, env, record) {
  if (!record?.workspace_id) return false;
  if (authCanSeeAll(auth)) return true;
  const workspaceAccess = requireWorkspaceAccess(auth, record.workspace_id);
  if (!workspaceAccess.ok) return false;
  if (record.uploaded_by_user_id === auth.user.id) return true;

  const metadata = parseMetadata(record);
  const visibility = clean(record.visibility || metadata.visibility || "workspace", 30).toLowerCase();
  if (visibility === "private") return false;
  if (visibility === "workspace") return true;
  if (visibility === "role") {
    const allowed = Array.isArray(metadata.allowed_roles) ? metadata.allowed_roles : [];
    return auth.roles?.some((role) => allowed.includes(role)) || false;
  }
  if (visibility === "users") {
    const allowed = Array.isArray(metadata.allowed_user_ids) ? metadata.allowed_user_ids : [];
    return allowed.includes(auth.user.id);
  }
  if (visibility === "module") {
    const moduleSlug = clean(metadata.module_slug || record.related_id, 120);
    return moduleSlug ? canAccessModule(env, record.workspace_id, moduleSlug) : false;
  }
  return false;
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  let stage = "auth";
  try {
    const auth = await requireSession(request, env);
    if (!auth.ok) return auth.response;
    await ensureCloudSchema(env);

    const url = new URL(request.url);
    const key = clean(url.searchParams.get("key"), 1000);
    if (key) {
      if (!key.startsWith("cloud/") || key.includes("..")) return jsonError("invalid_asset_key", "Invalid asset key.", 400);
      stage = "asset_lookup";
      const record = await findRecordByKey(env, key);
      if (!record?.id) return jsonError("asset_not_found", "Asset not found.", 404);
      if (!(await canReadRecord(auth, env, record))) return jsonError("cloud_access_denied", "No tienes acceso a este archivo.", 403);

      stage = "asset_read";
      const store = bucket(env);
      if (!store) return jsonError("r2_missing", "Cloud storage is not configured.", 503);
      const object = await store.get(key);
      if (!object) return jsonError("asset_not_found", "Asset not found.", 404);
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("cache-control", "private, max-age=300");
      headers.set("x-content-type-options", "nosniff");
      headers.set("content-disposition", "inline");
      if (!headers.get("content-type")) headers.set("content-type", "application/octet-stream");
      if (object.size) headers.set("content-length", String(object.size));
      return new Response(object.body, { headers });
    }

    stage = "workspace";
    const workspace = resolveWorkspace(auth, url.searchParams.get("workspace_id"));
    if (!workspace.ok) return workspace.response;

    const q = clean(url.searchParams.get("q"), 120).toLowerCase().replace(/[%_]/g, "");
    const category = clean(url.searchParams.get("category"), 80);
    const moduleSlug = clean(url.searchParams.get("module_slug"), 120);
    const filters = ["workspace_id = ?", "status = 'active'", "related_type = 'cloud_asset'"];
    const binds = [workspace.workspace_id];
    if (q) {
      filters.push("lower(title) LIKE ?");
      binds.push(`%${q}%`);
    }

    stage = "list";
    const result = await env.DB.prepare(
      `SELECT id, workspace_id, uploaded_by_user_id, related_id, title, file_url, file_type, visibility, metadata_json, created_at, updated_at
       FROM workspace_files WHERE ${filters.join(" AND ")} ORDER BY created_at DESC LIMIT 400`
    ).bind(...binds).all();

    const visible = [];
    for (const item of result.results || []) {
      const metadata = parseMetadata(item);
      if (category && metadata.category !== category) continue;
      if (moduleSlug && clean(metadata.module_slug || item.related_id, 120) !== moduleSlug) continue;
      if (await canReadRecord(auth, env, item)) visible.push({ ...item, metadata });
    }
    return json({ ok: true, workspace_id: workspace.workspace_id, assets: visible.slice(0, 200) });
  } catch (error) {
    return cloudError(error, stage);
  }
}

export async function onRequestDelete({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  let stage = "auth";
  try {
    const auth = await requireSession(request, env);
    if (!auth.ok) return auth.response;
    await ensureCloudSchema(env);
    const payload = await request.json().catch(() => null);
    const id = clean(payload?.id, 120);
    if (!id) return jsonError("asset_id_required", "Asset id is required.", 400);

    stage = "lookup";
    const record = await env.DB.prepare(
      "SELECT id, workspace_id, uploaded_by_user_id, metadata_json FROM workspace_files WHERE id = ? AND related_type = 'cloud_asset' LIMIT 1"
    ).bind(id).first();
    if (!record?.id) return jsonError("asset_not_found", "Asset not found.", 404);
    const workspaceAccess = requireWorkspaceAccess(auth, record.workspace_id);
    if (!workspaceAccess.ok) return workspaceAccess.response;
    if (!authCanSeeAll(auth) && record.uploaded_by_user_id !== auth.user.id) {
      return jsonError("cloud_delete_denied", "Solo quien subió el archivo o un manager puede archivarlo.", 403);
    }

    stage = "archive";
    await env.DB.prepare("UPDATE workspace_files SET status = 'archived', updated_at = ? WHERE id = ?").bind(now(), id).run();
    const metadata = parseMetadata(record);
    const store = bucket(env);
    if (store && metadata.r2_key) await store.delete(metadata.r2_key).catch(() => {});
    return json({ ok: true, archived: id });
  } catch (error) {
    return cloudError(error, stage);
  }
}
