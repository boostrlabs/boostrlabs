import { json, requireDb, requireSession } from "../_lib/api.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const active = await env.DB.prepare(
    "SELECT COUNT(*) AS total FROM sessions WHERE user_id = ? AND status = 'active' AND revoked_at IS NULL AND expires_at > ?"
  )
    .bind(auth.user.id, new Date().toISOString())
    .first();

  return json({
    ok: true,
    security: {
      user_id: auth.user.id,
      password_login_enabled: true,
      two_factor_status: "not_enabled",
      active_sessions: active?.total ?? 0,
      api_tokens_status: "metadata_only"
    }
  });
}
