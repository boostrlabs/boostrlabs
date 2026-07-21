import { clean } from "./api.js";

const line = (label, value, fallback = "No indicado") =>
  `${label}: ${clean(value, 700) || fallback}`;

const sourceSummary = (lead) => {
  const parts = [
    lead.source && `source=${lead.source}`,
    lead.utm_source && `utm_source=${lead.utm_source}`,
    lead.utm_medium && `utm_medium=${lead.utm_medium}`,
    lead.utm_campaign && `utm_campaign=${lead.utm_campaign}`,
    lead.utm_content && `utm_content=${lead.utm_content}`,
    lead.utm_term && `utm_term=${lead.utm_term}`
  ].filter(Boolean);
  return parts.join(" · ") || "Directo / no indicado";
};

const messageFor = (lead, pass) => [
  "🚙 NUEVO LEAD · TOYOTA OF HOLLYWOOD X LA CHIQUI",
  "",
  line("Nombre", lead.first_name),
  line("Apellido", lead.last_name),
  line("Teléfono", lead.phone),
  line("Email", lead.email),
  line("Score estimado", lead.score),
  line("Campaña", lead.campaign),
  line("Dealer", lead.dealer),
  line("Vendedora", lead.seller),
  line("Fecha y hora", lead.created_at),
  line("Código QR", pass.code),
  line("Expiración", pass.expiresAt),
  line("UTM / source", sourceSummary(lead)),
  line("Página", lead.page_url),
  "",
  "Acción: contactar al lead y confirmar su cita con el equipo de La Chiqui."
].join("\n").slice(0, 4000);

export async function notifyToyotaLeadOnTelegram(env, lead, pass) {
  const token = clean(env.TELEGRAM_BOT_TOKEN, 200);
  // Intentionally fixed to BOOSTR Team. This flow never reads TELEGRAM_EVENT_CHAT_ID.
  const boostrTeamChatId = clean(env.TELEGRAM_CHAT_ID, 100);
  if (!token || !boostrTeamChatId) return { configured: false, sent: false };

  if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) {
    console.error(JSON.stringify({ message: "telegram_bot_token_invalid", source: "toyota-la-chiqui" }));
    return { configured: true, sent: false };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: boostrTeamChatId,
        text: messageFor(lead, pass),
        disable_web_page_preview: true
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true) {
      throw new Error(`telegram_send_failed:${clean(result.description || response.status, 300)}`);
    }
    return { configured: true, sent: true };
  } catch (error) {
    console.error(JSON.stringify({
      message: "telegram_toyota_lead_failed",
      qr_code: pass.code,
      destination_suffix: boostrTeamChatId.slice(-4),
      error: error instanceof Error ? error.message : String(error)
    }));
    return { configured: true, sent: false };
  }
}
