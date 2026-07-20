import { json, jsonError } from "../_lib/api.js";

const DIAGNOSTIC_KEY = "3c960170-6a0e-4e6b-a586-f02764c16f1d";

export async function onRequestGet({ request, env }) {
  if (request.headers.get("x-boostr-diagnostic") !== DIAGNOSTIC_KEY) {
    return jsonError("not_found", "Not found.", 404);
  }

  const token = String(env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token) return jsonError("telegram_not_configured", "Telegram is not configured.", 503);

  const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    return jsonError("telegram_error", payload.description || "Telegram request failed.", 502);
  }

  const chats = new Map();
  for (const update of payload.result || []) {
    const chat = update.message?.chat || update.my_chat_member?.chat || update.channel_post?.chat;
    if (chat?.id) chats.set(String(chat.id), {
      id: String(chat.id),
      type: chat.type,
      title: chat.title || "",
      username: chat.username || ""
    });
  }

  return json({ ok: true, chats: [...chats.values()] });
}
