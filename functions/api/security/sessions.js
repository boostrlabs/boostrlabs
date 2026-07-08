import { json, requireDb, requireSession } from "../../_lib/api.js";
import { maskIp, summarizeUserAgent } from "../../_lib/app-normal.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const rows = await env.DB.prepare(
    `SELECT id, status, created_at, last_seen_at, ip, user_agent
     FROM sessions
     WHERE user_id = ?
       AND status = 'active'
       AND revoked_at IS NULL
       AND expires_at > ?
     ORDER BY last_seen_at DESC, created_at DESC
     LIMIT 25`
  )
    .bind(auth.user.id, new Date().toISOString())
    .all();

  return json({
    ok: true,
    sessions: (rows.results || []).map((row) => ({
      id: row.id,
      device_name: summarizeUserAgent(row.user_agent),
      ip_last_seen: maskIp(row.ip),
      user_agent_summary: summarizeUserAgent(row.user_agent),
      status: row.status,
      created_at: row.created_at,
      last_seen_at: row.last_seen_at || null,
      current: row.id === auth.session?.id
    }))
  });
}
