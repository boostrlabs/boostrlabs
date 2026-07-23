import { clean, jsonError, requireNneAdmin } from "../../../../../_lib/nne-api.js";

export async function onRequestGet({ request, env, params }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  if (!env.BOOSTR_ASSETS) return jsonError("nne_storage_unavailable", "Storage no disponible.", 503);

  const attempt = await env.DB.prepare(
    `SELECT evidence_r2_key, evidence_content_type, evidence_original_name
     FROM nne_quest_attempts
     WHERE id = ? AND evidence_r2_key LIKE 'nne/evidence/%'
     LIMIT 1`
  )
    .bind(clean(params.attemptId, 120))
    .first();
  if (!attempt?.evidence_r2_key) return jsonError("nne_evidence_not_found", "Evidencia no encontrada.", 404);

  const object = await env.BOOSTR_ASSETS.get(attempt.evidence_r2_key);
  if (!object) return jsonError("nne_evidence_not_found", "El archivo ya no está disponible.", 404);

  return new Response(object.body, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": attempt.evidence_content_type || object.httpMetadata?.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${String(attempt.evidence_original_name || "evidence").replaceAll('"', "")}"`,
      "X-Content-Type-Options": "nosniff"
    }
  });
}
