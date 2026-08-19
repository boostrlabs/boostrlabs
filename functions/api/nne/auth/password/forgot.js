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

const RESET_WINDOW_MS = 30 * 60 * 1000;
const GENERIC_MESSAGE = "Si encontramos una cuenta con esos datos, recibirás un enlace para crear una contraseña nueva.";

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const resetEmail = ({ displayName, resetUrl }) => {
  const safeName = escapeHtml(displayName || "artista");
  const safeUrl = escapeHtml(resetUrl);
  return {
    subject: "Recupera tu cuenta NNE × WESTDETRO",
    text: `Hola ${displayName || "artista"}.\n\nUsa este enlace para crear una contraseña nueva:\n${resetUrl}\n\nEl enlace vence en 30 minutos. Si no pediste este cambio, ignora este correo.`,
    html: `<!doctype html><html lang="es"><body style="margin:0;background:#070707;color:#f7f4ed;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:48px 24px"><p style="margin:0 0 14px;color:#e7c86e;font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase">NNE × WESTDETRO Community</p><h1 style="margin:0 0 18px;font-size:34px;line-height:1.05">Vuelve a entrar.</h1><p style="color:#aaa6a0;line-height:1.6">Hola ${safeName}. Recibimos una solicitud para cambiar la contraseña de tu cuenta.</p><a href="${safeUrl}" style="display:inline-block;margin:18px 0;padding:15px 22px;border-radius:12px;background:#e7c86e;color:#080808;font-weight:800;text-decoration:none">Crear contraseña nueva</a><p style="color:#aaa6a0;font-size:13px;line-height:1.6">Este enlace vence en 30 minutos. Si no pediste este cambio, no tienes que hacer nada.</p><p style="margin-top:34px;color:#6f6c67;font-size:12px;word-break:break-all">${safeUrl}</p></div></body></html>`
  };
};

async function sendResetEmail(env, recipient, content) {
  const message = {
    to: { email: recipient.email, name: recipient.name },
    from: { email: "community@westdetro.com", name: "NNE × WESTDETRO" },
    replyTo: "community@westdetro.com",
    ...content
  };
  if (env.EMAIL) return env.EMAIL.send(message);
  if (env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "NNE × WESTDETRO <community@westdetro.com>",
        to: [recipient.email],
        reply_to: "community@westdetro.com",
        subject: content.subject,
        html: content.html,
        text: content.text
      })
    });
    if (!response.ok) throw new Error(`Resend email failed (${response.status})`);
    return response.json();
  }
  throw new Error("No email provider configured");
}

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

  const email = resetEmail({ displayName: user.display_name, resetUrl });
  try {
    await sendResetEmail(env, { email: user.email, name: user.display_name || user.username }, email);
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
