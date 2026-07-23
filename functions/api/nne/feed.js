import { jsonOk, requireNneSession } from "../../_lib/nne-api.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 30), 1), 100);
  const before = url.searchParams.get("before") || new Date().toISOString();
  const result = await env.DB.prepare(
    `SELECT f.id, f.event_type, f.message, f.source_type, f.source_id, f.created_at,
            u.username, u.display_name, u.avatar_url
     FROM nne_feed_events f
     LEFT JOIN nne_users u ON u.id = f.user_id
     WHERE f.visibility = 'public' AND f.created_at < ?
     ORDER BY f.created_at DESC
     LIMIT ?`
  )
    .bind(before, limit)
    .all();

  const items = result.results || [];
  return jsonOk({
    items: items.map((row) => ({
      id: row.id,
      type: row.event_type,
      message: row.message,
      source_type: row.source_type || null,
      source_id: row.source_id || null,
      created_at: row.created_at,
      user: row.username
        ? {
            username: row.username,
            handle: `@${row.username}`,
            name: row.display_name,
            avatar_url: row.avatar_url || null
          }
        : null
    })),
    next_cursor: items.length === limit ? items[items.length - 1].created_at : null
  });
}
