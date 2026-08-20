import { clean } from "./nne-api.js";

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export function verificationEmail({ displayName, username, verificationUrl }) {
  const safeName = escapeHtml(displayName || `@${username}`);
  const safeUrl = escapeHtml(verificationUrl);
  return {
    subject: "Verifica tu correo · NNE × WESTDETRO",
    text: `Hola ${displayName || `@${username}`}.

Confirma tu correo para continuar tu solicitud en NNE × WESTDETRO:
${verificationUrl}

El enlace vence en 24 horas. Si no hiciste esta solicitud, ignora este correo.`,
    html: `<!doctype html><html lang="es"><body style="margin:0;background:#070707;color:#f7f4ed;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:48px 24px"><p style="margin:0 0 14px;color:#e7c86e;font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase">NNE × WESTDETRO Community</p><h1 style="margin:0 0 18px;font-size:34px;line-height:1.05">Confirma que eres tú.</h1><p style="color:#aaa6a0;line-height:1.6">Hola ${safeName}. Verifica tu correo para continuar tu solicitud y reservar <strong style="color:#f7f4ed">@${escapeHtml(username)}</strong> como tu identidad pública.</p><a href="${safeUrl}" style="display:inline-block;margin:18px 0;padding:15px 22px;border-radius:12px;background:#e7c86e;color:#080808;font-weight:800;text-decoration:none">Verificar mi correo</a><p style="color:#aaa6a0;font-size:13px;line-height:1.6">Este enlace vence en 24 horas. Si no hiciste esta solicitud, no tienes que hacer nada.</p><p style="margin-top:34px;color:#6f6c67;font-size:12px;word-break:break-all">${safeUrl}</p></div></body></html>`
  };
}

export function passwordResetEmail({ displayName, resetUrl }) {
  const safeName = escapeHtml(displayName || "artista");
  const safeUrl = escapeHtml(resetUrl);
  return {
    subject: "Recupera tu cuenta NNE × WESTDETRO",
    text: `Hola ${displayName || "artista"}.

Usa este enlace para crear una contraseña nueva:
${resetUrl}

El enlace vence en 30 minutos. Si no pediste este cambio, ignora este correo.`,
    html: `<!doctype html><html lang="es"><body style="margin:0;background:#070707;color:#f7f4ed;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:48px 24px"><p style="margin:0 0 14px;color:#e7c86e;font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase">NNE × WESTDETRO Community</p><h1 style="margin:0 0 18px;font-size:34px;line-height:1.05">Vuelve a entrar.</h1><p style="color:#aaa6a0;line-height:1.6">Hola ${safeName}. Recibimos una solicitud para cambiar la contraseña de tu cuenta.</p><a href="${safeUrl}" style="display:inline-block;margin:18px 0;padding:15px 22px;border-radius:12px;background:#e7c86e;color:#080808;font-weight:800;text-decoration:none">Crear contraseña nueva</a><p style="color:#aaa6a0;font-size:13px;line-height:1.6">Este enlace vence en 30 minutos. Si no pediste este cambio, no tienes que hacer nada.</p><p style="margin-top:34px;color:#6f6c67;font-size:12px;word-break:break-all">${safeUrl}</p></div></body></html>`
  };
}

export function loginCodeEmail({ displayName, code }) {
  const safeName = escapeHtml(displayName || "artista");
  const safeCode = escapeHtml(code);
  return {
    subject: `${code} · Tu código para entrar a NNE × WESTDETRO`,
    text: `Hola ${displayName || "artista"}.

Tu código para iniciar sesión es: ${code}

Vence en 10 minutos. Nunca compartas este código. Si no intentaste entrar, cambia tu contraseña.`,
    html: `<!doctype html><html lang="es"><body style="margin:0;background:#070707;color:#f7f4ed;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:48px 24px"><p style="margin:0 0 14px;color:#e7c86e;font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase">NNE × WESTDETRO Community</p><h1 style="margin:0 0 18px;font-size:34px;line-height:1.05">Código para entrar.</h1><p style="color:#aaa6a0;line-height:1.6">Hola ${safeName}. Usa este código para terminar de iniciar sesión:</p><div style="margin:24px 0;padding:22px;border:1px solid #39352e;border-radius:14px;background:#111;text-align:center;color:#e7c86e;font-size:42px;font-weight:900;letter-spacing:.22em">${safeCode}</div><p style="color:#aaa6a0;font-size:13px;line-height:1.6">Vence en 10 minutos. Nunca compartas este código. Si no intentaste entrar, cambia tu contraseña.</p></div></body></html>`
  };
}

export async function sendNneEmail(env, recipient, content) {
  const to = clean(recipient?.email, 180);
  if (!to) throw new Error("Missing email recipient");
  const message = {
    to: { email: to, name: clean(recipient?.name, 120) || undefined },
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
        to: [to],
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
