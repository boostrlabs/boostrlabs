import { jsonOk, now, requireNneSession, sha256 } from "../../../../../_lib/nne-api.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;

  const row = await env.DB.prepare(
    `SELECT status, external_identifier, challenge_expires_at, verified_at, updated_at
     FROM nne_identity_verifications
     WHERE user_id = ? AND channel = 'telegram'
     LIMIT 1`
  ).bind(auth.user.id).first();

  return jsonOk({
    channel: "telegram",
    status: row?.status || "pending",
    external_identifier: row?.external_identifier || null,
    challenge_expires_at: row?.challenge_expires_at || null,
    verified_at: row?.verified_at || null,
    updated_at: row?.updated_at || null
  });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;

  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0");
  const timestamp = now();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const challengeHash = await sha256(code);

  await env.DB.prepare(
    `INSERT INTO nne_identity_verifications (
       id, user_id, channel, external_identifier, status,
       challenge_hash, challenge_expires_at, sent_at, created_at, updated_at
     ) VALUES (?, ?, 'telegram', 'pending', 'challenge_sent', ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, channel) WHERE user_id IS NOT NULL DO UPDATE SET
       external_identifier='pending', status='challenge_sent', challenge_hash=excluded.challenge_hash,
       challenge_expires_at=excluded.challenge_expires_at, sent_at=excluded.sent_at,
       verified_at=NULL, updated_at=excluded.updated_at`
  ).bind(
    crypto.randomUUID(), auth.user.id, challengeHash, expiresAt,
    timestamp, timestamp, timestamp
  ).run();

  return jsonOk({
    channel: "telegram",
    status: "challenge_sent",
    code,
    expires_at: expiresAt,
    instruction: `Escribe VERIFY ${code} al bot oficial de NNE en Telegram.`
  });
}
