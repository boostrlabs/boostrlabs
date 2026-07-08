import { addLeadEvent, canAccessModule, clean, json, managerAuth, now, requireDb } from "../../../../_lib/api.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = managerAuth(request, env);
  if (!auth.ok) return auth.response;

  const workspaceId = clean(params.workspace_id, 120);
  if (!workspaceId) {
    return json({ ok: false, error: "workspace_id is required." }, 400);
  }

  if (!(await canAccessModule(env, workspaceId, "artist-os"))) {
    return json({ error: "module_locked", module: "artist-os" }, 403);
  }

  const existing = await env.DB.prepare(
    "SELECT id FROM artist_profiles WHERE workspace_id = ? ORDER BY updated_at DESC LIMIT 1"
  )
    .bind(workspaceId)
    .first();

  if (!existing?.id) {
    return json({ ok: false, error: "Artist profile not found." }, 404);
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
    event_type: "artist_profile.deactivated",
    payload: {
      workspace_id: workspaceId,
      artist_profile_id: existing.id
    },
    created_at: timestamp
  });

  return json({ ok: true, id: existing.id, workspace_id: workspaceId, status: "locked" });
}
