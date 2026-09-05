import {
  jsonError,
  jsonOk,
  now,
  onOptions,
  randomHex,
  requireNneSession,
  sha256,
  writeNneAudit
} from "../../../../_lib/nne-api.js";
import { NNE_DOWNLOAD_SESSION_SECONDS, requireNneAssets } from "../../../../_lib/nne-secure-media.js";

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env, params }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  const assets = requireNneAssets(env);
  if (!assets.ok) return assets.response;

  const license = await env.DB.prepare(
    `SELECT l.id, b.master_object_key
     FROM nne_beat_licenses l JOIN nne_secure_beats b ON b.id = l.beat_id
     WHERE b.id = ? AND l.user_id = ? AND l.status = 'active' LIMIT 1`
  ).bind(params.id, auth.user.id).first();
  if (!license?.id) return jsonError("nne_beat_license_required", "Compra una licencia para descargar el master.", 403);
  if (!license.master_object_key) return jsonError("nne_beat_master_not_ready", "El master todavía está siendo preparado.", 409);

  const token = randomHex(32);
  const id = crypto.randomUUID();
  const timestamp = now();
  const expiresAt = new Date(Date.now() + NNE_DOWNLOAD_SESSION_SECONDS * 1000).toISOString();
  await env.DB.prepare(
    `INSERT INTO nne_beat_download_sessions (
      id, license_id, user_id, nne_session_id, asset_kind, token_hash,
      status, expires_at, created_at
    ) VALUES (?, ?, ?, ?, 'master', ?, 'active', ?, ?)`
  ).bind(id, license.id, auth.user.id, auth.session.id, await sha256(token), expiresAt, timestamp).run();
  await writeNneAudit(env, request, auth.user.id, "beat.download_session.created", "nne_beat_license", license.id, {
    download_session_id: id,
    expires_at: expiresAt
  });
  return jsonOk({
    expires_at: expiresAt,
    download_url: `/api/nne/beats/${encodeURIComponent(params.id)}/download?access=${encodeURIComponent(token)}`
  }, 201);
}
