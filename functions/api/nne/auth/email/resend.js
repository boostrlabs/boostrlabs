import { sendNneEmail, verificationEmail } from "../../../../_lib/nne-email.js";
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
  sha256
} from "../../../../_lib/nne-api.js";

const VERIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000;
const GENERIC_MESSAGE = "Si encontramos una solicitud pendiente, enviaremos un correo nuevo.";

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env }) {
  const db = requireNneDb(env);
  if (!db.ok) return db.response;
  if (!env.EMAIL && !env.RESEND_API_KEY) {
    return jsonError("nne_email_verification_unavailable", "La verificación por correo está temporalmente fuera de servicio.", 503);
  }

  const allowed = await enforceNneRateLimit(env, `email-resend:${getIp(request) || "unknown"}`, 5, 15 * 60);
  if (!allowed) return jsonError("nne_email_resend_rate_limited", "Espera unos minutos antes de pedir otro correo.", 429);

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const identifier = clean(parsed.payload?.identifier, 180).toLowerCase();
  if (!identifier) return jsonError("nne_email_identifier_required", "Escribe tu email o username.", 400);

  const application = await env.DB.prepare(
    `SELECT id,email,username,display_name
     FROM nne_access_applications
     WHERE (lower(email)=? OR username=?)
       AND status='pending' AND email_verification_status='pending'
     LIMIT 1`
  ).bind(normalizeEmail(identifier), normalizeUsername(identifier)).first();
  if (!application?.id) return jsonOk({ message: GENERIC_MESSAGE }, 202);

  const identityAllowed = await enforceNneRateLimit(env, `email-resend-app:${application.id}`, 3, 60 * 60);
  if (!identityAllowed) return jsonOk({ message: GENERIC_MESSAGE }, 202);

  const token = randomHex(32);
  const timestamp = now();
  const tokenId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + VERIFICATION_WINDOW_MS).toISOString();
  const verificationUrl = `${clean(env.NNE_APP_ORIGIN || "https://nne.westdetro.com", 300).replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;

  await env.DB.batch([
    env.DB.prepare(
      "UPDATE nne_email_verification_tokens SET status='revoked' WHERE application_id=? AND status='active'"
    ).bind(application.id),
    env.DB.prepare(
      `INSERT INTO nne_email_verification_tokens (
         id,application_id,token_hash,status,expires_at,created_at,requested_ip
       ) VALUES (?,?,?,'active',?,?,?)`
    ).bind(tokenId, application.id, await sha256(token), expiresAt, timestamp, getIp(request))
  ]);

  try {
    await sendNneEmail(
      env,
      { email: application.email, name: application.display_name },
      verificationEmail({
        displayName: application.display_name,
        username: application.username,
        verificationUrl
      })
    );
  } catch (error) {
    console.error("NNE verification resend failed", error?.message || error);
    await env.DB.prepare("UPDATE nne_email_verification_tokens SET status='revoked' WHERE id=?")
      .bind(tokenId)
      .run();
  }

  return jsonOk({ message: GENERIC_MESSAGE }, 202);
}
