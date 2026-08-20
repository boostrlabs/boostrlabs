import {
  clean,
  clearNneSessionCookie,
  enforceNneRateLimit,
  getIp,
  getUa,
  getNneSessionToken,
  jsonError,
  jsonOk,
  normalizeEmail,
  normalizeUsername,
  now,
  onOptions,
  randomHex,
  readJson,
  requireNneDb,
  requireNneSession,
  sha256,
  verifyNnePassword,
  writeNneAudit
} from "../../../_lib/nne-api.js";
import { loginCodeEmail, sendNneEmail } from "../../../_lib/nne-email.js";

const LOGIN_CODE_WINDOW_MS = 10 * 60 * 1000;

function randomLoginCode() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(values[0] % 1000000).padStart(6, "0");
}

function maskEmail(email) {
  const [local = "", domain = ""] = String(email).split("@");
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(2, local.length - visible.length))}@${domain}`;
}

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;

  const referral = await env.DB.prepare(
    `SELECT referral_code
     FROM nne_referral_codes
     WHERE referrer_user_id = ? AND status = 'active'
     ORDER BY created_at ASC
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
    `SELECT id, email, username, display_name, role, status, password_hash, email_verified_at
     FROM nne_users
     WHERE lower(email) = ? OR username = ?
     LIMIT 1`
  )
    .bind(normalizeEmail(identifier), normalizeUsername(identifier))
    .first();

  if (!user?.id) {
    const application = await env.DB.prepare(
      `SELECT status, email_verification_status FROM nne_access_applications
       WHERE lower(email) = ? OR username = ?
       LIMIT 1`
    ).bind(normalizeEmail(identifier), normalizeUsername(identifier)).first();
    if (application?.status === "pending") {
      if (application.email_verification_status === "pending") {
        return jsonError(
          "nne_email_verification_required",
          "Primero verifica tu correo. Si no encuentras el mensaje, pide uno nuevo.",
          403
        );
      }
      return jsonError("nne_application_pending", "Tu solicitud está pendiente de aprobación. Te avisaremos por el contacto que elegiste.", 403);
    }
    if (application?.status === "rejected") {
      return jsonError("nne_application_rejected", "Tu solicitud todavía no fue aprobada. Contacta al equipo NNE × WESTDETRO si necesitas revisarla.", 403);
    }
  }
  if (!user?.id || !(await verifyNnePassword(password, user.password_hash))) {
    return jsonError("nne_invalid_credentials", "Email, username o contraseña incorrectos.", 401);
  }
  if (user.status !== "active") {
    return jsonError("nne_user_inactive", "Esta cuenta no está activa.", 403);
  }

  // Compatibility hotfix: nne_users are already approved/activated members.
  // Legacy accounts existed before email verification was introduced and have
  // email_verified_at = NULL. Do not force those members through a new
  // verification-link loop. Backfill verification after a valid password and
  // continue through the existing one-time login code challenge.
  if (!user.email_verified_at) {
    const verifiedAt = now();
    await env.DB.prepare(
      "UPDATE nne_users SET email_verified_at = COALESCE(email_verified_at, ?), updated_at = ? WHERE id = ?"
    ).bind(verifiedAt, verifiedAt, user.id).run();
    user.email_verified_at = verifiedAt;
    await writeNneAudit(env, request, user.id, "auth.legacy_email_verified", "nne_user", user.id, {
      reason: "legacy_active_member_compatibility"
    });
  }

  if (!env.EMAIL && !env.RESEND_API_KEY) {
    return jsonError("nne_login_code_unavailable", "El código de acceso por correo está temporalmente fuera de servicio.", 503);
  }

  const timestamp = now();
  const challengeToken = randomHex(32);
  const code = randomLoginCode();
  const challengeId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + LOGIN_CODE_WINDOW_MS).toISOString();
  await env.DB.batch([
    env.DB.prepare("UPDATE nne_login_challenges SET status='revoked' WHERE user_id=? AND status='active'").bind(user.id),
    env.DB.prepare(
      `INSERT INTO nne_login_challenges (
         id,user_id,channel,destination,challenge_hash,code_hash,status,attempt_count,
         expires_at,created_at,requested_ip,user_agent
       ) VALUES (?,?, 'email', ?,?,?,'active',0,?,?,?,?)`
    ).bind(
      challengeId,
      user.id,
      user.email,
      await sha256(challengeToken),
      await sha256(code),
      expiresAt,
      timestamp,
      getIp(request),
      getUa(request)
    )
  ]);

  try {
    await sendNneEmail(env, { email: user.email, name: user.display_name }, loginCodeEmail({
      displayName: user.display_name,
      code
    }));
  } catch (error) {
    console.error("NNE login code email failed", error?.message || error);
    await env.DB.prepare("UPDATE nne_login_challenges SET status='revoked' WHERE id=?").bind(challengeId).run();
    return jsonError("nne_login_code_unavailable", "No pudimos enviar el código. Intenta nuevamente en unos minutos.", 503);
  }

  await writeNneAudit(env, request, user.id, "auth.login_code_sent", "nne_login_challenge", challengeId, { channel: "email" });
  return jsonOk({
    two_factor_required: true,
    challenge_token: challengeToken,
    channel: "email",
    destination: maskEmail(user.email),
    expires_in: Math.floor(LOGIN_CODE_WINDOW_MS / 1000)
  }, 202);
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
