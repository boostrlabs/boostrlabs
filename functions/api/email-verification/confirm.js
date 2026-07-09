import { clean, hashSessionToken, isValidEmail, json, jsonError, now, readJson, requireDb } from "../../_lib/api.js";

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const token = clean(parsed.payload?.token, 1000);
  const email = clean(parsed.payload?.email, 180).toLowerCase();
  if (!token) return jsonError("verification_token_required", "Verification token is required.", 400, { fields: ["token"] });
  if (!email || !isValidEmail(email)) return jsonError("valid_email_required", "Valid email is required.", 400, { fields: ["email"] });
  const tokenHash = await hashSessionToken(token);
  const current = now();
  const user = await env.DB.prepare(
    `SELECT id, email, workspace_id, default_workspace_id, email_verified_at, email_verification_token_expires_at
     FROM users
     WHERE email_verification_token_hash = ? AND lower(email) = ? LIMIT 1`
  ).bind(tokenHash, email).first();
  if (!user?.id) return jsonError("invalid_verification", "Verification token is invalid or already used.", 401);
  if (user.email_verification_token_expires_at && user.email_verification_token_expires_at <= current) return jsonError("verification_expired", "Verification token has expired.", 410);
  await env.DB.prepare(
    `UPDATE users
     SET email_verified_at = COALESCE(email_verified_at, ?),
         email_verification_token_hash = NULL,
         email_verification_token_expires_at = NULL,
         updated_at = ?
     WHERE id = ?`
  ).bind(current, current, user.id).run();
  try {
    await env.DB.prepare(
      `INSERT INTO activity_events (id, workspace_id, user_id, event_type, title, body, metadata_json, created_at)
       VALUES (?, ?, ?, 'email.verified', 'Email verified', ?, ?, ?)`
    ).bind(crypto.randomUUID(), user.default_workspace_id || user.workspace_id || null, user.id, email, JSON.stringify({ source: "email_verification" }), current).run();
  } catch {}
  return json({ ok: true, email, verified_at: current });
}
