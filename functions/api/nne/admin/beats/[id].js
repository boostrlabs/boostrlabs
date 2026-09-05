import {
  clean,
  jsonError,
  jsonOk,
  now,
  onOptions,
  readJson,
  requireNneAdmin,
  writeNneAudit
} from "../../../../_lib/nne-api.js";

export const onRequestOptions = onOptions;

export async function onRequestPatch({ request, env, params }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const status = clean(parsed.payload?.status, 20);
  if (!new Set(["draft", "published", "paused", "archived"]).has(status)) {
    return jsonError("nne_beat_status_invalid", "Estado no válido.", 400);
  }
  if (status === "published") {
    const beat = await env.DB.prepare(
      "SELECT stream_object_key FROM nne_secure_beats WHERE id = ? LIMIT 1"
    ).bind(params.id).first();
    if (!beat?.stream_object_key) {
      return jsonError("nne_beat_stream_required", "Sube el audio de escucha antes de publicar.", 409);
    }
  }
  const timestamp = now();
  const result = await env.DB.prepare(
    "UPDATE nne_secure_beats SET status = ?, updated_at = ? WHERE id = ? AND status <> 'sold'"
  ).bind(status, timestamp, params.id).run();
  if (!result.meta?.changes) return jsonError("nne_beat_not_found", "Beat no encontrado o ya vendido.", 404);
  await writeNneAudit(env, request, auth.user.id, "beat.status_updated", "nne_beat", params.id, { status });
  return jsonOk({ id: params.id, status });
}
