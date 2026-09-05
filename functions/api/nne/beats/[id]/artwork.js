import { jsonError, requireNneSession } from "../../../../_lib/nne-api.js";
import { requireNneAssets } from "../../../../_lib/nne-secure-media.js";

export async function onRequestGet({ request, env, params }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  const assets = requireNneAssets(env);
  if (!assets.ok) return assets.response;

  const beat = await env.DB.prepare(
    "SELECT artwork_object_key FROM nne_secure_beats WHERE id = ? AND status IN ('published', 'sold') LIMIT 1"
  ).bind(params.id).first();
  if (!beat?.artwork_object_key) return jsonError("nne_beat_artwork_missing", "Artwork no disponible.", 404);

  const object = await env.BOOSTR_ASSETS.get(beat.artwork_object_key);
  if (!object) return jsonError("nne_beat_artwork_missing", "Artwork no disponible.", 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "private, max-age=3600");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(object.body, { headers });
}
