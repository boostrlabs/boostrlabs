import {
  clean,
  jsonError,
  jsonOk,
  now,
  onOptions,
  requireNneAdmin,
  writeNneAudit
} from "../../../../../_lib/nne-api.js";
import { requireNneAssets } from "../../../../../_lib/nne-secure-media.js";

const allowed = {
  artwork: new Set(["image/jpeg", "image/png", "image/webp"]),
  stream: new Set(["audio/mpeg", "audio/mp4", "audio/aac", "audio/ogg", "audio/wav", "audio/x-wav"]),
  master: new Set(["audio/wav", "audio/x-wav", "audio/mpeg", "audio/flac", "audio/x-flac"])
};

const extensionFor = (type) => ({
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/aac": "aac", "audio/ogg": "ogg",
  "audio/wav": "wav", "audio/x-wav": "wav", "audio/flac": "flac", "audio/x-flac": "flac"
}[type] || "bin");

export const onRequestOptions = onOptions;

export async function onRequestPut({ request, env, params }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const assets = requireNneAssets(env);
  if (!assets.ok) return assets.response;
  const kind = clean(new URL(request.url).searchParams.get("kind"), 20);
  if (!Object.hasOwn(allowed, kind)) return jsonError("nne_beat_asset_kind_invalid", "Tipo de archivo no válido.", 400);
  const contentType = clean(request.headers.get("Content-Type"), 100).split(";")[0].toLowerCase();
  if (!allowed[kind].has(contentType)) {
    return jsonError("nne_beat_asset_type_invalid", `Formato no permitido para ${kind}.`, 415);
  }
  if (!request.body) return jsonError("nne_beat_asset_required", "Selecciona un archivo.", 400);
  const beat = await env.DB.prepare("SELECT id FROM nne_secure_beats WHERE id = ? LIMIT 1").bind(params.id).first();
  if (!beat?.id) return jsonError("nne_beat_not_found", "Beat no encontrado.", 404);

  const key = `nne/secure-beats/${beat.id}/${kind}.${extensionFor(contentType)}`;
  await env.BOOSTR_ASSETS.put(key, request.body, {
    httpMetadata: { contentType },
    customMetadata: { beatId: beat.id, kind, uploadedBy: auth.user.id }
  });
  const column = `${kind}_object_key`;
  const contentColumn = kind === "artwork" ? null : `${kind}_content_type`;
  if (contentColumn) {
    await env.DB.prepare(`UPDATE nne_secure_beats SET ${column} = ?, ${contentColumn} = ?, updated_at = ? WHERE id = ?`)
      .bind(key, contentType, now(), beat.id).run();
  } else {
    await env.DB.prepare(`UPDATE nne_secure_beats SET ${column} = ?, updated_at = ? WHERE id = ?`)
      .bind(key, now(), beat.id).run();
  }
  await writeNneAudit(env, request, auth.user.id, "beat.asset_uploaded", "nne_beat", beat.id, {
    kind,
    content_type: contentType
  });
  return jsonOk({ id: beat.id, kind, ready: true });
}
