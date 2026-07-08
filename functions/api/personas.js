import { authCanSeeAll, clean, json, requireDb, requireSession } from "../_lib/api.js";
import { resolveRequiredWorkspace } from "../_lib/app-normal.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const workspace = resolveRequiredWorkspace(auth, url.searchParams.get("workspace_id"));
  if (!workspace.ok) return workspace.response;

  const filters = ["workspace_id = ?"];
  const binds = [workspace.workspace_id];
  if (!authCanSeeAll(auth)) {
    filters.push("user_id = ?");
    binds.push(auth.user.id);
  }

  const result = await env.DB.prepare(
    `SELECT id, user_id, workspace_id, persona_type, display_name, status,
            metadata_json, created_at, updated_at
     FROM personas
     WHERE ${filters.join(" AND ")}
     ORDER BY created_at ASC`
  )
    .bind(...binds)
    .all();

  return json({ ok: true, workspace_id: workspace.workspace_id, personas: result.results || [] });
}
