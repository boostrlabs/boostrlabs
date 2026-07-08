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

  if (!(await canAccessModule(env, workspaceId, "artist-os"))) {
    return jsonError("module_locked", "Module is locked.", 403, { module: "artist-os" });
  }

  const profile = await env.DB.prepare(
    `SELECT id, workspace_id, display_name, bio, status, created_at, updated_at
     FROM artist_profiles
     WHERE workspace_id = ?
     ORDER BY updated_at DESC
     LIMIT 1`
  )
    .bind(workspaceId)
    .first();

  return json({ ok: true, workspace_id: workspaceId, artist_profile: profile || null });
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

  if (!(await canAccessModule(env, workspaceId, "artist-os"))) {
    return jsonError("module_locked", "Module is locked.", 403, { module: "artist-os" });
  }

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const payload = parsed.payload || {};
  const displayName = clean(payload.display_name, 180);
  const bio = clean(payload.bio, 2000);
  if (!displayName && !bio) {
    return jsonError("artist_profile_fields_required", "display_name or bio is required.", 400);
  }

  const timestamp = now();
  const existing = await env.DB.prepare(
    "SELECT id FROM artist_profiles WHERE workspace_id = ? ORDER BY updated_at DESC LIMIT 1"
  )
    .bind(workspaceId)
    .first();

  const id = existing?.id || crypto.randomUUID();
  if (existing?.id) {
    await env.DB.prepare(
      `UPDATE artist_profiles
       SET display_name = ?, bio = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(displayName, bio, timestamp, id)
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO artist_profiles (
        id, workspace_id, display_name, bio, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'active', ?, ?)`
    )
      .bind(id, workspaceId, displayName, bio, timestamp, timestamp)
      .run();
  }

  await addLeadEvent(env, {
    workspace_id: workspaceId,
    event_type: "artist_profile.updated",
    payload: {
      workspace_id: workspaceId,
      artist_profile_id: id
    },
    created_at: timestamp
  });

  return json({ ok: true, id, workspace_id: workspaceId, display_name: displayName, bio, status: "active" }, existing?.id ? 200 : 201);
}
