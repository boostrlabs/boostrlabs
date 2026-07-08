import {
  addLeadEvent,
  canAccessModule,
  clean,
  json,
  jsonError,
  now,
  readJson,
  requireDb,
  requireRole,
  requireWorkspaceAccess
} from "../../../_lib/api.js";

const allRoles = ["admin", "manager", "partner", "client", "artist"];

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, allRoles);
  if (!auth.ok) return auth.response;

  const workspaceId = clean(params.workspace_id, 120);
  if (!workspaceId) {
    return jsonError("workspace_id_required", "workspace_id is required.", 400);
  }
  const workspaceAccess = requireWorkspaceAccess(auth, workspaceId);
  if (!workspaceAccess.ok) return workspaceAccess.response;

  if (!(await canAccessModule(env, workspaceId, "smart-links"))) {
    return jsonError("module_locked", "Module is locked.", 403, { module: "smart-links" });
  }

  const result = await env.DB.prepare(
    `SELECT id, workspace_id, slug, target_url, status, created_at, updated_at
     FROM smart_links
     WHERE workspace_id = ?
     ORDER BY created_at DESC`
  )
    .bind(workspaceId)
    .all();

  return json({ ok: true, workspace_id: workspaceId, smart_links: result.results || [] });
}

export async function onRequestPost({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, ["admin", "manager"]);
  if (!auth.ok) return auth.response;

  const workspaceId = clean(params.workspace_id, 120);
  if (!workspaceId) {
    return jsonError("workspace_id_required", "workspace_id is required.", 400);
  }
  const workspaceAccess = requireWorkspaceAccess(auth, workspaceId);
  if (!workspaceAccess.ok) return workspaceAccess.response;

  if (!(await canAccessModule(env, workspaceId, "smart-links"))) {
    return jsonError("module_locked", "Module is locked.", 403, { module: "smart-links" });
  }

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const payload = parsed.payload || {};
  const slug = clean(payload.slug, 120);
  const targetUrl = clean(payload.target_url, 1000);
  if (!slug || !targetUrl) {
    return jsonError("smart_link_fields_required", "slug and target_url are required.", 400);
  }

  const existing = await env.DB.prepare(
    "SELECT id FROM smart_links WHERE workspace_id = ? AND slug = ? LIMIT 1"
  )
    .bind(workspaceId, slug)
    .first();

  if (existing?.id) {
    return jsonError("smart_link_slug_exists", "Smart link slug already exists for this workspace.", 409);
  }

  const id = crypto.randomUUID();
  const timestamp = now();
  await env.DB.prepare(
    `INSERT INTO smart_links (
      id, workspace_id, slug, target_url, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'active', ?, ?)`
  )
    .bind(id, workspaceId, slug, targetUrl, timestamp, timestamp)
    .run();

  await addLeadEvent(env, {
    workspace_id: workspaceId,
    event_type: "smart_link.created",
    payload: {
      workspace_id: workspaceId,
      smart_link_id: id,
      slug,
      target_url: targetUrl
    },
    created_at: timestamp
  });

  return json({ ok: true, id, workspace_id: workspaceId, slug, target_url: targetUrl, status: "active" }, 201);
}
