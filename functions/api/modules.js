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
  const filters = [];
  const binds = [];

  if (status) {
    filters.push("status = ?");
    binds.push(status);
  }
  if (category) {
    filters.push("category = ?");
    binds.push(category);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
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
