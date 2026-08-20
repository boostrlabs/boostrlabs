import { clean, jsonError, jsonOk, onOptions } from "../../../../_lib/nne-api.js";
import {
  botReply,
  markMessagingEvent,
  recordMessagingEvent,
  secureEqual,
  sendTelegramMessage,
  upsertMessagingContact
} from "../../../../_lib/nne-messaging.js";

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env }) {
  if (!env.TELEGRAM_NNE_BOT_TOKEN || !env.TELEGRAM_NNE_WEBHOOK_SECRET) {
    return jsonError("telegram_not_configured", "Telegram todavía no está conectado.", 503);
  }
  const valid = await secureEqual(
    request.headers.get("X-Telegram-Bot-Api-Secret-Token") || "",
    env.TELEGRAM_NNE_WEBHOOK_SECRET
  );
  if (!valid) return jsonError("telegram_webhook_unauthorized", "Webhook no autorizado.", 401);

  const update = await request.json().catch(() => null);
  if (!update?.update_id) return jsonOk({ ignored: true });
  const message = update.message || update.edited_message;
  const event = await recordMessagingEvent(env, {
    platform: "telegram",
    externalEventId: String(update.update_id),
    eventType: message ? "message" : "update",
    externalUserId: message?.from?.id == null ? "" : String(message.from.id)
  });
  if (!event.fresh) return jsonOk({ duplicate: true });
  if (!message?.chat?.id || !message?.from?.id || !message?.text) {
    await markMessagingEvent(env, event.id, "ignored");
    return jsonOk({ ignored: true });
  }

  try {
    await upsertMessagingContact(env, {
      platform: "telegram",
      externalUserId: String(message.from.id),
      chatId: String(message.chat.id),
      username: message.from.username,
      displayName: [message.from.first_name, message.from.last_name].filter(Boolean).join(" ")
    });
    await sendTelegramMessage(
      clean(env.TELEGRAM_NNE_BOT_TOKEN, 240),
      String(message.chat.id),
      botReply(message.text)
    );
    await markMessagingEvent(env, event.id, "processed");
    return jsonOk();
  } catch (error) {
    console.error(JSON.stringify({ message: "nne_telegram_webhook_failed", event_id: event.id, error: error instanceof Error ? error.message : String(error) }));
    await markMessagingEvent(env, event.id, "failed", "reply_failed");
    return jsonOk({ accepted: true });
  }
}
