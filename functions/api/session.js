import { json, requireDb, requireSession } from "../_lib/api.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const activeWorkspaceId = auth.active_workspace_id;
  const activeMembership = auth.memberships.find((item) => item.workspace_id === activeWorkspaceId) || null;
  const moduleQuery = activeWorkspaceId
    ? env.DB.prepare(
        `SELECT modules.slug, modules.name, modules.category,
                COALESCE(workspace_modules.status, 'locked') AS status
         FROM modules
         LEFT JOIN workspace_modules
           ON workspace_modules.module_id = modules.id
          AND workspace_modules.workspace_id = ?
         ORDER BY modules.category, modules.name`
      ).bind(activeWorkspaceId)
    : env.DB.prepare(
        `SELECT slug, name, category, status
         FROM modules
         ORDER BY category, name`
      );

  const modules = await moduleQuery.all();

  return json({
    ok: true,
    user: auth.user,
    role: activeMembership?.role || auth.roles[0] || auth.user.role,
    roles: auth.roles,
    workspaces: auth.memberships.map((item) => ({
      id: item.workspace_id,
      name: item.workspace_name,
      type: item.workspace_type,
      slug: item.workspace_slug,
      role: item.role
    })),
    active_workspace: activeWorkspaceId
      ? {
          id: activeWorkspaceId,
          name: activeMembership?.workspace_name || null,
          type: activeMembership?.workspace_type || null,
          slug: activeMembership?.workspace_slug || null
        }
      : null,
    visible_modules: modules.results || []
  });
}
