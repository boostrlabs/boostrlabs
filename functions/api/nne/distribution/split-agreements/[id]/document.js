import { jsonError, onOptions } from "../../../../../_lib/nne-api.js";
import { requireDistributionAccess } from "../../../../../_lib/nne-distribution.js";
import { requireNneAssets } from "../../../../../_lib/nne-secure-media.js";

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env, params }) {
  const assets = requireNneAssets(env);
  if (!assets.ok) return assets.response;
  const row = await env.DB.prepare("SELECT release_id,pdf_object_key,executed_pdf_object_key,status FROM nne_distribution_split_agreements WHERE id=? LIMIT 1").bind(params.id).first();
  if (!row?.release_id) return jsonError("nne_distribution_split_not_found", "Split sheet no encontrado.", 404);
  const auth = await requireDistributionAccess(request, env, row.release_id);
  if (!auth.ok) return auth.response;
  const key = row.status === "completed" && row.executed_pdf_object_key ? row.executed_pdf_object_key : row.pdf_object_key;
  const object = await env.BOOSTR_ASSETS.get(key);
  if (!object) return jsonError("nne_distribution_split_document_missing", "El PDF ya no está disponible.", 404);
  return new Response(object.body, { headers: {
    "Content-Type": "application/pdf", "Content-Disposition": `inline; filename=\"nne-split-${params.id}.pdf\"`,
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"
  }});
}
