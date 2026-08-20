import { clean } from "../../../../_lib/nne-api.js";
import {
  botReply,
  markMessagingEvent,
  recordMessagingEvent,
  sendWhatsAppText,
  upsertMessagingContact,
  verifyMetaSignature
} from "../../../../_lib/nne-messaging.js";

const text = (body, status = 200) => new Response(body, {
  status,
  headers: {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  }
});

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { "Cache-Control": "no-store" }
});

function constantTimeEqual(a, b) {
  const left = new TextEncoder().encode(String(a || ""));
  const right = new TextEncoder().encode(String(b || ""));
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const verifyToken = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (!env.META_WEBHOOK_VERIFY_TOKEN) {
    return text("META_WEBHOOK_VERIFY_TOKEN is not configured", 503);
  }

  if (
    mode === "subscribe" &&
    challenge &&
    constantTimeEqual(verifyToken, env.META_WEBHOOK_VERIFY_TOKEN)
  ) {
    return text(challenge, 200);
  }

  return text("Forbidden", 403);
}

async function processWhatsAppPayload(env, payload) {
  const changes = payload?.entry?.flatMap((entry) => entry.changes || []) || [];

  for (const change of changes) {
    const value = change?.value || {};
    const contacts = value.contacts || [];

    for (const message of value.messages || []) {
      const from = clean(message?.from, 60);
      if (!from || !message?.id) continue;

      const event = await recordMessagingEvent(env, {
        platform: "whatsapp",
        externalEventId: message.id,
        eventType: message.type || "message",
        externalUserId: from
      });
      if (!event.fresh) continue;

      if (message.type !== "text") {
        await markMessagingEvent(env, event.id, "ignored");
        continue;
      }

      try {
        const profile = contacts.find((contact) => contact?.wa_id === from)?.profile;
        await upsertMessagingContact(env, {
          platform: "whatsapp",
          externalUserId: from,
          chatId: from,
          displayName: profile?.name,
          phoneHint: from.length > 4 ? `***${from.slice(-4)}` : "***"
        });

        const incomingText = clean(message?.text?.body, 1000);
        const normalized = incomingText.toLowerCase();
        if (/^(stop|salir|baja|cancelar)$/i.test(normalized)) {
          await env.DB.prepare(
            "UPDATE nne_messaging_contacts SET status='unsubscribed', updated_at=? WHERE platform='whatsapp' AND external_user_id=?"
          ).bind(new Date().toISOString(), from).run();
          await sendWhatsAppText(env, from, "Listo. No recibirás más respuestas automáticas de NNE × WESTDETRO. Tu cuenta NNE no se elimina.");
          await markMessagingEvent(env, event.id, "processed");
          continue;
        }

        await sendWhatsAppText(env, from, botReply(incomingText));
        await markMessagingEvent(env, event.id, "processed");
      } catch (error) {
        console.error("NNE WhatsApp Meta webhook failed", error instanceof Error ? error.message : String(error));
        await markMessagingEvent(env, event.id, "failed", "reply_failed");
      }
    }
  }
}

export async function onRequestPost({ request, env }) {
  const rawBody = await request.text();

  if (!env.META_APP_SECRET) {
    return json({ ok: false, error: "meta_app_secret_not_configured" }, 503);
  }

  const validSignature = await verifyMetaSignature(
    rawBody,
    request.headers.get("X-Hub-Signature-256") || "",
    env.META_APP_SECRET
  );
  if (!validSignature) {
    return json({ ok: false, error: "invalid_signature" }, 401);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  try {
    if (String(payload?.object || "") === "whatsapp_business_account") {
      if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
        console.error("NNE WhatsApp webhook received but WhatsApp credentials are incomplete");
      } else if (env.DB) {
        await processWhatsAppPayload(env, payload);
      }
    }
  } catch (error) {
    console.error("NNE Meta webhook processing failed", error instanceof Error ? error.message : String(error));
  }

  // Meta retries when the webhook does not acknowledge quickly. Processing errors are
  // recorded internally but we still acknowledge valid signed deliveries.
  return json({ ok: true }, 200);
}
