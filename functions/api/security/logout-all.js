import { json, now, requireDb, requireSession } from "../../_lib/api.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const timestamp = now();
  await env.DB.prepare(
    `UPDATE sessions
     SET status = 'revoked', revoked_at = ?, updated_at = ?
     WHERE user_id = ?
       AND id != ?
       AND status = 'active'`
  )
    .bind(timestamp, timestamp, auth.user.id, auth.session?.id || "")
    .run();

  return json({ ok: true, kept_current_session: true });
}
