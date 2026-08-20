import { jsonOk, onOptions, requireNneAdmin } from "../../../_lib/nne-api.js";

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const channelResult = await env.DB.prepare(
    "SELECT channel,label,status,join_url IS NOT NULL AS has_join_url,updated_at FROM nne_channel_settings ORDER BY channel"
  ).all();
  const contactResult = await env.DB.prepare(
    "SELECT platform,status,COUNT(*) AS total FROM nne_messaging_contacts GROUP BY platform,status ORDER BY platform,status"
  ).all();
  return jsonOk({
    email: { provider: env.RESEND_API_KEY ? "resend" : env.EMAIL ? "cloudflare" : null, configured: Boolean(env.RESEND_API_KEY || env.EMAIL) },
    telegram: { configured: Boolean(env.TELEGRAM_NNE_BOT_TOKEN && env.TELEGRAM_NNE_WEBHOOK_SECRET) },
    whatsapp: { configured: Boolean(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_VERIFY_TOKEN && env.WHATSAPP_APP_SECRET) },
    channels: channelResult.results || [],
    contacts: contactResult.results || []
  });
}
