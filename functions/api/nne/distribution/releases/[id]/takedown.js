import { clean, jsonError, jsonOk, now, onOptions, readJson, writeNneAudit } from "../../../../../_lib/nne-api.js";
import { loadDistributionRelease, requireDistributionAccess, writeDistributionEvent } from "../../../../../_lib/nne-distribution.js";

const eligibleStatuses = new Set(["delivered", "live", "delivered_demo", "live_demo"]);

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env, params }) {
  const auth = await requireDistributionAccess(request, env, params.id);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const release = await loadDistributionRelease(env, params.id);
  if (!release) return jsonError("nne_distribution_release_not_found", "Lanzamiento no encontrado.", 404);
  if (!eligibleStatuses.has(release.status)) return jsonError("nne_distribution_takedown_status", "Este lanzamiento no puede solicitar retiro ahora.", 409);
  const reason = clean(parsed.payload?.reason, 1200);
  if (reason.length < 10) return jsonError("nne_distribution_takedown_reason", "Explica brevemente por qué debe retirarse.", 400);
  const timestamp = now();
  await env.DB.prepare("UPDATE nne_distribution_releases SET status='takedown_requested',review_note=?,updated_at=? WHERE id=?")
    .bind(reason, timestamp, release.id).run();
  await writeDistributionEvent(env, release.id, auth.user.id, "release.takedown_requested", release.status, "takedown_requested", { reason });
  await writeNneAudit(env, request, auth.user.id, "distribution.takedown_requested", "nne_distribution_release", release.id, { reason });
  return jsonOk({ release: await loadDistributionRelease(env, release.id) });
}
