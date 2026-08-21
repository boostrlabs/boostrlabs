import { jsonError, jsonOk, now, requireNneSession, sha256 } from "../../../../../_lib/nne-api.js";

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
