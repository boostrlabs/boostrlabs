import {
  enforceNneRateLimit,
  getIp,
  jsonError,
  jsonOk,
  now,
  onOptions,
  randomHex,
  requireNneSession,
  sha256,
  writeNneAudit
} from "../../../../_lib/nne-api.js";
import {
  NNE_LISTEN_SESSION_SECONDS,
  nneUserAgentHash,
  requireNneAssets
} from "../../../../_lib/nne-secure-media.js";

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env, params }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  const assets = requireNneAssets(env);
  if (!assets.ok) return assets.response;

  const allowed = await enforceNneRateLimit(env, `secure-listen:${auth.user.id}:${getIp(request)}`, 30, 60);
  if (!allowed) return jsonError("nne_listen_rate_limited", "Espera un momento antes de abrir otra sesión.", 429);

  const beat = await env.DB.prepare(
    `SELECT id, stream_object_key FROM nne_secure_beats
     WHERE id = ? AND status IN ('published', 'sold') LIMIT 1`
  ).bind(params.id).first();
  if (!beat?.id) return jsonError("nne_beat_not_found", "Este beat no está disponible.", 404);
  if (!beat.stream_object_key) return jsonError("nne_beat_stream_not_ready", "La escucha segura todavía no está preparada.", 409);

  const token = randomHex(32);
  const timestamp = now();
  const expiresAt = new Date(Date.now() + NNE_LISTEN_SESSION_SECONDS * 1000).toISOString();
  const sessionId = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE nne_beat_listen_sessions SET status = 'revoked'
       WHERE user_id = ? AND beat_id = ? AND nne_session_id = ? AND status = 'active'`
    ).bind(auth.user.id, beat.id, auth.session.id),
    env.DB.prepare(
      `INSERT INTO nne_beat_listen_sessions (
        id, beat_id, user_id, nne_session_id, token_hash, user_agent_hash,
        status, expires_at, created_at, last_seen_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`
    ).bind(
      sessionId,
      beat.id,
      auth.user.id,
      auth.session.id,
      await sha256(token),
      await nneUserAgentHash(request),
      expiresAt,
      timestamp,
      timestamp
    )
  ]);
  await writeNneAudit(env, request, auth.user.id, "beat.listen_session.created", "nne_beat", beat.id, {
    listen_session_id: sessionId,
    expires_at: expiresAt
  });
  return jsonOk({
    expires_at: expiresAt,
    stream_url: `/api/nne/beats/${encodeURIComponent(beat.id)}/stream?access=${encodeURIComponent(token)}`
  }, 201);
}
