import { defaultWorkspaceId, json, requireDb, requireSession } from "../_lib/api.js";

const safeAll = async (statement, fallback = []) => {
  try {
    const result = await statement.all();
    return result.results || fallback;
  } catch {
    return fallback;
  }
};

const safeFirst = async (statement, fallback = null) => {
  try {
    return (await statement.first()) || fallback;
  } catch {
    return fallback;
  }
};

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const workspaceId = defaultWorkspaceId(auth);
  const membership = auth.memberships.find((item) => item.workspace_id === workspaceId) || null;

  const [personas, cards, activity, notifications, contacts, preferences, modules, sessions] = await Promise.all([
    safeAll(
      env.DB.prepare(
        `SELECT id, workspace_id, user_id, persona_type, display_name, status, metadata_json, created_at, updated_at
         FROM personas
         WHERE user_id = ? AND status = 'active'
         ORDER BY created_at ASC`
      ).bind(auth.user.id)
    ),
    workspaceId
      ? safeAll(
          env.DB.prepare(
            `SELECT id, workspace_id, user_id, card_type, title, summary, priority, status,
                    action_label, action_url, metadata_json, created_at, updated_at
             FROM cards
             WHERE workspace_id = ?
               AND (user_id IS NULL OR user_id = ?)
               AND status != 'archived'
             ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
                      updated_at DESC
             LIMIT 60`
          ).bind(workspaceId, auth.user.id)
        )
      : [],
    workspaceId
      ? safeAll(
          env.DB.prepare(
            `SELECT id, event_type, title, body, metadata_json, created_at
             FROM activity_events
             WHERE workspace_id = ?
             ORDER BY created_at DESC
             LIMIT 20`
          ).bind(workspaceId)
        )
      : [],
    workspaceId
      ? safeAll(
          env.DB.prepare(
            `SELECT id, title, body, status, metadata_json, created_at, updated_at
             FROM notifications
             WHERE user_id = ? AND (workspace_id = ? OR workspace_id IS NULL)
             ORDER BY created_at DESC
             LIMIT 20`
          ).bind(auth.user.id, workspaceId)
        )
      : [],
    safeAll(
      env.DB.prepare(
        `SELECT id, contact_type, label, value, visibility, verified, created_at, updated_at
         FROM profile_contacts
         WHERE user_id = ?
         ORDER BY contact_type ASC`
      ).bind(auth.user.id)
    ),
    workspaceId
      ? safeFirst(
          env.DB.prepare(
            `SELECT default_mode, default_persona_id, default_language, card_density,
                    show_demo_labels, reduce_motion, updated_at
             FROM workspace_preferences
             WHERE workspace_id = ? LIMIT 1`
          ).bind(workspaceId)
        )
      : null,
    workspaceId
      ? safeAll(
          env.DB.prepare(
            `SELECT modules.id, modules.slug, modules.name, modules.category,
                    COALESCE(workspace_modules.status, 'locked') AS status
             FROM modules
             LEFT JOIN workspace_modules
               ON workspace_modules.module_id = modules.id
              AND workspace_modules.workspace_id = ?
             ORDER BY modules.category, modules.name`
          ).bind(workspaceId)
        )
      : [],
    safeAll(
      env.DB.prepare(
        `SELECT id, status, created_at, updated_at, last_seen_at, ip, user_agent, expires_at
         FROM sessions
         WHERE user_id = ? AND status = 'active' AND revoked_at IS NULL
         ORDER BY last_seen_at DESC
         LIMIT 12`
      ).bind(auth.user.id)
    )
  ]);

  const workspaces = auth.memberships.map((item) => ({
    id: item.workspace_id,
    name: item.workspace_name,
    type: item.workspace_type,
    slug: item.workspace_slug,
    role: item.role,
    status: item.status
  }));

  return json({
    ok: true,
    production_mode: true,
    demo_mode: false,
    user: auth.user,
    roles: auth.roles,
    workspaces,
    active_workspace: workspaceId
      ? {
          id: workspaceId,
          name: membership?.workspace_name || null,
          type: membership?.workspace_type || null,
          slug: membership?.workspace_slug || null,
          role: membership?.role || auth.user.role
        }
      : null,
    personas,
    cards,
    activity,
    notifications,
    contacts,
    preferences,
    modules,
    sessions,
    routes: {
      janko_missions: "/hummusfl/manager-missions/",
      johanka_missions: "/hummusfl/creative-missions/",
      hummus_workspace: "/partner-dashboard",
      admin: "/admin",
      manager: "/manager",
      audit: "/audit",
      files: "/app/files",
      products: "/manager/payment-links",
      janko_public: "/jankodiorr",
      boostr_home: "/home"
    }
  });
}
