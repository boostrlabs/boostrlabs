import { clean, json, requireDb, requireRole } from "../../_lib/api.js";

const managerRoles = ["admin", "manager"];
const limit = (value) => Math.min(Math.max(Number(value || 50) || 50, 1), 100);

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, managerRoles);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const q = clean(url.searchParams.get("q"), 120).toLowerCase();
  const filters = ["workspaces.status != 'archived'"];
  const binds = [];
  if (q) { filters.push("(lower(workspaces.name) LIKE ? OR lower(workspaces.owner_email) LIKE ? OR lower(workspaces.slug) LIKE ?)"); binds.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const result = await env.DB.prepare(
    `SELECT workspaces.id, workspaces.type, workspaces.name, workspaces.slug, workspaces.owner_email, workspaces.status,
            workspaces.created_at, workspaces.updated_at,
            (SELECT COUNT(*) FROM users WHERE users.default_workspace_id = workspaces.id OR users.workspace_id = workspaces.id) AS users_count,
            (SELECT COUNT(*) FROM cards WHERE cards.workspace_id = workspaces.id AND cards.status NOT IN ('done','archived')) AS open_cards_count,
            (SELECT COUNT(*) FROM products WHERE products.workspace_id = workspaces.id AND products.status != 'archived') AS products_count,
            (SELECT COUNT(*) FROM payment_links WHERE payment_links.workspace_id = workspaces.id AND payment_links.status != 'archived') AS smart_links_count,
            (SELECT COUNT(*) FROM order_reservations WHERE order_reservations.workspace_id = workspaces.id) AS reservations_count,
            (SELECT COUNT(*) FROM workspace_files WHERE workspace_files.workspace_id = workspaces.id AND workspace_files.status = 'active') AS files_count,
            (SELECT COUNT(*) FROM invoices WHERE invoices.workspace_id = workspaces.id AND invoices.status != 'archived') AS invoices_count
     FROM workspaces
     WHERE ${filters.join(" AND ")}
     ORDER BY workspaces.updated_at DESC, workspaces.created_at DESC
     LIMIT ?`
  ).bind(...binds, limit(url.searchParams.get("limit"))).all();
  return json({ ok: true, workspaces: result.results || [] });
}
