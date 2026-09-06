import { clean, jsonError, requireNneSession } from "./nne-api.js";
import { distributionProviderState } from "./nne-distribution-provider.js";

export const DISTRIBUTION_AGREEMENT_VERSION = "nne-distribution-pilot-2026-09";

const parseJson = (value, fallback = []) => {
  try {
    const parsed = JSON.parse(value || "");
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

export async function requireDistributionAccess(request, env, releaseId = null) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth;
  if (auth.user.role === "admin") return { ...auth, distributionRole: "label_admin" };

  let row;
  if (releaseId) {
    row = await env.DB.prepare(
      `SELECT a.role
       FROM nne_distribution_releases r
       LEFT JOIN nne_distribution_access a
         ON a.user_id=? AND a.status='active' AND (a.artist_id=r.artist_id OR a.artist_id IS NULL)
       WHERE r.id=? AND (r.owner_user_id=? OR a.id IS NOT NULL)
       LIMIT 1`
    ).bind(auth.user.id, clean(releaseId, 120), auth.user.id).first();
  } else {
    row = await env.DB.prepare(
      "SELECT role FROM nne_distribution_access WHERE user_id=? AND status='active' ORDER BY CASE role WHEN 'label_admin' THEN 1 WHEN 'manager' THEN 2 ELSE 3 END LIMIT 1"
    ).bind(auth.user.id).first();
  }
  if (!row?.role) {
    return {
      ok: false,
      response: jsonError(
        "nne_distribution_invite_required",
        "NNE Distribution está en piloto privado. Solicita acceso al equipo.",
        403
      )
    };
  }
  return { ...auth, distributionRole: row.role };
}

export function releaseReadiness(release, tracks = [], contributors = [], splits = []) {
  const checks = [];
  const add = (key, label, ready, detail) => checks.push({ key, label, ready: Boolean(ready), detail });
  add("release_date", "Fecha de lanzamiento", release.release_date, "Programa una fecha futura antes de enviar.");
  add("metadata", "Metadata editorial", release.primary_genre && release.language_code && release.c_line && release.p_line, "Completa género, idioma y líneas C/P.");
  add("artwork", "Portada original", release.artwork_object_key, "Sube la portada final en JPG, PNG o WebP.");
  add("rights", "Derechos confirmados", Number(release.rights_confirmed) === 1, "Confirma que NNE está autorizado a distribuir cada master.");
  add("agreement", "Acuerdo piloto", Number(release.agreement_accepted) === 1, "Acepta el acuerdo de distribución vigente.");
  add("tracks", "Tracklist", tracks.length > 0, "Agrega al menos una grabación.");

  const mastersMissing = tracks.filter((track) => !track.master_object_key);
  add("masters", "Masters WAV/FLAC", tracks.length > 0 && mastersMissing.length === 0, mastersMissing.length ? `${mastersMissing.length} master(s) pendiente(s).` : "Masters privados listos.");

  const contributorTrackIds = new Set(contributors.map((item) => item.track_id));
  const missingCredits = tracks.filter((track) => !contributorTrackIds.has(track.id));
  add("credits", "Créditos", tracks.length > 0 && missingCredits.length === 0, missingCredits.length ? `${missingCredits.length} track(s) sin créditos.` : "Créditos capturados.");

  const splitTotals = new Map();
  for (const split of splits) splitTotals.set(split.track_id, (splitTotals.get(split.track_id) || 0) + Number(split.percentage_bps || 0));
  const invalidSplits = tracks.filter((track) => splitTotals.get(track.id) !== 10000);
  add("splits", "Splits del master", tracks.length > 0 && invalidSplits.length === 0, invalidSplits.length ? `${invalidSplits.length} track(s) no suman 100%.` : "Splits balanceados al 100%.");

  const readyCount = checks.filter((item) => item.ready).length;
  return {
    score: Math.round((readyCount / checks.length) * 100),
    ready: readyCount === checks.length,
    checks,
    blockers: checks.filter((item) => !item.ready)
  };
}

export async function loadDistributionRelease(env, releaseId) {
  const release = await env.DB.prepare(
    `SELECT r.*, a.name AS artist_name, a.slug AS artist_slug, a.instagram_handle,
            u.username AS owner_username
     FROM nne_distribution_releases r
     JOIN nne_distribution_artists a ON a.id=r.artist_id
     LEFT JOIN nne_users u ON u.id=r.owner_user_id
     WHERE r.id=? LIMIT 1`
  ).bind(clean(releaseId, 120)).first();
  if (!release?.id) return null;

  const [trackRows, contributorRows, splitRows, eventRows, jobRows] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM nne_distribution_tracks WHERE release_id=? ORDER BY disc_number,track_number").bind(release.id),
    env.DB.prepare("SELECT c.* FROM nne_distribution_contributors c JOIN nne_distribution_tracks t ON t.id=c.track_id WHERE t.release_id=? ORDER BY t.track_number,c.role,c.name").bind(release.id),
    env.DB.prepare("SELECT s.* FROM nne_distribution_splits s JOIN nne_distribution_tracks t ON t.id=s.track_id WHERE t.release_id=? ORDER BY t.track_number,s.participant_name").bind(release.id),
    env.DB.prepare("SELECT * FROM nne_distribution_events WHERE release_id=? ORDER BY created_at DESC LIMIT 100").bind(release.id),
    env.DB.prepare("SELECT id,provider_key,status,attempt_count,last_error,created_at,updated_at,accepted_at FROM nne_distribution_delivery_jobs WHERE release_id=? ORDER BY created_at DESC LIMIT 20").bind(release.id)
  ]);

  const tracks = trackRows.results || [];
  const contributors = contributorRows.results || [];
  const splits = splitRows.results || [];
  const normalized = {
    ...release,
    explicit_content: Boolean(release.explicit_content),
    rights_confirmed: Boolean(release.rights_confirmed),
    agreement_accepted: Boolean(release.agreement_accepted),
    territories: parseJson(release.territories_json, ["WORLDWIDE"]),
    stores: parseJson(release.stores_json, []),
    artwork_url: release.artwork_object_key
      ? `/api/nne/distribution/releases/${encodeURIComponent(release.id)}/artwork`
      : release.preview_artwork_url || null,
    tracks: tracks.map((track) => ({
      ...track,
      explicit_content: Boolean(track.explicit_content),
      instrumental: Boolean(track.instrumental),
      master_ready: Boolean(track.master_object_key),
      contributors: contributors.filter((item) => item.track_id === track.id),
      splits: splits.filter((item) => item.track_id === track.id).map((item) => ({
        ...item,
        percentage: Number(item.percentage_bps || 0) / 100
      }))
    })),
    events: eventRows.results || [],
    delivery_jobs: jobRows.results || []
  };
  normalized.readiness = releaseReadiness(normalized, tracks, contributors, splits);
  normalized.provider = distributionProviderState(env, normalized.provider_key);
  return normalized;
}

export async function writeDistributionEvent(env, releaseId, actorUserId, eventType, fromStatus = null, toStatus = null, metadata = {}) {
  await env.DB.prepare(
    `INSERT INTO nne_distribution_events (
      id,release_id,actor_user_id,event_type,from_status,to_status,metadata_json,created_at
    ) VALUES (?,?,?,?,?,?,?,datetime('now'))`
  ).bind(
    `dist_evt_${crypto.randomUUID().replaceAll("-", "")}`,
    clean(releaseId, 120),
    actorUserId || null,
    clean(eventType, 100),
    clean(fromStatus, 40) || null,
    clean(toStatus, 40) || null,
    JSON.stringify(metadata || {})
  ).run();
}

export function buildDistributionManifest(release) {
  return {
    schema: "nne-distribution-package/1.0",
    generated_at: new Date().toISOString(),
    provider: release.provider_key || "nne_sandbox",
    release: {
      id: release.id,
      title: release.title,
      type: release.release_type,
      primary_artist: release.artist_name,
      label: release.label_name,
      upc: release.upc || null,
      catalog_number: release.catalog_number || null,
      release_date: release.release_date,
      original_release_date: release.original_release_date || null,
      genre: release.primary_genre,
      secondary_genre: release.secondary_genre || null,
      language: release.language_code,
      copyright: { c_line: release.c_line, p_line: release.p_line },
      territories: release.territories,
      stores: release.stores,
      artwork_object_key: release.artwork_object_key,
      tracks: release.tracks.map((track) => ({
        id: track.id,
        disc_number: track.disc_number,
        track_number: track.track_number,
        title: track.title,
        version_title: track.version_title || null,
        artist_display: track.artist_display,
        isrc: track.isrc || null,
        explicit: track.explicit_content,
        instrumental: track.instrumental,
        language: track.language_code,
        master_object_key: track.master_object_key,
        master_etag: track.master_etag,
        contributors: track.contributors.map(({ name, role, ipi_cae, pro_name, publisher_name }) => ({ name, role, ipi_cae, pro_name, publisher_name })),
        master_splits: track.splits.map(({ participant_name, participant_email, role, percentage_bps, status }) => ({ participant_name, participant_email, role, percentage_bps, status }))
      }))
    }
  };
}
