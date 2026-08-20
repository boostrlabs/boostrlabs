import { clean, jsonError, jsonOk, onOptions } from "../../../../_lib/nne-api.js";
import {
  botReply,
  markMessagingEvent,
  recordMessagingEvent,
  secureEqual,
  sendWhatsAppText,
  upsertMessagingContact,
  verifyMetaSignature
} from "../../../../_lib/nne-messaging.js";

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode") || "";
  const token = url.searchParams.get("hub.verify_token") || "";
  const challenge = url.searchParams.get("hub.challenge") || "";
  if (mode !== "subscribe" || !env.WHATSAPP_VERIFY_TOKEN || !(await secureEqual(token, env.WHATSAPP_VERIFY_TOKEN))) {
    return new Response("Forbidden", { status: 403 });
  }
  return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
}

export async function onRequestPost({ request, env }) {
  if (!env.WHATSAPP_APP_SECRET || !env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    return jsonError("whatsapp_not_configured", "WhatsApp todavía no está conectado.", 503);
  }
  const rawBody = await request.text();
  const valid = await verifyMetaSignature(rawBody, request.headers.get("X-Hub-Signature-256") || "", env.WHATSAPP_APP_SECRET);
  if (!valid) return jsonError("whatsapp_webhook_unauthorized", "Webhook no autorizado.", 401);
  const payload = JSON.parse(rawBody);
  const changes = payload?.entry?.flatMap((entry) => entry.changes || []) || [];

  for (const change of changes) {
    const contacts = change?.value?.contacts || [];
    for (const message of change?.value?.messages || []) {
      const from = clean(message.from, 60);
      const event = await recordMessagingEvent(env, {
        platform: "whatsapp",
        externalEventId: message.id,
        eventType: message.type || "message",
        externalUserId: from
      });
      if (!event.fresh) continue;
      if (!from || message.type !== "text") {
        await markMessagingEvent(env, event.id, "ignored");
        continue;
      }
      const profile = contacts.find((contact) => contact.wa_id === from)?.profile;
      try {
        await upsertMessagingContact(env, {
          platform: "whatsapp",
          externalUserId: from,
          chatId: from,
          displayName: profile?.name,
          phoneHint: from.length > 4 ? `***${from.slice(-4)}` : "***"
        });
        const normalized = clean(message.text?.body, 1000).toLowerCase();
        if (/^(stop|salir|baja|cancelar)$/i.test(normalized)) {
          await env.DB.prepare(
            "UPDATE nne_messaging_contacts SET status='unsubscribed', updated_at=? WHERE platform='whatsapp' AND external_user_id=?"
          ).bind(new Date().toISOString(), from).run();
        }
        await sendWhatsAppText(env, from, botReply(message.text?.body));
        await markMessagingEvent(env, event.id, "processed");
      } catch (error) {
        console.error(JSON.stringify({ message: "nne_whatsapp_webhook_failed", event_id: event.id, error: error instanceof Error ? error.message : String(error) }));
        await markMessagingEvent(env, event.id, "failed", "reply_failed");
      }
    }
  }
  return jsonOk();
}
