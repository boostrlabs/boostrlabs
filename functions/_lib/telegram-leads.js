import { clean } from "./api.js";

const EVENT_SOURCE = "boostr-event-os-orlando-jul-25";

const line = (label, value, fallback = "No indicado") =>
  `${label}: ${clean(value, 700) || fallback}`;

const actionFor = (lead) =>
  lead.source === EVENT_SOURCE
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
  const teamChatId = clean(env.TELEGRAM_CHAT_ID, 100);
  const eventChatId = clean(env.TELEGRAM_EVENT_CHAT_ID, 100);
  const chatIds = [lead.source === EVENT_SOURCE && eventChatId ? eventChatId : teamChatId].filter(Boolean);
  const configured = Boolean(token && chatIds.length);
  if (!configured) return { configured: false, sent: false };

  if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) {
    console.error(JSON.stringify({ message: "telegram_bot_token_invalid", source: clean(lead.source, 100) }));
    return { configured: true, sent: false, destinationCount: chatIds.length, sentCount: 0 };
  }

  const results = await Promise.all(chatIds.map(async (chatId) => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: leadMessage(lead), disable_web_page_preview: true })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) {
        throw new Error(`telegram_send_failed:${clean(result.description || response.status, 300)}`);
      }
      return true;
    } catch (error) {
      console.error(JSON.stringify({
        message: "telegram_lead_notification_failed",
        lead_id: clean(lead.id, 100),
        source: clean(lead.source, 100),
        destination_suffix: chatId.slice(-4),
        error: error instanceof Error ? error.message : String(error)
      }));
      return false;
    }
  }));

  const sentCount = results.filter(Boolean).length;
  return {
    configured: true,
    sent: sentCount === chatIds.length,
    destinationCount: chatIds.length,
    sentCount
  };
}
