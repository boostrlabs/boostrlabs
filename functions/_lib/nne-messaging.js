import { clean, now } from "./nne-api.js";

const encoder = new TextEncoder();

export async function secureEqual(left, right) {
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(clean(left, 500))),
    crypto.subtle.digest("SHA-256", encoder.encode(clean(right, 500)))
  ]);
  return crypto.subtle.timingSafeEqual(leftHash, rightHash);
}

export async function verifyMetaSignature(rawBody, signatureHeader, appSecret) {
  const supplied = clean(signatureHeader, 300).replace(/^sha256=/i, "");
  if (!/^[a-f0-9]{64}$/i.test(supplied) || !appSecret) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expected = [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  return secureEqual(supplied, expected);
}

export async function recordMessagingEvent(env, { platform, externalEventId, eventType, externalUserId }) {
  const id = `${platform}:${clean(externalEventId, 180)}`;
  const result = await env.DB.prepare(
    `INSERT OR IGNORE INTO nne_messaging_events (
      id, platform, external_event_id, event_type, external_user_id, received_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'received')`
  ).bind(
    id,
    platform,
    clean(externalEventId, 180),
    clean(eventType, 80),
    clean(externalUserId, 180) || null,
    now()
  ).run();
  return { id, fresh: Number(result.meta?.changes || 0) > 0 };
}

export async function markMessagingEvent(env, id, status, errorCode = null) {
  await env.DB.prepare(
    `UPDATE nne_messaging_events
     SET status = ?, processed_at = ?, error_code = ?
     WHERE id = ?`
  ).bind(status, now(), clean(errorCode, 120) || null, id).run();
}

export async function upsertMessagingContact(env, contact) {
  const timestamp = now();
  await env.DB.prepare(
    `INSERT INTO nne_messaging_contacts (
      id, platform, external_user_id, chat_id, username, display_name, phone_hint,
      opted_in_at, last_message_at, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    ON CONFLICT(platform, external_user_id) DO UPDATE SET
      chat_id = excluded.chat_id,
      username = COALESCE(excluded.username, nne_messaging_contacts.username),
      display_name = COALESCE(excluded.display_name, nne_messaging_contacts.display_name),
      phone_hint = COALESCE(excluded.phone_hint, nne_messaging_contacts.phone_hint),
      last_message_at = excluded.last_message_at,
      status = 'active',
      updated_at = excluded.updated_at`
  ).bind(
    crypto.randomUUID(),
    contact.platform,
    clean(contact.externalUserId, 180),
    clean(contact.chatId, 180),
    clean(contact.username, 120) || null,
    clean(contact.displayName, 160) || null,
    clean(contact.phoneHint, 40) || null,
    timestamp,
    timestamp,
    timestamp,
    timestamp
  ).run();
}

export function botReply(text = "") {
  const normalized = clean(text, 1000).toLowerCase();
  if (/\b(chamba|chambas|tarea|tareas|quest|quests)\b/.test(normalized)) {
    return "Los Bloques de Chamba son tareas cortas. Cumples una, subes evidencia y, cuando se aprueba, recibes NNE Credits. Mira las activas aquí: https://nne.westdetro.com/quests";
  }
  if (/\b(reward|rewards|premio|premios|tienda|store)\b/.test(normalized)) {
    return "Los NNE Credits se usan para ropa, equipo, beats, producciones y otros rewards. Catálogo: https://nne.westdetro.com/rewards";
  }
  if (/\b(sisisi|estreno|westdetro)\b/.test(normalized)) {
    return "SISISI sale el 26 de agosto. WESTDETRO sale el 28. Las chambas activas ayudan a empujar ambos lanzamientos: https://nne.westdetro.com/quests";
  }
  if (/\b(saldo|credit|credits|nne)\b/.test(normalized)) {
    return "Tu saldo y progreso están dentro de tu perfil NNE: https://nne.westdetro.com/profile";
  }
  if (/\b(salir|stop|baja|cancelar)\b/.test(normalized)) {
    return "Entendido. Para dejar de recibir mensajes automáticos escribe STOP. Tu cuenta NNE no se elimina.";
  }
  return "Somos NNE × WESTDETRO. Aquí cumples Bloques de Chamba, ganas NNE Credits y los cambias por ropa, equipo, beats y producciones. Escribe CHAMBAS, REWARDS, SALDO o SISISI.";
}

export async function sendTelegramMessage(token, chatId, text) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.ok !== true) {
    throw new Error(`telegram_send_failed:${clean(result.description || response.status, 240)}`);
  }
  return result;
}

export async function sendWhatsAppText(env, to, text) {
  const version = clean(env.WHATSAPP_GRAPH_VERSION || "v23.0", 20);
  const response = await fetch(
    `https://graph.facebook.com/${version}/${encodeURIComponent(env.WHATSAPP_PHONE_NUMBER_ID)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { body: text, preview_url: false } })
    }
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`whatsapp_send_failed:${clean(result?.error?.message || response.status, 240)}`);
  return result;
}
