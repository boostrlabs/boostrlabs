import { clean, hashSessionToken, isValidEmail, json, now, randomHex, readJson, requireDb } from "../../_lib/api.js";

const debugLinksEnabled = (env) => env.ENVIRONMENT === "development" || env.ALLOW_DEBUG_AUTH_LINKS === "true";

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const email = clean(parsed.payload?.email, 180).toLowerCase();
  let debug = null;
  if (email && isValidEmail(email)) {
    const user = await env.DB.prepare("SELECT id, email, status FROM users WHERE lower(email) = ? LIMIT 1").bind(email).first();
    if (user?.id && ["active", "invited"].includes(user.status)) {
      const token = randomHex(32);
      const tokenHash = await hashSessionToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await env.DB.prepare("UPDATE users SET password_reset_token_hash = ?, password_reset_token_expires_at = ?, updated_at = ? WHERE id = ?")
        .bind(tokenHash, expiresAt, now(), user.id)
        .run();
      try {
        await env.DB.prepare(
          `INSERT INTO activity_events (id, workspace_id, user_id, event_type, title, body, metadata_json, created_at)
           VALUES (?, NULL, ?, 'password_reset.requested', 'Password reset requested', ?, ?, ?)`
        ).bind(crypto.randomUUID(), user.id, email, JSON.stringify({ delivery: "pending_email" }), now()).run();
      } catch {}
      if (debugLinksEnabled(env)) {
        const origin = new URL(request.url).origin;
        debug = { reset_url: `${origin}/forgot-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`, expires_at: expiresAt };
      }
    }
  }
  return json({ ok: true, message: "If the email exists, a reset link will be prepared.", ...(debug ? { debug } : {}) });
}
