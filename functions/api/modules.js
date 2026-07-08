import { clean, json, managerAuth, requireDb } from "../_lib/api.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const url = new URL(request.url);
  const manager = url.searchParams.get("manager") === "1";
  if (manager) {
    const auth = managerAuth(request, env);
    if (!auth.ok) return auth.response;
  }

  const status = clean(url.searchParams.get("status"), 40);
  const category = clean(url.searchParams.get("category"), 80);
  const workspaceId = clean(url.searchParams.get("workspace_id"), 120);
  const filters = [];
  const binds = [];

  if (status) {
    filters.push("modules.status = ?");
    binds.push(status);
  }
  if (category) {
    filters.push("modules.category = ?");
    binds.push(category);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  if (workspaceId) {
    const result = await env.DB.prepare(
      `SELECT
         modules.id,
         modules.name,
         modules.slug,
         modules.category,
         COALESCE(workspace_modules.status, 'locked') AS status,
         modules.description,
         modules.created_at,
         modules.updated_at
       FROM modules
       LEFT JOIN workspace_modules
         ON workspace_modules.module_id = modules.id
        AND workspace_modules.workspace_id = ?
       ${where}
       ORDER BY modules.category, modules.name`
    )
      .bind(workspaceId, ...binds)
      .all();

    return json({ ok: true, modules: result.results || [] });
  }

  const result = await env.DB.prepare(
    `SELECT id, name, slug, category, status, description, created_at, updated_at
     FROM modules
     ${where}
     ORDER BY category, name`
  )
    .bind(...binds)
    .all();

  return json({ ok: true, modules: result.results || [] });
}
