import { clean, hashSessionToken, json, now, randomHex, requireDb, requireSession } from "../../_lib/api.js";

const debugLinksEnabled = (env) => env.ENVIRONMENT === "development" || env.ALLOW_DEBUG_AUTH_LINKS === "true";

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;
  const user = await env.DB.prepare("SELECT id, email, email_verified_at FROM users WHERE id = ? LIMIT 1").bind(auth.user.id).first();
  if (!user?.id) return json({ ok: true, already_verified: false });
  if (user.email_verified_at) return json({ ok: true, already_verified: true });
  const token = randomHex(32);
  const tokenHash = await hashSessionToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare("UPDATE users SET email_verification_token_hash = ?, email_verification_token_expires_at = ?, updated_at = ? WHERE id = ?")
    .bind(tokenHash, expiresAt, now(), user.id)
    .run();
  let debug = null;
  if (debugLinksEnabled(env)) {
    const origin = new URL(request.url).origin;
    debug = { verification_url: `${origin}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(clean(user.email, 180))}`, expires_at: expiresAt };
  }
  return json({ ok: true, message: "Verification link prepared.", ...(debug ? { debug } : {}) });
}
