import {
  clean,
  defaultWorkspaceId,
  json,
  jsonError,
  now,
  requireDb,
  requireSession,
  requireWorkspaceAccess
} from "../_lib/api.js";

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

function cloudError(error, stage) {
  console.error(`Johanka Cloud failed during ${stage}:`, error);
  return jsonError(
    "cloud_operation_failed",
    "No se pudo completar la operación de la nube.",
    500,
    { stage, detail: clean(error?.message || error, 500) }
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
      file_type TEXT NOT NULL DEFAULT 'link',
      visibility TEXT NOT NULL DEFAULT 'workspace',
      status TEXT NOT NULL DEFAULT 'active',
      metadata_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const info = await env.DB.prepare("PRAGMA table_info(workspace_files)").all();
  const columns = new Set((info.results || []).map((row) => row.name));
  const additions = [
    ["uploaded_by_user_id", "TEXT"],
    ["related_type", "TEXT"],
    ["related_id", "TEXT"],
    ["file_url", "TEXT"],
    ["file_type", "TEXT NOT NULL DEFAULT 'link'"],
    ["visibility", "TEXT NOT NULL DEFAULT 'workspace'"],
    ["status", "TEXT NOT NULL DEFAULT 'active'"],
    ["metadata_json", "TEXT"],
    ["created_at", "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP"],
    ["updated_at", "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP"]
  ];

  for (const [name, definition] of additions) {
    if (!columns.has(name)) {
      await env.DB.prepare(`ALTER TABLE workspace_files ADD COLUMN ${name} ${definition}`).run();
    }
  }

  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_workspace_files_workspace ON workspace_files(workspace_id, created_at DESC)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_workspace_files_related ON workspace_files(related_type, related_id)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_workspace_files_status ON workspace_files(status)").run();
}

function resolveWorkspace(auth, requested) {
  const workspaceId = clean(requested, 120) || defaultWorkspaceId(auth);
  if (!workspaceId) {
    return { ok: false, response: jsonError("workspace_required", "Selecciona un workspace antes de subir.", 400) };
  }
  const access = requireWorkspaceAccess(auth, workspaceId);
  if (!access.ok) return { ok: false, response: access.response };
  return { ok: true, workspace_id: workspaceId };
}

function cloudKeyWorkspace(key = "") {
  const match = String(key).match(/^cloud\/([^/]+)\//);
  return match ? match[1] : null;
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

    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (key) {
      stage = "asset_access";
      const workspaceId = cloudKeyWorkspace(key);
      if (!workspaceId || key.includes("..")) return jsonError("invalid_asset_key", "Invalid asset key.", 400);
      const access = requireWorkspaceAccess(auth, workspaceId);
      if (!access.ok) return access.response;

      stage = "asset_read";
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
      return new Response(object.body, { headers });
    }

    stage = "schema";
    await ensureCloudSchema(env);

    stage = "workspace";
    const workspace = resolveWorkspace(auth, url.searchParams.get("workspace_id"));
    if (!workspace.ok) return workspace.response;

    const q = clean(url.searchParams.get("q"), 120).toLowerCase();
    const category = clean(url.searchParams.get("category"), 80);
    const filters = ["workspace_id = ?", "status = 'active'", "related_type = 'cloud_asset'"];
    const binds = [workspace.workspace_id];

    if (q) {
      filters.push("lower(title) LIKE ?");
      binds.push(`%${q}%`);
    }
    if (category) {
      filters.push("metadata_json LIKE ?");
      binds.push(`%\"category\":\"${category.replace(/[\"%_]/g, "")}\"%`);
    }

    stage = "list";
    const result = await env.DB.prepare(
      `SELECT id, workspace_id, uploaded_by_user_id, title, file_url, file_type, visibility, metadata_json, created_at, updated_at
       FROM workspace_files
       WHERE ${filters.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT 200`
    ).bind(...binds).all();

    return json({
      ok: true,
      workspace_id: workspace.workspace_id,
      assets: (result.results || []).map((item) => {
        let metadata = {};
        try { metadata = JSON.parse(item.metadata_json || "{}"); } catch {}
        return { ...item, metadata };
      })
    });
  } catch (error) {
    return cloudError(error, stage);
  }
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  let stage = "auth";
  let storedKey = null;
  try {
    const auth = await requireSession(request, env);
    if (!auth.ok) return auth.response;

    stage = "schema";
    await ensureCloudSchema(env);

    stage = "storage";
    const store = bucket(env);
    if (!store) return jsonError("r2_missing", "Cloud storage is not configured.", 503);

    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > MAX_BYTES + 2 * 1024 * 1024) return jsonError("file_too_large", "File is too large.", 413);

    stage = "form";
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return jsonError("file_required", "Choose an image first.", 400);
    if (!ALLOWED_TYPES.has(file.type)) return jsonError("unsupported_type", "Use JPG, PNG, WEBP or GIF.", 415);
    if (!file.size || file.size > MAX_BYTES) return jsonError("file_too_large", "File is too large.", 413);

    stage = "workspace";
    const workspace = resolveWorkspace(auth, form.get("workspace_id"));
    if (!workspace.ok) return workspace.response;

    const title = clean(form.get("title") || file.name || "Asset", 180);
    const category = clean(form.get("category") || "inbox", 80) || "inbox";
    const source = clean(form.get("source") || "custom_cloud", 80);
    const width = Number(form.get("width") || 0) || null;
    const height = Number(form.get("height") || 0) || null;
    const originalBytes = Number(form.get("original_bytes") || file.size) || file.size;
    const id = crypto.randomUUID();
    const timestamp = now();
    const key = `cloud/${workspace.workspace_id}/${auth.user.id}/${Date.now()}-${id}-${safeName(file.name)}`;
    storedKey = key;
    const body = await file.arrayBuffer();

    stage = "r2_write";
    await store.put(key, body, {
      httpMetadata: { contentType: file.type },
      customMetadata: {
        workspace_id: workspace.workspace_id,
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
      original_name: file.name,
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
    ).bind(id, workspace.workspace_id, auth.user.id, category, title, fileUrl, metadata, timestamp, timestamp).run();

    storedKey = null;
    return json({
      ok: true,
      asset: {
        id,
        workspace_id: workspace.workspace_id,
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

    stage = "schema";
    await ensureCloudSchema(env);

    stage = "payload";
    const payload = await request.json().catch(() => null);
    const id = clean(payload?.id, 120);
    if (!id) return jsonError("asset_id_required", "Asset id is required.", 400);

    stage = "lookup";
    const record = await env.DB.prepare(
      "SELECT id, workspace_id, file_url, metadata_json FROM workspace_files WHERE id = ? AND related_type = 'cloud_asset' LIMIT 1"
    ).bind(id).first();
    if (!record?.id) return jsonError("asset_not_found", "Asset not found.", 404);

    const access = requireWorkspaceAccess(auth, record.workspace_id);
    if (!access.ok) return access.response;

    stage = "archive";
    await env.DB.prepare("UPDATE workspace_files SET status = 'archived', updated_at = ? WHERE id = ?")
      .bind(now(), id).run();

    let key = null;
    try { key = JSON.parse(record.metadata_json || "{}").r2_key || null; } catch {}
    const store = bucket(env);
    if (store && key) await store.delete(key).catch(() => {});

    return json({ ok: true, archived: id });
  } catch (error) {
    return cloudError(error, stage);
  }
}
