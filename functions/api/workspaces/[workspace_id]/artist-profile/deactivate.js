import {
  addLeadEvent,
  canAccessModule,
  clean,
  json,
  jsonError,
  now,
  requireDb,
  requireRole,
  requireWorkspaceAccess
} from "../../../../_lib/api.js";

export async function onRequestOptions() {
  return json({ ok: true });
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

  const existing = await env.DB.prepare(
    "SELECT id FROM artist_profiles WHERE workspace_id = ? ORDER BY updated_at DESC LIMIT 1"
  )
    .bind(workspaceId)
    .first();

  if (!existing?.id) {
    return jsonError("artist_profile_not_found", "Artist profile not found.", 404);
  }

  const timestamp = now();
  await env.DB.prepare(
    `UPDATE artist_profiles
     SET status = 'locked', updated_at = ?
     WHERE id = ?`
  )
    .bind(timestamp, existing.id)
    .run();

  await addLeadEvent(env, {
    workspace_id: workspaceId,
    event_type: "artist_profile.deactivated",
    payload: {
      workspace_id: workspaceId,
      artist_profile_id: existing.id
    },
    created_at: timestamp
  });

  return json({ ok: true, id: existing.id, workspace_id: workspaceId, status: "locked" });
}
