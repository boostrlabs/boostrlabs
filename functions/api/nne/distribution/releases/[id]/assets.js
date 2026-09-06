import { clean, jsonError, jsonOk, now, onOptions, writeNneAudit } from "../../../../../_lib/nne-api.js";
import { requireNneAssets } from "../../../../../_lib/nne-secure-media.js";
import { loadDistributionRelease, requireDistributionAccess, writeDistributionEvent } from "../../../../../_lib/nne-distribution.js";

const artworkTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const masterTypes = new Set(["audio/wav", "audio/x-wav", "audio/flac", "audio/x-flac"]);
const extensionFor = (type) => ({
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "audio/wav": "wav", "audio/x-wav": "wav", "audio/flac": "flac", "audio/x-flac": "flac"
}[type] || "bin");

export const onRequestOptions = onOptions;

export async function onRequestPut({ request, env, params }) {
  const auth = await requireDistributionAccess(request, env, params.id);
  if (!auth.ok) return auth.response;
  const assets = requireNneAssets(env);
  if (!assets.ok) return assets.response;
  const release = await loadDistributionRelease(env, params.id);
  if (!release) return jsonError("nne_distribution_release_not_found", "Lanzamiento no encontrado.", 404);
  if (!["draft", "changes_requested"].includes(release.status)) {
    return jsonError("nne_distribution_release_locked", "Los archivos están bloqueados durante la revisión.", 409);
  }
  if (!request.body) return jsonError("nne_distribution_asset_required", "Selecciona un archivo.", 400);
  const url = new URL(request.url);
  const kind = clean(url.searchParams.get("kind"), 20);
  const trackId = clean(url.searchParams.get("track_id"), 120);
  const contentType = clean(request.headers.get("Content-Type"), 100).split(";")[0].toLowerCase();
  const size = Number(request.headers.get("Content-Length") || 0);
  if (kind === "artwork") {
    if (!artworkTypes.has(contentType)) return jsonError("nne_distribution_artwork_type", "La portada debe ser JPG, PNG o WebP.", 415);
    if (size && size > 25 * 1024 * 1024) return jsonError("nne_distribution_artwork_size", "La portada supera 25 MB.", 413);
  } else if (kind === "master") {
    if (!masterTypes.has(contentType)) return jsonError("nne_distribution_master_type", "El master debe ser WAV o FLAC sin pérdida.", 415);
    if (size && size > 600 * 1024 * 1024) return jsonError("nne_distribution_master_size", "El master supera 600 MB.", 413);
    const track = release.tracks.find((item) => item.id === trackId);
    if (!track) return jsonError("nne_distribution_track_not_found", "Track no encontrado dentro del lanzamiento.", 404);
  } else {
    return jsonError("nne_distribution_asset_kind", "Tipo de asset no válido.", 400);
  }

  const extension = extensionFor(contentType);
  const objectKey = kind === "artwork"
    ? `nne/distribution/releases/${release.id}/artwork.${extension}`
    : `nne/distribution/releases/${release.id}/tracks/${trackId}/master.${extension}`;
  const uploaded = await env.BOOSTR_ASSETS.put(objectKey, request.body, {
    httpMetadata: { contentType },
    customMetadata: {
      releaseId: release.id,
      trackId: trackId || "",
      kind,
      uploadedBy: auth.user.id,
      originalName: clean(request.headers.get("X-File-Name"), 240)
    }
  });
  const timestamp = now();
  if (kind === "artwork") {
    await env.DB.prepare(
      "UPDATE nne_distribution_releases SET artwork_object_key=?,artwork_content_type=?,artwork_etag=?,updated_at=? WHERE id=?"
    ).bind(objectKey, contentType, uploaded.etag, timestamp, release.id).run();
  } else {
    await env.DB.prepare(
      `UPDATE nne_distribution_tracks SET
        master_object_key=?,master_content_type=?,master_original_name=?,master_size_bytes=?,master_etag=?,updated_at=?
       WHERE id=? AND release_id=?`
    ).bind(
      objectKey,
      contentType,
      clean(request.headers.get("X-File-Name"), 240) || `master.${extension}`,
      size || null,
      uploaded.etag,
      timestamp,
      trackId,
      release.id
    ).run();
  }
  await writeDistributionEvent(env, release.id, auth.user.id, `asset.${kind}_uploaded`, release.status, release.status, { track_id: trackId || null, content_type: contentType, etag: uploaded.etag });
  await writeNneAudit(env, request, auth.user.id, "distribution.asset_uploaded", "nne_distribution_release", release.id, { kind, track_id: trackId || null, content_type: contentType });
  return jsonOk({ release: await loadDistributionRelease(env, release.id) });
}
