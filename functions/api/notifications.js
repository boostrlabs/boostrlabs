import { authCanSeeAll, clean, json, requireDb, requireSession } from "../_lib/api.js";
import { resolveRequiredWorkspace } from "../_lib/app-normal.js";

const clampLimit = (value) => Math.min(Math.max(Number(value || 50) || 50, 1), 100);

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
  const status = clean(url.searchParams.get("status"), 40);
  if (status) {
    filters.push("status = ?");
    binds.push(status);
  }
  if (!authCanSeeAll(auth)) {
    filters.push("(user_id = ? OR user_id IS NULL)");
    binds.push(auth.user.id);
  }

  const result = await env.DB.prepare(
    `SELECT id, user_id, workspace_id, card_id, type, title, body, status,
            priority, created_at, read_at
     FROM notifications
     WHERE ${filters.join(" AND ")}
     ORDER BY priority DESC, created_at DESC
     LIMIT ?`
  )
    .bind(...binds, clampLimit(url.searchParams.get("limit")))
    .all();

  return json({ ok: true, workspace_id: workspace.workspace_id, notifications: result.results || [] });
}
