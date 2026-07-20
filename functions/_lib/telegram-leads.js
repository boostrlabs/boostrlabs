import { clean } from "./api.js";

const line = (label, value, fallback = "No indicado") =>
  `${label}: ${clean(value, 700) || fallback}`;

const actionFor = (lead) =>
  lead.source === "boostr-event-os-orlando-jul-25"
    ? "Acción: escribirle por WhatsApp para enviar pago y cerrar las entradas."
    : "Acción: revisar el lead y cerrar por su canal preferido.";

const leadMessage = (lead) => [
  "🚨 NUEVO LEAD · BOOSTR LABS",
  "",
  line("Origen", lead.source, "website"),
  line("Nombre", lead.contact_name),
  line("Negocio / proyecto", lead.business_name),
  line("WhatsApp / teléfono", lead.contact_phone),
  line("Correo", lead.contact_email),
  line("Interés", lead.project_goal),
  line("Presupuesto", lead.budget_range),
  line("Referencia", lead.referral_code),
  line("Página", lead.page_url),
  line("Fecha", lead.created_at, new Date().toISOString()),
  "",
  actionFor(lead)
].join("\n").slice(0, 4000);

export async function notifyLeadOnTelegram(env, lead) {
  const token = clean(env.TELEGRAM_BOT_TOKEN, 200);
  const chatId = clean(env.TELEGRAM_CHAT_ID, 100);
  const configured = Boolean(token && chatId);
  if (!configured) return { configured: false, sent: false };

  try {
    if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) throw new Error("telegram_bot_token_invalid");

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: leadMessage(lead), disable_web_page_preview: true })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true) {
      throw new Error(`telegram_send_failed:${clean(result.description || response.status, 300)}`);
    }

    return { configured: true, sent: true };
  } catch (error) {
    console.error(JSON.stringify({
      message: "telegram_lead_notification_failed",
      lead_id: clean(lead.id, 100),
      source: clean(lead.source, 100),
      error: error instanceof Error ? error.message : String(error)
    }));
    return { configured: true, sent: false };
  }
}
