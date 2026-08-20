import {
  clean,
  createNneSession,
  enforceNneRateLimit,
  getIp,
  jsonError,
  jsonOk,
  nneSessionCookie,
  now,
  onOptions,
  readJson,
  requireNneDb,
  sha256,
  writeNneAudit
} from "../../../../_lib/nne-api.js";

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env }) {
  const db = requireNneDb(env);
  if (!db.ok) return db.response;

  const allowed = await enforceNneRateLimit(env, `login-code:${getIp(request) || "unknown"}`, 20, 15 * 60);
  if (!allowed) return jsonError("nne_login_code_rate_limited", "Demasiados intentos. Espera unos minutos.", 429);

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const challengeToken = clean(parsed.payload?.challenge_token, 200);
  const code = clean(parsed.payload?.code, 12);
  if (!/^[a-f0-9]{64}$/i.test(challengeToken) || !/^\d{6}$/.test(code)) {
    return jsonError("nne_login_code_invalid", "Escribe el código de 6 dígitos que te enviamos.", 400);
  }

  const timestamp = now();
  const challenge = await env.DB.prepare(
    `SELECT c.id,c.user_id,c.code_hash,c.attempt_count,c.expires_at,
            u.email,u.username,u.display_name,u.role,u.status AS user_status
     FROM nne_login_challenges c
     JOIN nne_users u ON u.id=c.user_id
     WHERE c.challenge_hash=? AND c.status='active'
     LIMIT 1`
  ).bind(await sha256(challengeToken)).first();

  if (!challenge?.id || challenge.expires_at <= timestamp) {
    if (challenge?.id) {
      await env.DB.prepare("UPDATE nne_login_challenges SET status='revoked' WHERE id=? AND status='active'")
        .bind(challenge.id)
        .run();
    }
    return jsonError("nne_login_code_expired", "El código venció. Vuelve a iniciar sesión para recibir uno nuevo.", 401);
  }
  if (challenge.user_status !== "active") {
    return jsonError("nne_user_inactive", "Esta cuenta no está activa.", 403);
  }

  const codeHash = await sha256(code);
  if (codeHash !== challenge.code_hash) {
    const attempts = Number(challenge.attempt_count || 0) + 1;
    await env.DB.prepare(
      `UPDATE nne_login_challenges
       SET attempt_count=?, status=CASE WHEN ?>=5 THEN 'revoked' ELSE status END
       WHERE id=? AND status='active'`
    ).bind(attempts, attempts, challenge.id).run();
    return jsonError(
      attempts >= 5 ? "nne_login_code_locked" : "nne_login_code_invalid",
      attempts >= 5 ? "El código quedó bloqueado. Inicia sesión otra vez para recibir uno nuevo." : "Ese código no coincide.",
      401,
      { attempts_remaining: Math.max(0, 5 - attempts) }
    );
  }

  const consumed = await env.DB.prepare(
    "UPDATE nne_login_challenges SET status='used',used_at=? WHERE id=? AND status='active'"
  ).bind(timestamp, challenge.id).run();
  if (!consumed.meta?.changes) {
    return jsonError("nne_login_code_expired", "Este código ya fue usado. Vuelve a iniciar sesión.", 401);
  }

  const session = await createNneSession(env, request, challenge.user_id);
  await env.DB.batch([
    env.DB.prepare("UPDATE nne_login_challenges SET status='revoked' WHERE user_id=? AND id<>? AND status='active'")
      .bind(challenge.user_id, challenge.id),
    env.DB.prepare("UPDATE nne_users SET last_login_at=?,updated_at=? WHERE id=?")
      .bind(timestamp, timestamp, challenge.user_id)
  ]);
  await writeNneAudit(env, request, challenge.user_id, "auth.login", "nne_user", challenge.user_id, {
    second_factor: "email"
  });

  return jsonOk({
    user: {
      id: challenge.user_id,
      email: challenge.email,
      username: challenge.username,
      handle: `@${challenge.username}`,
      name: challenge.display_name,
      role: challenge.role
    },
    redirect: challenge.role === "admin" ? "/admin" : "/"
  }, 200, { "Set-Cookie": nneSessionCookie(session.token, request) });
}
