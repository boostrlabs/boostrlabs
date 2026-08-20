import { activateNneApplication } from "../../../../_lib/nne-access.js";
import {
  clean,
  enforceNneRateLimit,
  getIp,
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
  const allowed = await enforceNneRateLimit(env, `email-verify:${getIp(request) || "unknown"}`, 12, 15 * 60);
  if (!allowed) return jsonError("nne_email_verify_rate_limited", "Espera unos minutos antes de intentarlo otra vez.", 429);

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const token = clean(parsed.payload?.token, 200);
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return jsonError("nne_email_verification_invalid", "Este enlace no es válido o ya venció.", 400);
  }

  const timestamp = now();
  const record = await env.DB.prepare(
    `SELECT t.id AS token_id, t.expires_at, a.*,
            i.intended_username, i.granted_role, i.status AS invite_status,
            i.expires_at AS invite_expires_at
     FROM nne_email_verification_tokens t
     JOIN nne_access_applications a ON a.id = t.application_id
     LEFT JOIN nne_admin_invites i ON i.id = a.admin_invite_id
     WHERE t.token_hash = ? AND t.status = 'active'
     LIMIT 1`
  ).bind(await sha256(token)).first();

  if (!record?.token_id || record.expires_at <= timestamp || record.status !== "pending") {
    if (record?.token_id) {
      await env.DB.prepare("UPDATE nne_email_verification_tokens SET status='revoked' WHERE id=?")
        .bind(record.token_id)
        .run();
    }
    return jsonError("nne_email_verification_invalid", "Este enlace no es válido o ya venció.", 400);
  }

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE nne_email_verification_tokens
       SET status='used', used_at=?
       WHERE id=? AND status='active'`
    ).bind(timestamp, record.token_id),
    env.DB.prepare(
      `UPDATE nne_access_applications
       SET email_verification_status='verified', email_verified_at=?, updated_at=?
       WHERE id=? AND status='pending'`
    ).bind(timestamp, timestamp, record.id),
    env.DB.prepare(
      `UPDATE nne_email_verification_tokens
       SET status='revoked'
       WHERE application_id=? AND id<>? AND status='active'`
    ).bind(record.id, record.token_id)
  ]);

  const application = { ...record, email_verified_at: timestamp, email_verification_status: "verified" };
  const privileged = Boolean(
    record.admin_invite_id &&
    record.invite_status === "active" &&
    record.invite_expires_at > timestamp &&
    record.granted_role === "admin" &&
    String(record.intended_username).toLowerCase() === String(record.username).toLowerCase()
  );

  if (record.admin_invite_id && !privileged) {
    return jsonError(
      "nne_admin_invite_invalid",
      "Tu correo quedó verificado, pero la invitación de admin venció. Contacta al equipo NNE × WESTDETRO.",
      409
    );
  }

  let activated = null;
  if (privileged) {
    try {
      activated = await activateNneApplication(env, application, {
        role: "admin",
        reviewerId: null,
        reviewNote: "Activación automática por invitación admin verificada",
        timestamp
      });
    } catch (error) {
      if (error?.code === "nne_application_identity_taken") {
        return jsonError(error.code, error.message, 409);
      }
      throw error;
    }
  }

  await writeNneAudit(
    env,
    request,
    activated?.userId || null,
    activated ? "auth.email_verified_admin_activated" : "auth.email_verified",
    "nne_access_application",
    record.id,
    { username: record.username, role: activated?.role || "pending" }
  );

  return jsonOk({
    verified: true,
    activated: Boolean(activated),
    role: activated?.role || null,
    username: record.username,
    message: activated
      ? `Correo verificado. @${record.username} ya tiene acceso admin.`
      : "Correo verificado. Tu solicitud ya está lista para revisión."
  });
}

