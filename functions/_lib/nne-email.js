import { clean, now, randomHex, sha256 } from "./nne-api.js";

const VERIFY_TTL_MS = 60 * 60 * 1000;

const publicOrigin = (env, request) => {
  const configured = clean(env.NNE_PUBLIC_ORIGIN, 300).replace(/\/$/, "");
  return configured || new URL(request.url).origin;
};

export async function issueNneEmailVerification(env, request, user) {
  if (!env.RESEND_API_KEY) {
    return { ok: false, reason: "email_provider_unavailable" };
  }

  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const timestamp = now();
  const expiresAt = new Date(Date.now() + VERIFY_TTL_MS).toISOString();
  const tokenId = crypto.randomUUID();

  await env.DB.batch([
    env.DB.prepare(
      "UPDATE nne_email_verification_tokens SET status = 'revoked' WHERE user_id = ? AND status = 'pending'"
    ).bind(user.id),
    env.DB.prepare(
      `INSERT INTO nne_email_verification_tokens (
        id, user_id, token_hash, status, expires_at, created_at
      ) VALUES (?, ?, ?, 'pending', ?, ?)`
    ).bind(tokenId, user.id, tokenHash, expiresAt, timestamp)
  ]);

  const verifyUrl = `${publicOrigin(env, request)}/verify-email?token=${encodeURIComponent(token)}`;
  const from = clean(env.NNE_EMAIL_FROM, 300) || "NNE × WESTDETRO <community@westdetro.com>";

  let response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [user.email],
        subject: "Verifica tu correo — NNE × WESTDETRO",
        html: `
          <div style="background:#0a0a0a;color:#f5f1e8;padding:32px;font-family:Arial,sans-serif">
            <h1 style="margin:0 0 16px;font-size:22px">Verifica tu correo</h1>
            <p style="line-height:1.6;color:#c9c3b8">Confirma este correo para activar las funciones protegidas de tu cuenta NNE.</p>
            <p style="margin:28px 0"><a href="${verifyUrl}" style="background:#f5f1e8;color:#0a0a0a;padding:12px 18px;text-decoration:none;border-radius:8px;font-weight:700">Verificar correo</a></p>
            <p style="font-size:13px;color:#8f8a82">El enlace vence en 1 hora y solo puede usarse una vez.</p>
          </div>`
      })
    });
  } catch {
    await env.DB.prepare(
      "UPDATE nne_email_verification_tokens SET status = 'revoked' WHERE id = ? AND status = 'pending'"
    ).bind(tokenId).run();
    return { ok: false, reason: "email_delivery_failed" };
  }

  if (!response.ok) {
    await env.DB.prepare(
      "UPDATE nne_email_verification_tokens SET status = 'revoked' WHERE id = ? AND status = 'pending'"
    ).bind(tokenId).run();
    return { ok: false, reason: "email_delivery_failed" };
  }

  return { ok: true, expires_at: expiresAt };
}
