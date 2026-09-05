import { jsonError, now, requireNneSession } from "../../../../_lib/nne-api.js";
import {
  getActiveDownloadSession,
  r2AudioResponse,
  requireNneAssets,
  safeDownloadName
} from "../../../../_lib/nne-secure-media.js";

export async function onRequestGet({ request, env, params }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  const assets = requireNneAssets(env);
  if (!assets.ok) return assets.response;

  const access = new URL(request.url).searchParams.get("access") || "";
  const download = await getActiveDownloadSession(env, auth, params.id, access);
  if (!download?.id) return jsonError("nne_download_session_invalid", "El enlace expiró. Genera uno nuevo.", 403);
  if (!download.master_object_key) return jsonError("nne_beat_master_not_ready", "Master no disponible.", 404);

  const object = await env.BOOSTR_ASSETS.get(download.master_object_key);
  if (!object) return jsonError("nne_beat_master_not_found", "Master no disponible.", 404);
  await env.DB.prepare(
    "UPDATE nne_beat_download_sessions SET status = 'used', used_at = ? WHERE id = ? AND status = 'active'"
  ).bind(now(), download.id).run();
  const extension = download.master_content_type === "audio/mpeg" ? "mp3" : "wav";
  return r2AudioResponse(object, {
    downloadName: safeDownloadName(download.title, extension),
    contentType: download.master_content_type || "audio/wav"
  });
}
