import { clean, jsonError, jsonOk, now } from '../../../_lib/nne-api.js';
import {
  findNneKeywordRule,
  recordMetaEvent,
  sendInstagramPrivateReply,
  upsertMetaContact,
  verifyMetaSignature
} from '../../../_lib/nne-meta.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token && token === env.META_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge || '', { status: 200 });
  }
  return new Response('forbidden', { status: 403 });
}

function normalizeInstagramEvents(payload) {
  const events = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      if (change.field === 'comments' || change.field === 'live_comments') {
        const commentId = value.id || value.comment_id;
        if (!commentId) continue;
        events.push({
          platform: 'instagram',
          external_event_id: `comment:${commentId}`,
          event_type: 'comment',
          external_user_id: value.from?.id || value.user_id || null,
          username: value.from?.username || null,
          external_media_id: value.media?.id || value.media_id || null,
          external_comment_id: commentId,
          message_text: value.text || '',
          ig_user_id: entry.id,
          payload: change
        });
      }
    }
    for (const messaging of entry.messaging || []) {
      const messageId = messaging.message?.mid || `${entry.id}:${messaging.timestamp || Date.now()}`;
      events.push({
        platform: 'instagram',
        external_event_id: `message:${messageId}`,
        event_type: 'message',
        external_user_id: messaging.sender?.id || null,
        external_thread_id: messaging.recipient?.id || null,
        message_text: messaging.message?.text || '',
        payload: messaging
      });
    }
  }
  return events;
}

function normalizeWhatsAppEvents(payload) {
  const events = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const message of value.messages || []) {
        events.push({
          platform: 'whatsapp',
          external_event_id: `message:${message.id}`,
          event_type: 'message',
          external_user_id: message.from || null,
          phone_hint: message.from ? `***${String(message.from).slice(-4)}` : null,
          message_text: message.text?.body || '',
          payload: change
        });
      }
    }
  }
  return events;
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return jsonError('nne_database_unavailable', 'Database unavailable.', 503);
  const rawBody = await request.text();
  const signatureOk = await verifyMetaSignature(
    rawBody,
    request.headers.get('X-Hub-Signature-256'),
    env.META_APP_SECRET
  );
  if (!signatureOk) return jsonError('meta_signature_invalid', 'Invalid webhook signature.', 401);

  let payload;
  try { payload = JSON.parse(rawBody); } catch { return jsonError('invalid_json', 'Invalid payload.', 400); }

  const normalized = payload.object === 'instagram'
    ? normalizeInstagramEvents(payload)
    : normalizeWhatsAppEvents(payload);

  for (const event of normalized) {
    await recordMetaEvent(env, event);
    if (event.external_user_id) {
      await upsertMetaContact(env, {
        platform: event.platform,
        external_user_id: event.external_user_id,
        username: event.username,
        phone_hint: event.phone_hint,
        consent_status: 'opted_in',
        consent_source: `${event.platform}_inbound_message`,
        consented_at: now()
      });
    }

    const rule = await findNneKeywordRule(env, event.platform, event.message_text);
    if (event.platform === 'instagram' && event.event_type === 'comment' && rule?.private_reply) {
      try {
        await sendInstagramPrivateReply(env, event.ig_user_id, event.external_comment_id, rule.private_reply);
      } catch (error) {
        await env.DB.prepare(
          `UPDATE nne_meta_events SET status='failed', processed_at=?, error_code=? WHERE platform=? AND external_event_id=?`
        ).bind(now(), clean(error?.message, 120), event.platform, event.external_event_id).run();
        continue;
      }
    }

    await env.DB.prepare(
      `UPDATE nne_meta_events SET status=?, processed_at=? WHERE platform=? AND external_event_id=?`
    ).bind(rule ? 'processed' : 'ignored', now(), event.platform, event.external_event_id).run();
  }

  return jsonOk({ received: normalized.length });
}
