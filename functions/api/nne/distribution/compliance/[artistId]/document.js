import { clean, jsonError, onOptions } from "../../../../../_lib/nne-api.js";
import { requireDistributionAccess } from "../../../../../_lib/nne-distribution.js";
import { requireNneAssets } from "../../../../../_lib/nne-secure-media.js";

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env, params }) {
  const auth = await requireDistributionAccess(request, env);
  if (!auth.ok) return auth.response;

  const assets = requireNneAssets(env);
  if (!assets.ok) return assets.response;

  const artistId = clean(params.artistId, 120);
  if (auth.user.role !== "admin") {
    const access = await env.DB.prepare(
      "SELECT id FROM nne_distribution_access WHERE user_id=? AND artist_id=? AND status='active' LIMIT 1"
    ).bind(auth.user.id, artistId).first();
    if (!access?.id) return jsonError("nne_distribution_artist_forbidden", "No puedes abrir ese documento fiscal.", 403);
  }

  const profile = await env.DB.prepare(
    `SELECT id,tax_form_type,tax_document_object_key
     FROM nne_distribution_payee_profiles
     WHERE artist_id=? LIMIT 1`
  ).bind(artistId).first();
  if (!profile?.tax_document_object_key) {
    return jsonError("nne_distribution_tax_document_missing", "No hay documento fiscal para este artista.", 404);
  }

  const object = await env.BOOSTR_ASSETS.get(profile.tax_document_object_key);
  if (!object) return jsonError("nne_distribution_tax_document_missing", "El documento fiscal ya no está disponible.", 404);

  const safeForm = clean(profile.tax_form_type, 40).replace(/[^a-z0-9-]/gi, "-") || "tax-form";
  return new Response(object.body, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="nne-${safeForm}-${artistId}.pdf"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'self'"
    }
  });
}
