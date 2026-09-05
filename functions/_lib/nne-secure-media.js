import { clean, getUa, jsonError, now, sha256 } from "./nne-api.js";

export const NNE_LISTEN_SESSION_SECONDS = 15 * 60;
export const NNE_DOWNLOAD_SESSION_SECONDS = 5 * 60;

export function requireNneAssets(env) {
  if (!env.BOOSTR_ASSETS) {
    return {
      ok: false,
      response: jsonError("nne_media_unavailable", "El almacenamiento seguro no está disponible.", 503)
    };
  }
  return { ok: true };
}

export async function nneUserAgentHash(request) {
  return sha256(getUa(request) || "unknown");
}

export async function getActiveListenSession(env, request, auth, beatId, token) {
  if (!token) return null;
  return env.DB.prepare(
    `SELECT ls.id, ls.user_agent_hash, b.stream_object_key, b.stream_content_type
     FROM nne_beat_listen_sessions ls
     JOIN nne_secure_beats b ON b.id = ls.beat_id
     WHERE ls.token_hash = ? AND ls.beat_id = ? AND ls.user_id = ?
       AND ls.nne_session_id = ? AND ls.status = 'active' AND ls.expires_at > ?
       AND (b.status = 'published' OR EXISTS (
         SELECT 1 FROM nne_beat_licenses l
         WHERE l.beat_id = b.id AND l.user_id = ls.user_id AND l.status = 'active'
       ))
     LIMIT 1`
  ).bind(await sha256(token), beatId, auth.user.id, auth.session.id, now()).first();
}

export async function getActiveDownloadSession(env, auth, beatId, token) {
  if (!token) return null;
  return env.DB.prepare(
    `SELECT ds.id, l.id AS license_id, b.title, b.master_object_key, b.master_content_type
     FROM nne_beat_download_sessions ds
     JOIN nne_beat_licenses l ON l.id = ds.license_id
     JOIN nne_secure_beats b ON b.id = l.beat_id
     WHERE ds.token_hash = ? AND b.id = ? AND ds.user_id = ?
       AND ds.nne_session_id = ? AND ds.status = 'active' AND ds.expires_at > ?
       AND l.status = 'active'
     LIMIT 1`
  ).bind(await sha256(token), beatId, auth.user.id, auth.session.id, now()).first();
}

export function safeDownloadName(title, extension = "wav") {
  const base = clean(title, 120)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "westdetro-beat";
  return `${base}.${extension}`;
}

export function r2AudioResponse(object, { downloadName = "", contentType = "audio/mpeg" } = {}) {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Content-Type", headers.get("Content-Type") || contentType);
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (object.httpEtag) headers.set("ETag", object.httpEtag);
  if (downloadName) headers.set("Content-Disposition", `attachment; filename="${downloadName}"`);
  else headers.set("Content-Disposition", "inline");

  let status = 200;
  if (object.range && "offset" in object.range && "length" in object.range) {
    status = 206;
    const end = object.range.offset + object.range.length - 1;
    headers.set("Content-Range", `bytes ${object.range.offset}-${end}/${object.size}`);
    headers.set("Content-Length", String(object.range.length));
  } else {
    headers.set("Content-Length", String(object.size));
  }
  return new Response(object.body, { status, headers });
}
