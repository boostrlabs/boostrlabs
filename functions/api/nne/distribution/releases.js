import {
  clean,
  jsonError,
  jsonOk,
  now,
  onOptions,
  readJson,
  writeNneAudit
} from "../../../_lib/nne-api.js";
import {
  loadDistributionRelease,
  releaseReadiness,
  requireDistributionAccess,
  writeDistributionEvent
} from "../../../_lib/nne-distribution.js";

const releaseTypes = new Set(["single", "ep", "album"]);

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env }) {
  const auth = await requireDistributionAccess(request, env);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const requestedId = clean(url.searchParams.get("id"), 120);
  if (requestedId) {
    const scoped = await requireDistributionAccess(request, env, requestedId);
    if (!scoped.ok) return scoped.response;
    const release = await loadDistributionRelease(env, requestedId);
    if (!release) return jsonError("nne_distribution_release_not_found", "Lanzamiento no encontrado.", 404);
    return jsonOk({ release });
  }

  const isAdmin = auth.user.role === "admin";
  const where = isAdmin
    ? "1=1"
    : `(r.owner_user_id=? OR EXISTS (
         SELECT 1 FROM nne_distribution_access x
         WHERE x.user_id=? AND x.status='active' AND (x.artist_id=r.artist_id OR x.artist_id IS NULL)
       ))`;
  const statement = env.DB.prepare(
    `SELECT r.*, a.name AS artist_name, a.slug AS artist_slug,
            (SELECT COUNT(*) FROM nne_distribution_tracks t WHERE t.release_id=r.id) AS track_count,
            (SELECT COUNT(*) FROM nne_distribution_tracks t WHERE t.release_id=r.id AND t.master_object_key IS NOT NULL) AS master_count,
            (SELECT COUNT(*) FROM nne_distribution_delivery_jobs j WHERE j.release_id=r.id) AS delivery_count
     FROM nne_distribution_releases r
     JOIN nne_distribution_artists a ON a.id=r.artist_id
     WHERE ${where}
     ORDER BY CASE r.status WHEN 'in_review' THEN 1 WHEN 'changes_requested' THEN 2 WHEN 'draft' THEN 3 ELSE 4 END,
              r.updated_at DESC`
  );
  const result = isAdmin ? await statement.all() : await statement.bind(auth.user.id, auth.user.id).all();
  const artists = await env.DB.prepare(
    isAdmin
      ? "SELECT * FROM nne_distribution_artists WHERE status='active' ORDER BY name"
      : `SELECT DISTINCT a.* FROM nne_distribution_artists a
         JOIN nne_distribution_access x ON x.artist_id=a.id
         WHERE x.user_id=? AND x.status='active' AND a.status='active' ORDER BY a.name`
  );
  const artistRows = isAdmin ? await artists.all() : await artists.bind(auth.user.id).all();
  const releases = (result.results || []).map((release) => {
    const readiness = releaseReadiness(
      release,
      Array.from({ length: Number(release.track_count || 0) }, (_, index) => ({
        id: String(index),
        master_object_key: index < Number(release.master_count || 0) ? "ready" : null
      })),
      [],
      []
    );
    return {
      ...release,
      artwork_url: release.artwork_object_key
        ? `/api/nne/distribution/releases/${encodeURIComponent(release.id)}/artwork`
        : release.preview_artwork_url || null,
      readiness_score: readiness.score
    };
  });
  const counts = releases.reduce((acc, release) => {
    acc.total += 1;
    if (release.status === "in_review") acc.in_review += 1;
    if (["approved", "packaged", "delivered", "live", "delivered_demo", "live_demo"].includes(release.status)) acc.approved += 1;
    if (["delivered", "live", "delivered_demo", "live_demo"].includes(release.status)) acc.delivered += 1;
    return acc;
  }, { total: 0, in_review: 0, approved: 0, delivered: 0 });
  return jsonOk({ releases, artists: artistRows.results || [], metrics: counts, role: auth.distributionRole });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireDistributionAccess(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};
  const title = clean(payload.title, 180);
  const artistId = clean(payload.artist_id, 120);
  const releaseType = clean(payload.release_type || "single", 20);
  if (!title || !artistId || !releaseTypes.has(releaseType)) {
    return jsonError("nne_distribution_release_invalid", "Artista, título y tipo de lanzamiento son requeridos.", 400);
  }
  const artist = await env.DB.prepare("SELECT id,name FROM nne_distribution_artists WHERE id=? AND status='active' LIMIT 1")
    .bind(artistId).first();
  if (!artist?.id) return jsonError("nne_distribution_artist_not_found", "Artista no encontrado.", 404);
  if (auth.user.role !== "admin") {
    const permitted = await env.DB.prepare(
      "SELECT id FROM nne_distribution_access WHERE user_id=? AND status='active' AND (artist_id=? OR artist_id IS NULL) LIMIT 1"
    ).bind(auth.user.id, artistId).first();
    if (!permitted?.id) return jsonError("nne_distribution_artist_forbidden", "No tienes acceso a este artista.", 403);
  }
  const id = `nne_dist_release_${crypto.randomUUID().replaceAll("-", "")}`;
  const timestamp = now();
  const providerKey = clean(env.NNE_DISTRIBUTION_PROVIDER || "nne_sandbox", 80);
  await env.DB.prepare(
    `INSERT INTO nne_distribution_releases (
      id,owner_user_id,artist_id,title,release_type,label_name,language_code,status,provider_key,created_at,updated_at
    ) VALUES (?,?,?,?,?,'NOSOTROSNOELLOS NNE','es','draft',?,?,?)`
  ).bind(id, auth.user.id, artistId, title, releaseType, providerKey, timestamp, timestamp).run();
  await writeDistributionEvent(env, id, auth.user.id, "release.created", null, "draft", { artist_name: artist.name });
  await writeNneAudit(env, request, auth.user.id, "distribution.release_created", "nne_distribution_release", id, { title, artist_id: artistId });
  return jsonOk({ release: await loadDistributionRelease(env, id) }, 201);
}
