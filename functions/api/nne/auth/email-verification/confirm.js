import {
  clean,
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

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const token = clean(parsed.payload?.token, 300);
  if (!token) return jsonError("nne_verification_invalid", "El enlace de verificación no es válido.", 400);

  const timestamp = now();
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    `SELECT t.id, t.user_id, t.expires_at, u.email_verified_at, u.status
     FROM nne_email_verification_tokens t
     JOIN nne_users u ON u.id = t.user_id
     WHERE t.token_hash = ? AND t.status = 'pending'
     LIMIT 1`
  ).bind(tokenHash).first();

  if (!row?.id || row.status !== "active" || row.expires_at <= timestamp) {
    return jsonError("nne_verification_expired", "Este enlace ya venció o fue utilizado.", 400);
  }

  if (row.email_verified_at) {
    await env.DB.prepare(
      "UPDATE nne_email_verification_tokens SET status = 'used', used_at = ? WHERE id = ? AND status = 'pending'"
    ).bind(timestamp, row.id).run();
    return jsonOk({ verified: true, message: "Tu correo ya estaba verificado." });
  }

  await env.DB.batch([
    env.DB.prepare(
      "UPDATE nne_email_verification_tokens SET status = 'used', used_at = ? WHERE id = ? AND status = 'pending'"
    ).bind(timestamp, row.id),
    env.DB.prepare(
      "UPDATE nne_users SET email_verified_at = ?, updated_at = ? WHERE id = ? AND email_verified_at IS NULL"
    ).bind(timestamp, timestamp, row.user_id),
    env.DB.prepare(
      "UPDATE nne_email_verification_tokens SET status = 'revoked' WHERE user_id = ? AND id <> ? AND status = 'pending'"
    ).bind(row.user_id, row.id)
  ]);

  await writeNneAudit(env, request, row.user_id, "auth.email_verification.confirm", "nne_user", row.user_id);
  return jsonOk({ verified: true, message: "Correo verificado correctamente." });
}
