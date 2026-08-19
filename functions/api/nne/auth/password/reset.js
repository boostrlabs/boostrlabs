import {
  clean,
  enforceNneRateLimit,
  getIp,
  hashNnePassword,
  jsonError,
  jsonOk,
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

  const allowed = await enforceNneRateLimit(env, `password-reset:${getIp(request) || "unknown"}`, 8, 15 * 60);
  if (!allowed) {
    return jsonError("nne_password_reset_rate_limited", "Espera unos minutos antes de intentarlo otra vez.", 429);
  }

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const token = clean(parsed.payload?.token, 200);
  const password = String(parsed.payload?.password || "");

  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return jsonError("nne_password_reset_invalid", "Este enlace no es válido o ya venció.", 400);
  }
  if (password.length < 10 || password.length > 200) {
    return jsonError("nne_weak_password", "La contraseña debe tener al menos 10 caracteres.", 400, {
      fields: ["password"]
    });
  }

  const timestamp = now();
  const reset = await env.DB.prepare(
    `SELECT r.id, r.user_id, r.expires_at, u.status AS user_status
     FROM nne_password_reset_tokens r
     JOIN nne_users u ON u.id = r.user_id
     WHERE r.token_hash = ? AND r.status = 'active'
     LIMIT 1`
  )
    .bind(await sha256(token))
    .first();

  if (!reset?.id || reset.user_status !== "active" || reset.expires_at <= timestamp) {
    if (reset?.id) {
      await env.DB.prepare("UPDATE nne_password_reset_tokens SET status = 'revoked' WHERE id = ?")
        .bind(reset.id)
        .run();
    }
    return jsonError("nne_password_reset_invalid", "Este enlace no es válido o ya venció.", 400);
  }

  const passwordHash = await hashNnePassword(password);
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE nne_users SET password_hash = ?, updated_at = ? WHERE id = ? AND status = 'active'"
    ).bind(passwordHash, timestamp, reset.user_id),
    env.DB.prepare(
      "UPDATE nne_password_reset_tokens SET status = 'used', used_at = ? WHERE id = ? AND status = 'active'"
    ).bind(timestamp, reset.id),
    env.DB.prepare(
      "UPDATE nne_sessions SET status = 'revoked', revoked_at = ? WHERE user_id = ? AND status = 'active'"
    ).bind(timestamp, reset.user_id),
    env.DB.prepare(
      "UPDATE nne_password_reset_tokens SET status = 'revoked' WHERE user_id = ? AND id <> ? AND status = 'active'"
    ).bind(reset.user_id, reset.id)
  ]);

  await writeNneAudit(env, request, reset.user_id, "auth.password_reset_completed", "nne_user", reset.user_id);
  return jsonOk({ message: "Tu contraseña fue actualizada. Ya puedes iniciar sesión." });
}
