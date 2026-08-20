import {
  clean,
  enforceNneRateLimit,
  getIp,
  jsonError,
  jsonOk,
  normalizeEmail,
  normalizeUsername,
  now,
  onOptions,
  randomHex,
  readJson,
  requireNneDb,
  sha256,
  writeNneAudit
} from "../../../../_lib/nne-api.js";
import { passwordResetEmail, sendNneEmail } from "../../../../_lib/nne-email.js";

const RESET_WINDOW_MS = 30 * 60 * 1000;
const GENERIC_MESSAGE = "Si encontramos una cuenta con esos datos, recibirás un enlace para crear una contraseña nueva.";

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env }) {
  const db = requireNneDb(env);
  if (!db.ok) return db.response;
  if (!env.EMAIL && !env.RESEND_API_KEY) {
    return jsonError(
      "nne_email_recovery_unavailable",
      "La recuperación por correo está temporalmente fuera de servicio. Intenta nuevamente más tarde.",
      503
    );
  }

  const allowed = await enforceNneRateLimit(env, `password-forgot:${getIp(request) || "unknown"}`, 5, 15 * 60);
  if (!allowed) {
    return jsonError("nne_password_reset_rate_limited", "Espera unos minutos antes de intentarlo otra vez.", 429);
  }

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const identifier = clean(parsed.payload?.identifier, 180).toLowerCase();
  const channel = clean(parsed.payload?.channel || "email", 20).toLowerCase();

  if (channel === "sms") {
    return jsonError(
      "nne_sms_recovery_unavailable",
      "La recuperación por SMS se activará cuando conectemos y verifiquemos los números de teléfono.",
      503
    );
  }
  if (channel !== "email" || !identifier) {
    return jsonError("nne_recovery_identifier_required", "Escribe tu email o username.", 400);
  }

  const user = await env.DB.prepare(
    `SELECT id, email, username, display_name
     FROM nne_users
     WHERE lower(email) = ? OR username = ?
     LIMIT 1`
  )
    .bind(normalizeEmail(identifier), normalizeUsername(identifier))
    .first();

  if (!user?.id) return jsonOk({ message: GENERIC_MESSAGE }, 202);

  const identityAllowed = await enforceNneRateLimit(env, `password-forgot-user:${user.id}`, 3, 60 * 60);
  if (!identityAllowed) return jsonOk({ message: GENERIC_MESSAGE }, 202);

  const token = randomHex(32);
  const timestamp = now();
  const expiresAt = new Date(Date.now() + RESET_WINDOW_MS).toISOString();
  const tokenId = crypto.randomUUID();
  const resetUrl = `${clean(env.NNE_APP_ORIGIN || "https://nne.westdetro.com", 300).replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

  await env.DB.batch([
    env.DB.prepare(
      "UPDATE nne_password_reset_tokens SET status = 'revoked' WHERE user_id = ? AND status = 'active'"
    ).bind(user.id),
    env.DB.prepare(
      `INSERT INTO nne_password_reset_tokens (
        id, user_id, channel, token_hash, destination_hint, status,
        expires_at, created_at, requested_ip
      ) VALUES (?, ?, 'email', ?, ?, 'active', ?, ?, ?)`
    ).bind(tokenId, user.id, await sha256(token), user.email, expiresAt, timestamp, getIp(request))
  ]);

  const email = passwordResetEmail({ displayName: user.display_name, resetUrl });
  try {
    await sendNneEmail(env, { email: user.email, name: user.display_name || user.username }, email);
    await writeNneAudit(env, request, user.id, "auth.password_reset_requested", "nne_user", user.id, {
      channel: "email"
    });
  } catch (error) {
    console.error("NNE password reset email failed", error?.code || "unknown", error?.message || error);
    await env.DB.prepare(
      "UPDATE nne_password_reset_tokens SET status = 'revoked' WHERE id = ?"
    ).bind(tokenId).run();
  }

  return jsonOk({ message: GENERIC_MESSAGE }, 202);
}
