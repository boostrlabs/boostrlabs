import { jsonError, now, requireNneSession } from "../../../../_lib/nne-api.js";
import {
  getActiveListenSession,
  nneUserAgentHash,
  r2AudioResponse,
  requireNneAssets
} from "../../../../_lib/nne-secure-media.js";

export async function onRequestGet({ request, env, params }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  const assets = requireNneAssets(env);
  if (!assets.ok) return assets.response;

  const access = new URL(request.url).searchParams.get("access") || "";
  const listen = await getActiveListenSession(env, request, auth, params.id, access);
  if (!listen?.id || listen.user_agent_hash !== await nneUserAgentHash(request)) {
    return jsonError("nne_listen_session_invalid", "La sesión de escucha expiró o no pertenece a este dispositivo.", 403);
  }
  if (!listen.stream_object_key) return jsonError("nne_beat_stream_not_ready", "Audio no disponible.", 404);

  const object = await env.BOOSTR_ASSETS.get(listen.stream_object_key, { range: request.headers });
  if (!object) return jsonError("nne_beat_stream_not_found", "Audio no disponible.", 404);

  await env.DB.prepare("UPDATE nne_beat_listen_sessions SET last_seen_at = ? WHERE id = ?")
    .bind(now(), listen.id).run();
  return r2AudioResponse(object, { contentType: listen.stream_content_type || "audio/mpeg" });
}
