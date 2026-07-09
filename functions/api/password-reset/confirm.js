import { clean, createSession, hashPassword, hashSessionToken, isValidEmail, json, jsonError, now, readJson, requireDb, sessionCookie } from "../../_lib/api.js";

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const p = parsed.payload || {};
  const token = clean(p.token, 1000);
  const email = clean(p.email, 180).toLowerCase();
  const password = clean(p.password, 500);
  if (!token) return jsonError("reset_token_required", "Reset token is required.", 400, { fields: ["token"] });
  if (!email || !isValidEmail(email)) return jsonError("valid_email_required", "Valid email is required.", 400, { fields: ["email"] });
  if (password.length < 8) return jsonError("weak_password", "Password must be at least 8 characters.", 400, { fields: ["password"] });
  const tokenHash = await hashSessionToken(token);
  const current = now();
  const user = await env.DB.prepare(
    `SELECT id, email, name, status, workspace_id, default_workspace_id, password_reset_token_expires_at
     FROM users
     WHERE password_reset_token_hash = ? AND lower(email) = ? LIMIT 1`
  ).bind(tokenHash, email).first();
  if (!user?.id) return jsonError("invalid_reset", "Reset token is invalid or already used.", 401);
  if (user.password_reset_token_expires_at && user.password_reset_token_expires_at <= current) return jsonError("reset_expired", "Reset token has expired.", 410);
  const passwordHash = await hashPassword(password);
  const workspaceId = user.default_workspace_id || user.workspace_id || null;
  await env.DB.prepare(
    `UPDATE users
     SET password_hash = ?, password_set_at = ?, status = CASE WHEN status = 'invited' THEN 'active' ELSE status END,
         password_reset_token_hash = NULL, password_reset_token_expires_at = NULL,
         onboarding_status = CASE WHEN onboarding_status = 'claimed_from_audit' THEN 'accepted_invite' ELSE onboarding_status END,
         updated_at = ?
     WHERE id = ?`
  ).bind(passwordHash, current, current, user.id).run();
  try { await env.DB.prepare("UPDATE sessions SET status = 'revoked', revoked_at = ?, updated_at = ? WHERE user_id = ?").bind(current, current, user.id).run(); } catch {}
  try {
    await env.DB.prepare(
      `INSERT INTO activity_events (id, workspace_id, user_id, event_type, title, body, metadata_json, created_at)
       VALUES (?, ?, ?, 'password_reset.completed', 'Password reset completed', ?, ?, ?)`
    ).bind(crypto.randomUUID(), workspaceId, user.id, email, JSON.stringify({ source: "password_reset" }), current).run();
  } catch {}
  const session = await createSession(env, request, user.id, workspaceId);
  return json({ ok: true, token: session.token, expires_at: session.expires_at, user: { id: user.id, email, name: user.name, status: "active" }, active_workspace_id: workspaceId }, 200, { "Set-Cookie": sessionCookie(session.token, request) });
}
