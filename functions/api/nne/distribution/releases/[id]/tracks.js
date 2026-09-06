import { clean, jsonError, jsonOk, now, onOptions, readJson, writeNneAudit } from "../../../../../_lib/nne-api.js";
import { loadDistributionRelease, requireDistributionAccess, writeDistributionEvent } from "../../../../../_lib/nne-distribution.js";

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env, params }) {
  const auth = await requireDistributionAccess(request, env, params.id);
  if (!auth.ok) return auth.response;
  const release = await loadDistributionRelease(env, params.id);
  if (!release) return jsonError("nne_distribution_release_not_found", "Lanzamiento no encontrado.", 404);
  if (!["draft", "changes_requested"].includes(release.status)) {
    return jsonError("nne_distribution_release_locked", "Devuelve el lanzamiento a correcciones antes de cambiar el tracklist.", 409);
  }
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const title = clean(parsed.payload?.title, 180);
  if (!title) return jsonError("nne_distribution_track_title_required", "Escribe el título del track.", 400);
  const nextNumber = release.tracks.reduce((highest, track) => Math.max(highest, Number(track.track_number || 0)), 0) + 1;
  const id = `nne_dist_track_${crypto.randomUUID().replaceAll("-", "")}`;
  const timestamp = now();
  await env.DB.prepare(
    `INSERT INTO nne_distribution_tracks (
      id,release_id,disc_number,track_number,title,artist_display,language_code,primary_genre,created_at,updated_at
    ) VALUES (?,?,1,?,?,?,?,?,?,?)`
  ).bind(id, release.id, nextNumber, title, release.artist_name, release.language_code, release.primary_genre, timestamp, timestamp).run();
  await writeDistributionEvent(env, release.id, auth.user.id, "track.created", release.status, release.status, { track_id: id, title });
  await writeNneAudit(env, request, auth.user.id, "distribution.track_created", "nne_distribution_track", id, { release_id: release.id });
  return jsonOk({ release: await loadDistributionRelease(env, release.id) }, 201);
}
