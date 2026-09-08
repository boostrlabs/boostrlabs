import { clean, jsonError, onOptions } from "../../../../../_lib/nne-api.js";
import { requireDistributionAccess } from "../../../../../_lib/nne-distribution.js";
import { requireNneAssets } from "../../../../../_lib/nne-secure-media.js";

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env, params }) {
  const jobId = clean(params.jobId, 120);
  const job = await env.DB.prepare(
    `SELECT job.release_id,job.package_object_key,release.title,artist.slug AS artist_slug
     FROM nne_distribution_delivery_jobs job
     JOIN nne_distribution_releases release ON release.id=job.release_id
     JOIN nne_distribution_artists artist ON artist.id=release.artist_id
     WHERE job.id=? LIMIT 1`
  ).bind(jobId).first();
  if (!job?.release_id || !job.package_object_key) {
    return jsonError("nne_distribution_package_missing", "Paquete de distribución no encontrado.", 404);
  }
  const auth = await requireDistributionAccess(request, env, job.release_id);
  if (!auth.ok) return auth.response;
  const assets = requireNneAssets(env);
  if (!assets.ok) return assets.response;
  const object = await env.BOOSTR_ASSETS.get(job.package_object_key);
  if (!object) return jsonError("nne_distribution_package_missing", "El manifest ya no está disponible.", 404);
  const safeName = `${clean(job.artist_slug, 80)}-${clean(job.title, 80)}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return new Response(object.body, { headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Disposition": `attachment; filename="${safeName || "nne-release"}-manifest.json"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff"
  }});
}
