import { clean, jsonError, jsonOk, now, onOptions, sha256 } from "../../../../_lib/nne-api.js";
import {
  botReply,
  markMessagingEvent,
  recordMessagingEvent,
  secureEqual,
  sendTelegramMessage,
  upsertMessagingContact
} from "../../../../_lib/nne-messaging.js";

export const onRequestOptions = onOptions;

async function telegramAccountReply(env, telegramUserId, command) {
  const linked = await env.DB.prepare(
    `SELECT c.nne_user_id, u.username, u.display_name, p.level, p.xp,
            COALESCE((SELECT SUM(t.amount) FROM nne_credit_transactions t WHERE t.user_id=u.id),0) AS credits
     FROM nne_messaging_contacts c
     LEFT JOIN nne_users u ON u.id=c.nne_user_id
     LEFT JOIN nne_profiles p ON p.user_id=u.id
     WHERE c.platform='telegram' AND c.external_user_id=? LIMIT 1`
  ).bind(telegramUserId).first();

  if (!linked?.nne_user_id) {
    return "Tu Telegram todavía no está vinculado a NNE. Inicia sesión en nne.westdetro.com y genera tu código de verificación de Telegram. Luego escríbeme: VERIFY 123456";
  }

  if (command === "saldo") {
    return `@${linked.username} · ${Number(linked.credits || 0).toLocaleString()} NNE Credits · Nivel ${Number(linked.level || 1)} · ${Number(linked.xp || 0).toLocaleString()} XP`;
  }

  if (command === "chambas") {
    const rows = await env.DB.prepare(
      `SELECT title, reward_credits, reward_xp FROM nne_quests
       WHERE status='published'
         AND (starts_at IS NULL OR starts_at<=?)
         AND (ends_at IS NULL OR ends_at>?)
       ORDER BY sort_order ASC LIMIT 5`
    ).bind(now(), now()).all();
    const items = (rows.results || []).map((q) => `• ${q.title} · +${q.reward_credits} NNE · +${q.reward_xp} XP`);
    return items.length ? `Chambas activas:\n${items.join("\n")}\n\nhttps://nne.westdetro.com/quests` : "No hay chambas activas ahora mismo.";
  }

  if (command === "rewards") {
    const rows = await env.DB.prepare(
      `SELECT name, cost_credits FROM nne_rewards WHERE status='published' ORDER BY sort_order ASC LIMIT 5`
    ).all();
    const items = (rows.results || []).map((r) => `• ${r.name} · ${r.cost_credits} NNE`);
    return items.length ? `Rewards disponibles:\n${items.join("\n")}\n\nhttps://nne.westdetro.com/rewards` : "No hay rewards publicados ahora mismo.";
  }

  return null;
}

async function handleVerification(env, telegramUserId, username, chatId, text) {
  const match = clean(text, 100).match(/^\/?verify\s+(\d{6})$/i);
  if (!match) return null;
  const challengeHash = await sha256(match[1]);
  const verification = await env.DB.prepare(
    `SELECT id, user_id FROM nne_identity_verifications
     WHERE channel='telegram' AND status='challenge_sent'
       AND challenge_hash=? AND challenge_expires_at>?
     LIMIT 1`
  ).bind(challengeHash, now()).first();

  if (!verification?.id || !verification?.user_id) {
    return "Ese código no es válido o ya venció. Genera uno nuevo desde tu cuenta NNE.";
  }

  const timestamp = now();
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE nne_identity_verifications
       SET external_identifier=?, status='verified', verified_at=?, updated_at=?
       WHERE id=?`
    ).bind(username ? `@${username}` : telegramUserId, timestamp, timestamp, verification.id),
    env.DB.prepare(
      `UPDATE nne_messaging_contacts
       SET nne_user_id=?, chat_id=?, username=COALESCE(?, username), status='active', updated_at=?
       WHERE platform='telegram' AND external_user_id=?`
    ).bind(verification.user_id, chatId, username || null, timestamp, telegramUserId)
  ]);

  return "Telegram verificado y conectado con tu cuenta NNE. Ya puedes escribirme SALDO, CHAMBAS o REWARDS.";
}

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

  const telegramUserId = String(message.from.id);
  const chatId = String(message.chat.id);
  const username = clean(message.from.username, 120);
  const text = clean(message.text, 1000);

  try {
    await upsertMessagingContact(env, {
      platform: "telegram",
      externalUserId: telegramUserId,
      chatId,
      username,
      displayName: [message.from.first_name, message.from.last_name].filter(Boolean).join(" ")
    });

    let reply = await handleVerification(env, telegramUserId, username, chatId, text);
    if (!reply) {
      const normalized = text.toLowerCase().replace(/^\//, "").trim();
      if (["saldo", "balance", "credits", "creditos", "créditos"].includes(normalized)) {
        reply = await telegramAccountReply(env, telegramUserId, "saldo");
      } else if (["chambas", "chamba", "quests", "tareas"].includes(normalized)) {
        reply = await telegramAccountReply(env, telegramUserId, "chambas");
      } else if (["rewards", "reward", "premios", "tienda"].includes(normalized)) {
        reply = await telegramAccountReply(env, telegramUserId, "rewards");
      }
    }

    if (!reply) reply = botReply(text);

    await sendTelegramMessage(
      clean(env.TELEGRAM_NNE_BOT_TOKEN, 240),
      chatId,
      reply
    );
    await markMessagingEvent(env, event.id, "processed");
    return jsonOk();
  } catch (error) {
    console.error(JSON.stringify({ message: "nne_telegram_webhook_failed", event_id: event.id, error: error instanceof Error ? error.message : String(error) }));
    await markMessagingEvent(env, event.id, "failed", "reply_failed");
    return jsonOk({ accepted: true });
  }
}
