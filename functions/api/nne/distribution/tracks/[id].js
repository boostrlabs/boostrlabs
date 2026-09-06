import { jsonError, jsonOk, onOptions, writeNneAudit } from "../../../../_lib/nne-api.js";
import { loadDistributionRelease, requireDistributionAccess, writeDistributionEvent } from "../../../../_lib/nne-distribution.js";

export const onRequestOptions = onOptions;

export async function onRequestDelete({ request, env, params }) {
  const track = await env.DB.prepare("SELECT id,release_id,title FROM nne_distribution_tracks WHERE id=? LIMIT 1").bind(params.id).first();
  if (!track?.id) return jsonError("nne_distribution_track_not_found", "Track no encontrado.", 404);
  const auth = await requireDistributionAccess(request, env, track.release_id);
  if (!auth.ok) return auth.response;
  const release = await loadDistributionRelease(env, track.release_id);
  if (!["draft", "changes_requested"].includes(release?.status)) {
    return jsonError("nne_distribution_release_locked", "El tracklist está bloqueado durante la revisión.", 409);
  }
  await env.DB.prepare("DELETE FROM nne_distribution_tracks WHERE id=?").bind(track.id).run();
  await writeDistributionEvent(env, track.release_id, auth.user.id, "track.deleted", release.status, release.status, { track_id: track.id, title: track.title });
  await writeNneAudit(env, request, auth.user.id, "distribution.track_deleted", "nne_distribution_track", track.id, { release_id: track.release_id });
  return jsonOk({ release: await loadDistributionRelease(env, track.release_id) });
}
