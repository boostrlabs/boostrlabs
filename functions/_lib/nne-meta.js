import { clean, now } from './nne-api.js';

const encoder = new TextEncoder();

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

function timingSafeHexEqual(left, right) {
  if (left.length !== right.length || !left.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

export async function verifyMetaSignature(rawBody, signatureHeader, appSecret) {
  const signature = clean(signatureHeader, 300);
  const secret = String(appSecret || '');
  if (!signature.startsWith('sha256=') || !secret) return false;
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const digest = toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody)));
  return timingSafeHexEqual(digest, signature.slice(7).toLowerCase());
}

export async function findNneKeywordRule(env, platform, text) {
  const normalized = clean(text, 4000).toLowerCase();
  if (!normalized) return null;
  const { results = [] } = await env.DB.prepare(
    `SELECT id, platform, keyword, match_type, public_reply, private_reply
     FROM nne_meta_keyword_rules
     WHERE status='active' AND platform IN (?, 'all')
     ORDER BY priority ASC, keyword ASC`
  ).bind(platform).all();
  return results.find((rule) => {
    const keyword = String(rule.keyword || '').toLowerCase();
    return rule.match_type === 'exact' ? normalized.trim() === keyword : normalized.includes(keyword);
  }) || null;
}

export async function recordMetaEvent(env, event) {
  const timestamp = now();
  await env.DB.prepare(
    `INSERT OR IGNORE INTO nne_meta_events (
      id, platform, external_event_id, event_type, external_user_id, external_thread_id,
      external_media_id, external_comment_id, message_text, payload_json, received_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received')`
  ).bind(
    crypto.randomUUID(), event.platform, event.external_event_id, event.event_type,
    event.external_user_id || null, event.external_thread_id || null,
    event.external_media_id || null, event.external_comment_id || null,
    clean(event.message_text, 4000) || null, JSON.stringify(event.payload || {}), timestamp
  ).run();
}

export async function upsertMetaContact(env, contact) {
  const timestamp = now();
  await env.DB.prepare(
    `INSERT INTO nne_meta_contacts (
      id, platform, external_user_id, username, display_name, phone_hint,
      consent_status, consent_source, consented_at, last_inbound_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(platform, external_user_id) DO UPDATE SET
      username=COALESCE(excluded.username, username),
      display_name=COALESCE(excluded.display_name, display_name),
      phone_hint=COALESCE(excluded.phone_hint, phone_hint),
      consent_status=CASE WHEN consent_status='opted_out' THEN 'opted_out' ELSE excluded.consent_status END,
      consent_source=CASE WHEN consent_status='opted_out' THEN consent_source ELSE excluded.consent_source END,
      consented_at=CASE WHEN consent_status='opted_out' THEN consented_at ELSE COALESCE(consented_at, excluded.consented_at) END,
      last_inbound_at=excluded.last_inbound_at,
      updated_at=excluded.updated_at`
  ).bind(
    crypto.randomUUID(), contact.platform, contact.external_user_id,
    contact.username || null, contact.display_name || null, contact.phone_hint || null,
    contact.consent_status || 'unknown', contact.consent_source || null,
    contact.consented_at || null, timestamp, timestamp, timestamp
  ).run();
}

export async function sendInstagramPrivateReply(env, igUserId, commentId, text) {
  if (env.NNE_META_AUTOREPLY_ENABLED !== 'true') return { skipped: true };
  if (!env.INSTAGRAM_ACCESS_TOKEN || !igUserId || !commentId || !text) return { skipped: true };
  const version = clean(env.META_GRAPH_VERSION, 20) || 'v25.0';
  const response = await fetch(`https://graph.instagram.com/${version}/${encodeURIComponent(igUserId)}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.INSTAGRAM_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ recipient: { comment_id: commentId }, message: { text } })
  });
  if (!response.ok) throw new Error(`instagram_private_reply_${response.status}`);
  return response.json();
}
