import { authCanSeeAll, json, requireDb, requireRole } from "../_lib/api.js";

const allRoles = ["admin", "manager", "partner", "client", "artist"];

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, allRoles);
  if (!auth.ok) return auth.response;

  if (authCanSeeAll(auth)) {
    const result = await env.DB.prepare(
      `SELECT workspaces.id, workspaces.name, workspaces.type, workspaces.slug,
              workspaces.owner_email, workspaces.status, workspaces.created_at, workspaces.updated_at,
              COUNT(workspace_members.id) AS members_total
       FROM workspaces
       LEFT JOIN workspace_members ON workspace_members.workspace_id = workspaces.id
       GROUP BY workspaces.id
       ORDER BY workspaces.created_at DESC`
    ).all();

    return json({
      ok: true,
      active_workspace_id: auth.active_workspace_id,
      workspaces: result.results || []
    });
  }

  return json({
    ok: true,
    active_workspace_id: auth.active_workspace_id,
    workspaces: auth.memberships.map((item) => ({
      id: item.workspace_id,
      name: item.workspace_name,
      type: item.workspace_type,
      slug: item.workspace_slug,
      role: item.role,
      status: item.status
    }))
  });
}
