import {
  enforceNneRateLimit,
  getIp,
  jsonOk,
  normalizeEmail,
  onOptions,
  readJson,
  requireNneDb,
  writeNneAudit
} from "../../../../_lib/nne-api.js";
import { issueNneEmailVerification } from "../../../../_lib/nne-email.js";

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env }) {
  const db = requireNneDb(env);
  if (!db.ok) return db.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const email = normalizeEmail(parsed.payload?.email);

  const ipAllowed = await enforceNneRateLimit(
    env,
    `email-verify-ip:${getIp(request) || "unknown"}`,
    8,
    60 * 60
  );
  if (!ipAllowed) {
    return jsonOk({ message: "Si la cuenta existe y requiere verificación, enviaremos un correo." });
  }

  if (email) {
    const user = await env.DB.prepare(
      `SELECT id, email, email_verified_at, status
       FROM nne_users
       WHERE lower(email) = ?
       LIMIT 1`
    ).bind(email).first();

    if (user?.id && user.status === "active" && !user.email_verified_at) {
      const accountAllowed = await enforceNneRateLimit(env, `email-verify-user:${user.id}`, 3, 60 * 60);
      if (accountAllowed) {
        const delivery = await issueNneEmailVerification(env, request, user);
        await writeNneAudit(env, request, user.id, "auth.email_verification.request", "nne_user", user.id, {
          delivered: delivery.ok
        });
      }
    }
  }

  return jsonOk({ message: "Si la cuenta existe y requiere verificación, enviaremos un correo." });
}
