import { clean, createSession, hashPassword, hashSessionToken, isValidEmail, json, jsonError, now, readJson, requireDb, sessionCookie } from "../../_lib/api.js";

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};
  const token = clean(payload.token || payload.invite_token, 1000);
  const email = clean(payload.email, 180).toLowerCase();
  const password = clean(payload.password, 500);
  const displayName = clean(payload.display_name || payload.name, 140);
  if (!token) return jsonError("invite_token_required", "Invite token is required.", 400, { fields: ["token"] });
  if (!email || !isValidEmail(email)) return jsonError("valid_email_required", "Valid email is required.", 400, { fields: ["email"] });
  if (password.length < 8) return jsonError("weak_password", "Password must be at least 8 characters.", 400, { fields: ["password"] });
  const tokenHash = await hashSessionToken(token);
  const current = now();
  const user = await env.DB.prepare(
    `SELECT id, email, name, status, workspace_id, default_workspace_id, invite_token_expires_at
     FROM users
     WHERE invite_token_hash = ?
       AND lower(email) = ?
       AND status IN ('invited', 'active')
     LIMIT 1`
  ).bind(tokenHash, email).first();
  if (!user?.id) return jsonError("invalid_invite", "Invite is invalid or has already been used.", 401);
  if (user.invite_token_expires_at && user.invite_token_expires_at <= current) return jsonError("invite_expired", "Invite has expired.", 410);
  const passwordHash = await hashPassword(password);
  const activeWorkspaceId = user.default_workspace_id || user.workspace_id || null;
  await env.DB.prepare(
    `UPDATE users
     SET password_hash = ?, password_set_at = ?, status = 'active',
         invite_token_hash = NULL, invite_token_expires_at = NULL,
         invite_accepted_at = ?, onboarding_status = 'accepted_invite',
         name = COALESCE(NULLIF(?, ''), name), updated_at = ?
     WHERE id = ?`
  ).bind(passwordHash, current, current, displayName, current, user.id).run();
  try {
    await env.DB.prepare(
      `INSERT INTO activity_events (id, workspace_id, user_id, event_type, title, body, metadata_json, created_at)
       VALUES (?, ?, ?, 'invite.accepted', 'Invite accepted', ?, ?, ?)`
    ).bind(crypto.randomUUID(), activeWorkspaceId, user.id, email, JSON.stringify({ source: "invite_acceptance" }), current).run();
  } catch {}
  const session = await createSession(env, request, user.id, activeWorkspaceId);
  return json({ ok: true, token: session.token, expires_at: session.expires_at, user: { id: user.id, email, name: displayName || user.name, status: "active" }, active_workspace_id: activeWorkspaceId }, 200, { "Set-Cookie": sessionCookie(session.token, request) });
}
