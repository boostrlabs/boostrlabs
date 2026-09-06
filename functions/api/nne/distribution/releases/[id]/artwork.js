import { jsonError } from "../../../../../_lib/nne-api.js";
import { requireDistributionAccess } from "../../../../../_lib/nne-distribution.js";
import { requireNneAssets } from "../../../../../_lib/nne-secure-media.js";

export async function onRequestGet({ request, env, params }) {
  const auth = await requireDistributionAccess(request, env, params.id);
  if (!auth.ok) return auth.response;
  const assets = requireNneAssets(env);
  if (!assets.ok) return assets.response;
  const release = await env.DB.prepare("SELECT artwork_object_key FROM nne_distribution_releases WHERE id=? LIMIT 1")
    .bind(params.id).first();
  if (!release?.artwork_object_key) return jsonError("nne_distribution_artwork_missing", "Portada no disponible.", 404);
  const object = await env.BOOSTR_ASSETS.get(release.artwork_object_key);
  if (!object) return jsonError("nne_distribution_artwork_missing", "Portada no disponible.", 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "private, max-age=900");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(object.body, { headers });
}
