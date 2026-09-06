import {
  clean,
  jsonError,
  jsonOk,
  now,
  onOptions,
  readJson,
  writeNneAudit
} from "../../../../_lib/nne-api.js";
import {
  DISTRIBUTION_AGREEMENT_VERSION,
  loadDistributionRelease,
  requireDistributionAccess,
  writeDistributionEvent
} from "../../../../_lib/nne-distribution.js";

const releaseTypes = new Set(["single", "ep", "album"]);
const mutableStatuses = new Set(["draft", "changes_requested"]);
const contributorRoles = new Set(["primary_artist", "featured_artist", "producer", "songwriter", "composer", "publisher", "mix_engineer", "mastering_engineer"]);

const dateOrNull = (value) => {
  const date = clean(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
};

const digitsOrNull = (value, max) => {
  const digits = clean(value, max).replace(/\D/g, "");
  return digits || null;
};

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env, params }) {
  const auth = await requireDistributionAccess(request, env, params.id);
  if (!auth.ok) return auth.response;
  const release = await loadDistributionRelease(env, params.id);
  if (!release) return jsonError("nne_distribution_release_not_found", "Lanzamiento no encontrado.", 404);
  return jsonOk({ release });
}

export async function onRequestPatch({ request, env, params }) {
  const auth = await requireDistributionAccess(request, env, params.id);
  if (!auth.ok) return auth.response;
  const current = await loadDistributionRelease(env, params.id);
  if (!current) return jsonError("nne_distribution_release_not_found", "Lanzamiento no encontrado.", 404);
  if (!mutableStatuses.has(current.status) && auth.user.role !== "admin") {
    return jsonError("nne_distribution_release_locked", "El lanzamiento está bloqueado mientras NNE lo revisa.", 409);
  }
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};
  const title = clean(payload.title ?? current.title, 180);
  const releaseType = clean(payload.release_type ?? current.release_type, 20);
  const primaryGenre = clean(payload.primary_genre ?? current.primary_genre, 80);
  const languageCode = clean(payload.language_code ?? current.language_code, 10).toLowerCase();
  if (!title || !releaseTypes.has(releaseType) || !primaryGenre || !languageCode) {
    return jsonError("nne_distribution_release_metadata_invalid", "Título, tipo, género e idioma son requeridos.", 400);
  }
  const timestamp = now();
  const releaseDate = dateOrNull(payload.release_date ?? current.release_date);
  const copyrightYear = Number(payload.copyright_year ?? current.copyright_year ?? new Date().getUTCFullYear());
  await env.DB.prepare(
    `UPDATE nne_distribution_releases SET
      title=?,release_type=?,version_title=?,label_name=?,catalog_number=?,upc=?,
      primary_genre=?,secondary_genre=?,language_code=?,original_release_date=?,release_date=?,
      copyright_year=?,c_line=?,p_line=?,explicit_content=?,territories_json=?,stores_json=?,
      rights_confirmed=?,updated_at=?
     WHERE id=?`
  ).bind(
    title,
    releaseType,
    clean(payload.version_title ?? current.version_title, 120) || null,
    clean(payload.label_name ?? current.label_name, 160) || "NOSOTROSNOELLOS NNE",
    clean(payload.catalog_number ?? current.catalog_number, 80) || null,
    digitsOrNull(payload.upc ?? current.upc, 18),
    primaryGenre,
    clean(payload.secondary_genre ?? current.secondary_genre, 80) || null,
    languageCode,
    dateOrNull(payload.original_release_date ?? current.original_release_date),
    releaseDate,
    Number.isInteger(copyrightYear) && copyrightYear >= 1900 && copyrightYear <= 2200 ? copyrightYear : new Date().getUTCFullYear(),
    clean(payload.c_line ?? current.c_line, 220) || null,
    clean(payload.p_line ?? current.p_line, 220) || null,
    payload.explicit_content ? 1 : 0,
    JSON.stringify(Array.isArray(payload.territories) && payload.territories.length ? payload.territories.map((item) => clean(item, 20)).filter(Boolean) : current.territories),
    JSON.stringify(Array.isArray(payload.stores) && payload.stores.length ? payload.stores.map((item) => clean(item, 40)).filter(Boolean) : current.stores),
    payload.rights_confirmed ? 1 : 0,
    timestamp,
    current.id
  ).run();

  if (Array.isArray(payload.tracks)) {
    const existingIds = new Set(current.tracks.map((track) => track.id));
    for (const [index, input] of payload.tracks.entries()) {
      const trackId = clean(input.id, 120);
      if (!existingIds.has(trackId)) continue;
      await env.DB.prepare(
        `UPDATE nne_distribution_tracks SET
          disc_number=?,track_number=?,title=?,version_title=?,artist_display=?,isrc=?,language_code=?,
          primary_genre=?,explicit_content=?,instrumental=?,updated_at=?
         WHERE id=? AND release_id=?`
      ).bind(
        Math.max(1, Math.floor(Number(input.disc_number || 1))),
        Math.max(1, Math.floor(Number(input.track_number || index + 1))),
        clean(input.title, 180),
        clean(input.version_title, 120) || null,
        clean(input.artist_display, 240) || current.artist_name,
        clean(input.isrc, 20).toUpperCase().replace(/[^A-Z0-9]/g, "") || null,
        clean(input.language_code || languageCode, 10).toLowerCase(),
        clean(input.primary_genre || primaryGenre, 80),
        input.explicit_content ? 1 : 0,
        input.instrumental ? 1 : 0,
        timestamp,
        trackId,
        current.id
      ).run();

      if (Array.isArray(input.contributors)) {
        const rows = input.contributors
          .map((item) => ({
            name: clean(item.name, 180),
            role: clean(item.role, 40),
            ipi_cae: clean(item.ipi_cae, 30) || null,
            pro_name: clean(item.pro_name, 100) || null,
            publisher_name: clean(item.publisher_name, 180) || null
          }))
          .filter((item) => item.name && contributorRoles.has(item.role));
        await env.DB.prepare("DELETE FROM nne_distribution_contributors WHERE track_id=?").bind(trackId).run();
        if (rows.length) {
          await env.DB.batch(rows.map((item) => env.DB.prepare(
            `INSERT INTO nne_distribution_contributors (id,track_id,name,role,ipi_cae,pro_name,publisher_name,created_at,updated_at)
             VALUES (?,?,?,?,?,?,?,datetime('now'),datetime('now'))`
          ).bind(`dist_contrib_${crypto.randomUUID().replaceAll("-", "")}`, trackId, item.name, item.role, item.ipi_cae, item.pro_name, item.publisher_name)));
        }
      }

      if (Array.isArray(input.splits)) {
        const rows = input.splits.map((item) => ({
          participant_name: clean(item.participant_name, 180),
          participant_email: clean(item.participant_email, 180).toLowerCase() || null,
          role: clean(item.role || "master_owner", 80),
          percentage_bps: Math.round(Number(item.percentage ?? Number(item.percentage_bps || 0) / 100) * 100),
          status: clean(item.status || "pending", 20)
        })).filter((item) => item.participant_name && item.percentage_bps > 0 && item.percentage_bps <= 10000);
        await env.DB.prepare("DELETE FROM nne_distribution_splits WHERE track_id=?").bind(trackId).run();
        if (rows.length) {
          await env.DB.batch(rows.map((item) => env.DB.prepare(
            `INSERT INTO nne_distribution_splits (id,track_id,participant_name,participant_email,role,percentage_bps,status,created_at,updated_at)
             VALUES (?,?,?,?,?,?,?,datetime('now'),datetime('now'))`
          ).bind(
            `dist_split_${crypto.randomUUID().replaceAll("-", "")}`,
            trackId,
            item.participant_name,
            item.participant_email,
            item.role,
            item.percentage_bps,
            ["pending", "accepted", "disputed"].includes(item.status) ? item.status : "pending"
          )));
        }
      }
    }
  }

  if (payload.agreement_accepted && !current.agreement_accepted) {
    const attestation = "Confirmo que tengo autorización sobre los masters y metadatos, y acepto el acuerdo piloto de distribución NNE.";
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE nne_distribution_releases SET agreement_accepted=1,agreement_version=?,updated_at=? WHERE id=?"
      ).bind(DISTRIBUTION_AGREEMENT_VERSION, timestamp, current.id),
      env.DB.prepare(
        `INSERT INTO nne_distribution_agreements (id,release_id,user_id,agreement_version,rights_attestation,accepted_ip,accepted_user_agent,accepted_at)
         VALUES (?,?,?,?,?,?,?,?)`
      ).bind(
        `dist_agreement_${crypto.randomUUID().replaceAll("-", "")}`,
        current.id,
        auth.user.id,
        DISTRIBUTION_AGREEMENT_VERSION,
        attestation,
        clean(request.headers.get("CF-Connecting-IP"), 180) || null,
        clean(request.headers.get("User-Agent"), 500) || null,
        timestamp
      )
    ]);
  }

  await writeDistributionEvent(env, current.id, auth.user.id, "release.updated", current.status, current.status, { fields: Object.keys(payload).slice(0, 30) });
  await writeNneAudit(env, request, auth.user.id, "distribution.release_updated", "nne_distribution_release", current.id, { fields: Object.keys(payload).slice(0, 30) });
  return jsonOk({ release: await loadDistributionRelease(env, current.id) });
}
