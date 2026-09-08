import { clean, jsonError, jsonOk, now, onOptions, readJson, requireNneAdmin, writeNneAudit } from "../../../_lib/nne-api.js";
import { requireDistributionAccess } from "../../../_lib/nne-distribution.js";

export const onRequestOptions = onOptions;

async function trackContext(env, trackId) {
  return env.DB.prepare(
    `SELECT track.id,track.release_id,track.title,release.stores_json
     FROM nne_distribution_tracks track JOIN nne_distribution_releases release ON release.id=track.release_id
     WHERE track.id=? LIMIT 1`
  ).bind(trackId).first();
}

export async function onRequestGet({ request, env }) {
  const releaseId = clean(new URL(request.url).searchParams.get("release_id"), 120);
  const auth = await requireDistributionAccess(request, env, releaseId);
  if (!auth.ok) return auth.response;
  const rows = await env.DB.prepare(
    `SELECT request.*,track.title AS track_title
     FROM nne_distribution_tiktok_clip_requests request
     JOIN nne_distribution_tracks track ON track.id=request.track_id
     WHERE track.release_id=? ORDER BY request.created_at DESC`
  ).bind(releaseId).all();
  return jsonOk({ requests: rows.results || [], policy: "Solo se entrega cuando el partner o TikTok apruebe clips oficiales adicionales." });
}

export async function onRequestPost({ request, env }) {
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const action = clean(parsed.payload?.action || "request", 30);
  if (action === "review") return reviewRequest(request, env, parsed.payload);
  const trackId = clean(parsed.payload?.track_id, 120);
  const track = await trackContext(env, trackId);
  if (!track?.release_id) return jsonError("nne_distribution_track_not_found", "Track no encontrado.", 404);
  const auth = await requireDistributionAccess(request, env, track.release_id);
  if (!auth.ok) return auth.response;
  let stores = [];
  try { stores = JSON.parse(track.stores_json || "[]"); } catch { stores = []; }
  if (!stores.includes("tiktok")) return jsonError("nne_distribution_tiktok_store_required", "Activa TikTok en las plataformas del lanzamiento.", 409);
  const startSeconds = Math.max(0, Math.trunc(Number(parsed.payload?.start_seconds || 0)));
  const durationSeconds = Math.trunc(Number(parsed.payload?.duration_seconds || 60));
  const label = clean(parsed.payload?.label, 100) || `Clip desde ${startSeconds}s`;
  if (!Number.isSafeInteger(startSeconds) || !Number.isSafeInteger(durationSeconds) || durationSeconds < 5 || durationSeconds > 60) {
    return jsonError("nne_distribution_tiktok_clip_invalid", "El clip debe durar entre 5 y 60 segundos.", 400);
  }
  const active = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM nne_distribution_tiktok_clip_requests WHERE track_id=? AND status IN ('requested','provider_review','approved','delivered')"
  ).bind(trackId).first();
  if (Number(active?.count || 0) >= 3) return jsonError("nne_distribution_tiktok_clip_limit", "Este piloto admite máximo tres solicitudes activas por track.", 409);
  const id = `dist_ttclip_${crypto.randomUUID().replaceAll("-", "")}`;
  const timestamp = now();
  await env.DB.prepare(
    `INSERT INTO nne_distribution_tiktok_clip_requests
      (id,track_id,start_seconds,duration_seconds,label,status,created_by,created_at,updated_at)
     VALUES (?,?,?,?,?,'requested',?,?,?)`
  ).bind(id, trackId, startSeconds, durationSeconds, label, auth.user.id, timestamp, timestamp).run();
  await writeNneAudit(env, request, auth.user.id, "distribution.tiktok_clip_requested", "nne_distribution_tiktok_clip_request", id,
    { track_id: trackId, release_id: track.release_id, start_seconds: startSeconds, duration_seconds: durationSeconds });
  return jsonOk({ request_id: id, status: "requested" }, 201);
}

async function reviewRequest(request, env, payload) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const requestId = clean(payload?.request_id, 120);
  const status = clean(payload?.status, 30);
  const reference = clean(payload?.provider_reference, 240) || null;
  if (!requestId || !["provider_review", "approved", "rejected", "delivered"].includes(status)) {
    return jsonError("nne_distribution_tiktok_review_invalid", "Estado Multi-Clip no válido.", 400);
  }
  if (status === "delivered" && !reference) return jsonError("nne_distribution_tiktok_reference_required", "Agrega la referencia entregada por el partner.", 400);
  const result = await env.DB.prepare("UPDATE nne_distribution_tiktok_clip_requests SET status=?,provider_reference=?,updated_at=? WHERE id=?")
    .bind(status, reference, now(), requestId).run();
  if (!result.meta?.changes) return jsonError("nne_distribution_tiktok_request_not_found", "Solicitud no encontrada.", 404);
  await writeNneAudit(env, request, auth.user.id, `distribution.tiktok_clip_${status}`, "nne_distribution_tiktok_clip_request", requestId, { provider_reference: reference });
  return jsonOk({ request_id: requestId, status });
}
