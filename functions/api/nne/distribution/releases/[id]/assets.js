import { clean, jsonError, jsonOk, now, onOptions, readJson, writeNneAudit } from "../../../../../_lib/nne-api.js";
import { requireNneAssets } from "../../../../../_lib/nne-secure-media.js";
import { loadDistributionRelease, requireDistributionAccess, writeDistributionEvent } from "../../../../../_lib/nne-distribution.js";

const artworkTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const masterTypes = new Set(["audio/wav", "audio/x-wav", "audio/flac", "audio/x-flac"]);
const extensionFor = (type) => ({
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "audio/wav": "wav", "audio/x-wav": "wav", "audio/flac": "flac", "audio/x-flac": "flac"
}[type] || "bin");

export const onRequestOptions = onOptions;

async function writableMaster(request, env, releaseId, trackId) {
  const auth = await requireDistributionAccess(request, env, releaseId);
  if (!auth.ok) return auth;
  const assets = requireNneAssets(env);
  if (!assets.ok) return assets;
  const release = await loadDistributionRelease(env, releaseId);
  if (!release) return { ok: false, response: jsonError("nne_distribution_release_not_found", "Lanzamiento no encontrado.", 404) };
  if (!["draft", "changes_requested"].includes(release.status)) {
    return { ok: false, response: jsonError("nne_distribution_release_locked", "Los archivos están bloqueados durante la revisión.", 409) };
  }
  const track = release.tracks.find((item) => item.id === trackId);
  if (!track) return { ok: false, response: jsonError("nne_distribution_track_not_found", "Track no encontrado dentro del lanzamiento.", 404) };
  return { ok: true, auth, release, track };
}

const multipartKey = (releaseId, trackId, format) => `nne/distribution/releases/${releaseId}/tracks/${trackId}/master.${format}`;

export async function onRequestPost({ request, env, params }) {
  const url = new URL(request.url);
  const action = clean(url.searchParams.get("action"), 30);
  const trackId = clean(url.searchParams.get("track_id"), 120);
  const format = clean(url.searchParams.get("format"), 8).toLowerCase();
  if (!new Set(["wav", "flac"]).has(format)) return jsonError("nne_distribution_master_type", "El master debe ser WAV o FLAC.", 415);
  const scoped = await writableMaster(request, env, params.id, trackId);
  if (!scoped.ok) return scoped.response;
  const key = multipartKey(scoped.release.id, trackId, format);

  if (action === "mpu-create") {
    const originalName = clean(request.headers.get("X-File-Name"), 240) || `master.${format}`;
    const declaredSize = Number(request.headers.get("X-File-Size") || 0);
    if (!Number.isSafeInteger(declaredSize) || declaredSize <= 0 || declaredSize > 600 * 1024 * 1024) {
      return jsonError("nne_distribution_master_size", "El master debe pesar entre 1 byte y 600 MB.", 413);
    }
    const contentType = format === "wav" ? "audio/wav" : "audio/flac";
    const upload = await env.BOOSTR_ASSETS.createMultipartUpload(key, {
      httpMetadata: { contentType },
      customMetadata: { releaseId: scoped.release.id, trackId, kind: "master", uploadedBy: scoped.auth.user.id, originalName }
    });
    return jsonOk({ upload_id: upload.uploadId, key, format });
  }

  if (action === "mpu-complete") {
    const uploadId = clean(url.searchParams.get("upload_id"), 500);
    const parsed = await readJson(request);
    if (!parsed.ok) return parsed.response;
    const parts = Array.isArray(parsed.payload?.parts) ? parsed.payload.parts.slice(0, 10000).map((part) => ({
      partNumber: Math.trunc(Number(part.partNumber)), etag: clean(part.etag, 200)
    })) : [];
    if (!uploadId || !parts.length || parts.some((part) => part.partNumber < 1 || !part.etag)) {
      return jsonError("nne_distribution_multipart_complete", "Faltan partes válidas para completar el master.", 400);
    }
    try {
      const object = await env.BOOSTR_ASSETS.resumeMultipartUpload(key, uploadId).complete(parts);
      if (object.size > 600 * 1024 * 1024) {
        await env.BOOSTR_ASSETS.delete(key);
        return jsonError("nne_distribution_master_size", "El master supera 600 MB.", 413);
      }
      const timestamp = now();
      const originalName = clean(parsed.payload?.original_name, 240) || `master.${format}`;
      const contentType = format === "wav" ? "audio/wav" : "audio/flac";
      await env.DB.prepare(`UPDATE nne_distribution_tracks SET
        master_object_key=?,master_content_type=?,master_original_name=?,master_size_bytes=?,master_etag=?,updated_at=?
        WHERE id=? AND release_id=?`)
        .bind(key, contentType, originalName, object.size, object.etag, timestamp, trackId, scoped.release.id).run();
      await writeDistributionEvent(env, scoped.release.id, scoped.auth.user.id, "asset.master_uploaded", scoped.release.status, scoped.release.status, { track_id: trackId, content_type: contentType, multipart: true });
      await writeNneAudit(env, request, scoped.auth.user.id, "distribution.asset_uploaded", "nne_distribution_release", scoped.release.id, { kind: "master", track_id: trackId, content_type: contentType, multipart: true });
      return jsonOk({ release: await loadDistributionRelease(env, scoped.release.id) });
    } catch (error) {
      return jsonError("nne_distribution_multipart_failed", clean(error?.message, 500) || "No pudimos completar el master.", 400);
    }
  }
  return jsonError("nne_distribution_multipart_action", "Acción multipart no válida.", 400);
}

export async function onRequestDelete({ request, env, params }) {
  const url = new URL(request.url);
  const trackId = clean(url.searchParams.get("track_id"), 120);
  const format = clean(url.searchParams.get("format"), 8).toLowerCase();
  const uploadId = clean(url.searchParams.get("upload_id"), 500);
  const scoped = await writableMaster(request, env, params.id, trackId);
  if (!scoped.ok) return scoped.response;
  if (!uploadId || !new Set(["wav", "flac"]).has(format)) return jsonError("nne_distribution_multipart_abort", "Carga multipart no válida.", 400);
  try { await env.BOOSTR_ASSETS.resumeMultipartUpload(multipartKey(scoped.release.id, trackId, format), uploadId).abort(); } catch {}
  return jsonOk({ aborted: true });
}

export async function onRequestPut({ request, env, params }) {
  const requestUrl = new URL(request.url);
  if (requestUrl.searchParams.get("action") === "mpu-uploadpart") {
    const trackId = clean(requestUrl.searchParams.get("track_id"), 120);
    const format = clean(requestUrl.searchParams.get("format"), 8).toLowerCase();
    const uploadId = clean(requestUrl.searchParams.get("upload_id"), 500);
    const partNumber = Math.trunc(Number(requestUrl.searchParams.get("part_number")));
    if (!request.body || !uploadId || !new Set(["wav", "flac"]).has(format) || partNumber < 1 || partNumber > 10000) {
      return jsonError("nne_distribution_multipart_part", "Parte multipart no válida.", 400);
    }
    const partSize = Number(request.headers.get("Content-Length") || 0);
    if (partSize && partSize > 25 * 1024 * 1024) return jsonError("nne_distribution_multipart_part_size", "Cada parte debe pesar máximo 25 MB.", 413);
    const scoped = await writableMaster(request, env, params.id, trackId);
    if (!scoped.ok) return scoped.response;
    try {
      const part = await env.BOOSTR_ASSETS.resumeMultipartUpload(multipartKey(scoped.release.id, trackId, format), uploadId).uploadPart(partNumber, request.body);
      return jsonOk(part);
    } catch (error) {
      return jsonError("nne_distribution_multipart_part_failed", clean(error?.message, 500) || "No pudimos subir una parte.", 400);
    }
  }
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
