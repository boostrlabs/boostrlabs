import { defaultWorkspaceId, json, requireDb, requireSession } from "../_lib/api.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const workspaceId = defaultWorkspaceId(auth);
  if (!workspaceId) {
    return json({ ok: true, workspace: null, persona: null, cards: [], onboarding_status: "no_workspace" });
  }

  const membership = auth.memberships.find((item) => item.workspace_id === workspaceId) || null;
  const [personaResult, pref, cardResult, activityResult] = await Promise.all([
    env.DB.prepare(
      `SELECT id, persona_type, display_name, status, metadata_json, created_at, updated_at
       FROM personas
       WHERE workspace_id = ? AND user_id = ? AND status = 'active'
       ORDER BY created_at ASC
       LIMIT 1`
    ).bind(workspaceId, auth.user.id).first(),
    env.DB.prepare(
      `SELECT default_mode, default_persona_id, default_language, card_density, show_demo_labels, reduce_motion
       FROM workspace_preferences
       WHERE workspace_id = ?
       LIMIT 1`
    ).bind(workspaceId).first(),
    env.DB.prepare(
      `SELECT id, card_type, title, summary, priority, status, action_label, action_url, metadata_json, created_at, updated_at
       FROM cards
       WHERE workspace_id = ?
         AND (user_id IS NULL OR user_id = ?)
         AND status != 'archived'
       ORDER BY priority DESC, created_at DESC
       LIMIT 40`
    ).bind(workspaceId, auth.user.id).all(),
    env.DB.prepare(
      `SELECT id, event_type, title, body, metadata_json, created_at
       FROM activity_events
       WHERE workspace_id = ?
       ORDER BY created_at DESC
       LIMIT 12`
    ).bind(workspaceId).all()
  ]);

  return json({
    ok: true,
    user: auth.user,
    workspace: {
      id: workspaceId,
      name: membership?.workspace_name || null,
      type: membership?.workspace_type || null,
      slug: membership?.workspace_slug || null,
      role: membership?.role || auth.user.role
    },
    persona: personaResult || null,
    preferences: pref || null,
    onboarding_status: "first_run",
    cards: cardResult.results || [],
    activity: activityResult.results || []
  });
}
