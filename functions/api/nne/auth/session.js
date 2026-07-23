import {
  clean,
  clearNneSessionCookie,
  createNneSession,
  enforceNneRateLimit,
  getIp,
  getNneSessionToken,
  jsonError,
  jsonOk,
  nneSessionCookie,
  normalizeEmail,
  normalizeUsername,
  now,
  onOptions,
  readJson,
  requireNneDb,
  requireNneSession,
  sha256,
  verifyNnePassword,
  writeNneAudit
} from "../../../_lib/nne-api.js";

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;

  const referral = await env.DB.prepare(
    `SELECT referral_code
     FROM nne_referrals
     WHERE referrer_user_id = ? AND referred_user_id IS NULL AND status = 'invited'
     ORDER BY created_at DESC
     LIMIT 1`
  )
    .bind(auth.user.id)
    .first();

  return jsonOk({
    user: auth.user,
    referral_code: referral?.referral_code || null
  });
}

export async function onRequestPost({ request, env }) {
  const db = requireNneDb(env);
  if (!db.ok) return db.response;

  const allowed = await enforceNneRateLimit(env, `login:${getIp(request) || "unknown"}`, 12, 15 * 60);
  if (!allowed) {
    return jsonError("nne_login_rate_limited", "Demasiados intentos. Espera unos minutos.", 429);
  }

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const identifier = clean(parsed.payload?.identifier || parsed.payload?.email, 180).toLowerCase();
  const password = String(parsed.payload?.password || "");
  if (!identifier || !password) {
    return jsonError("nne_credentials_required", "Escribe tu email o username y contraseña.", 400);
  }

  const user = await env.DB.prepare(
    `SELECT id, email, username, display_name, role, status, password_hash
     FROM nne_users
     WHERE lower(email) = ? OR username = ?
     LIMIT 1`
  )
    .bind(normalizeEmail(identifier), normalizeUsername(identifier))
    .first();

  if (!user?.id || !(await verifyNnePassword(password, user.password_hash))) {
    return jsonError("nne_invalid_credentials", "Email, username o contraseña incorrectos.", 401);
  }
  if (user.status !== "active") {
    return jsonError("nne_user_inactive", "Esta cuenta no está activa.", 403);
  }

  const timestamp = now();
  const session = await createNneSession(env, request, user.id);
  await env.DB.prepare("UPDATE nne_users SET last_login_at = ?, updated_at = ? WHERE id = ?")
    .bind(timestamp, timestamp, user.id)
    .run();
  await writeNneAudit(env, request, user.id, "auth.login", "nne_user", user.id);

  return jsonOk(
    {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        handle: `@${user.username}`,
        name: user.display_name,
        role: user.role
      },
      redirect: user.role === "admin" ? "/nne-community/admin" : "/nne-community/"
    },
    200,
    { "Set-Cookie": nneSessionCookie(session.token, request) }
  );
}

export async function onRequestDelete({ request, env }) {
  const token = getNneSessionToken(request);
  if (env.DB && token) {
    const tokenHash = await sha256(token);
    const timestamp = now();
    const session = await env.DB.prepare(
      "SELECT id, user_id FROM nne_sessions WHERE token_hash = ? LIMIT 1"
    )
      .bind(tokenHash)
      .first();
    await env.DB.prepare(
      "UPDATE nne_sessions SET status = 'revoked', revoked_at = ? WHERE token_hash = ?"
    )
      .bind(timestamp, tokenHash)
      .run();
    if (session?.user_id) {
      await writeNneAudit(env, request, session.user_id, "auth.logout", "nne_session", session.id);
    }
  }
  return jsonOk({}, 200, { "Set-Cookie": clearNneSessionCookie(request) });
}
