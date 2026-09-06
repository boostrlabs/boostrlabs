import { jsonError, jsonOk, now, onOptions, writeNneAudit } from "../../../../../_lib/nne-api.js";
import { loadDistributionRelease, requireDistributionAccess, writeDistributionEvent } from "../../../../../_lib/nne-distribution.js";

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env, params }) {
  const auth = await requireDistributionAccess(request, env, params.id);
  if (!auth.ok) return auth.response;
  const release = await loadDistributionRelease(env, params.id);
  if (!release) return jsonError("nne_distribution_release_not_found", "Lanzamiento no encontrado.", 404);
  if (!["draft", "changes_requested"].includes(release.status)) {
    return jsonError("nne_distribution_submit_status", "Este lanzamiento ya fue enviado o está bloqueado.", 409);
  }
  if (!release.readiness.ready) {
    return jsonError(
      "nne_distribution_release_incomplete",
      "Completa los requisitos antes de enviar a revisión.",
      422,
      { readiness: release.readiness }
    );
  }
  const timestamp = now();
  await env.DB.prepare(
    "UPDATE nne_distribution_releases SET status='in_review',submitted_at=?,review_note=NULL,updated_at=? WHERE id=?"
  ).bind(timestamp, timestamp, release.id).run();
  await writeDistributionEvent(env, release.id, auth.user.id, "release.submitted", release.status, "in_review", { readiness_score: 100 });
  await writeNneAudit(env, request, auth.user.id, "distribution.release_submitted", "nne_distribution_release", release.id, { readiness_score: 100 });
  return jsonOk({ release: await loadDistributionRelease(env, release.id) });
}
