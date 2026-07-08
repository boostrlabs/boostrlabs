import { json, requireDb, requireRole } from "../../_lib/api.js";
import { customOsRoles, resolveWorkspaceForRequest } from "../../_lib/custom-os.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const workspace = resolveWorkspaceForRequest(auth, url.searchParams.get("workspace_id"));
  if (!workspace.ok) return workspace.response;

  const filters = [];
  const binds = [];
  if (workspace.workspace_id) {
    filters.push("workspace_id = ?");
    binds.push(workspace.workspace_id);
  }
  if (!["admin", "manager"].some((role) => auth.roles.includes(role))) {
    filters.push("user_id = ?");
    binds.push(auth.user.id);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const need = await env.DB.prepare(
    `SELECT id, workspace_id, user_id, persona_id, need_type, note, created_at
     FROM human_needs
     ${where}
     ORDER BY created_at DESC
     LIMIT 1`
  )
    .bind(...binds)
    .first();

  return json({ ok: true, human_need: need || null });
}
