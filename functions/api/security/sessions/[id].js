import { clean, json, jsonError, now, requireDb, requireSession } from "../../../_lib/api.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestDelete({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const id = clean(params.id, 120);
  const row = await env.DB.prepare("SELECT id, user_id FROM sessions WHERE id = ? LIMIT 1").bind(id).first();
  if (!row?.id) return jsonError("session_not_found", "Session not found.", 404);
  if (row.user_id !== auth.user.id) return jsonError("session_access_denied", "Session access denied.", 403);

  const timestamp = now();
  await env.DB.prepare("UPDATE sessions SET status = 'revoked', revoked_at = ?, updated_at = ? WHERE id = ?")
    .bind(timestamp, timestamp, id)
    .run();

  return json({ ok: true, id });
}
