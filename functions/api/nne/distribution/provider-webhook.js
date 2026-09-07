import { clean, jsonError, jsonOk, now, onOptions } from "../../../_lib/nne-api.js";
import { writeDistributionEvent } from "../../../_lib/nne-distribution.js";
import { verifyMetaSignature } from "../../../_lib/nne-messaging.js";

const statusMap = new Map([
  ["accepted", "delivered"], ["delivered", "delivered"], ["live", "live"],
  ["rejected", "changes_requested"], ["takedown_requested", "takedown_requested"], ["taken_down", "taken_down"]
]);

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env }) {
  if (!env.NNE_DISTRIBUTION_PROVIDER_WEBHOOK_SECRET) {
    return jsonError("nne_distribution_webhook_not_configured", "Webhook de distribución no configurado.", 503);
  }
  const rawBody = await request.text();
  const valid = await verifyMetaSignature(rawBody, request.headers.get("X-NNE-Signature") || "", env.NNE_DISTRIBUTION_PROVIDER_WEBHOOK_SECRET);
  if (!valid) return jsonError("nne_distribution_webhook_signature", "Firma inválida.", 401);
  let payload;
  try { payload = JSON.parse(rawBody); } catch { return jsonError("nne_distribution_webhook_json", "Payload JSON inválido.", 400); }

  const providerKey = clean(payload?.provider_key || env.NNE_DISTRIBUTION_PROVIDER, 80);
  const externalEventId = clean(payload?.event_id, 180);
  const eventType = clean(payload?.status || payload?.event_type, 40).toLowerCase();
  const providerReleaseId = clean(payload?.provider_release_id, 180);
  const internalReleaseId = clean(payload?.release_id, 120);
  const nextStatus = statusMap.get(eventType);
  if (!providerKey || !externalEventId || !nextStatus || (!providerReleaseId && !internalReleaseId)) {
    return jsonError("nne_distribution_webhook_payload", "Faltan event_id, provider, release o status soportado.", 400);
  }
  const release = internalReleaseId
    ? await env.DB.prepare("SELECT id,status,provider_key,provider_release_id FROM nne_distribution_releases WHERE id=? LIMIT 1").bind(internalReleaseId).first()
    : await env.DB.prepare("SELECT id,status,provider_key,provider_release_id FROM nne_distribution_releases WHERE provider_release_id=? LIMIT 1").bind(providerReleaseId).first();
  if (!release?.id || release.provider_key !== providerKey) return jsonError("nne_distribution_webhook_release", "Release del proveedor no encontrado.", 404);

  const eventId = `dist_provider_evt_${crypto.randomUUID().replaceAll("-", "")}`;
  const timestamp = now();
  const inserted = await env.DB.prepare(
    `INSERT OR IGNORE INTO nne_distribution_provider_events
      (id,provider_key,external_event_id,release_id,provider_release_id,event_type,payload_json,received_at)
     VALUES (?,?,?,?,?,?,?,?)`
  ).bind(eventId, providerKey, externalEventId, release.id, providerReleaseId || release.provider_release_id || null, eventType, rawBody, timestamp).run();
  if (!Number(inserted.meta?.changes || 0)) return jsonOk({ duplicate: true, event_id: externalEventId });

  const reviewNote = eventType === "rejected" ? clean(payload?.message || payload?.reason, 1200) || "El proveedor rechazó la entrega." : null;
  await env.DB.batch([
    env.DB.prepare("UPDATE nne_distribution_releases SET status=?,provider_release_id=COALESCE(?,provider_release_id),review_note=COALESCE(?,review_note),updated_at=? WHERE id=?")
      .bind(nextStatus, providerReleaseId || null, reviewNote, timestamp, release.id),
    env.DB.prepare(`UPDATE nne_distribution_delivery_jobs SET status=?,last_error=?,updated_at=?
      WHERE id=(SELECT id FROM nne_distribution_delivery_jobs WHERE release_id=? ORDER BY created_at DESC LIMIT 1)`)
      .bind(eventType === "rejected" ? "rejected" : "accepted", reviewNote, timestamp, release.id),
    env.DB.prepare("UPDATE nne_distribution_provider_events SET processed_at=? WHERE id=?").bind(timestamp, eventId)
  ]);
  await writeDistributionEvent(env, release.id, null, `provider.${eventType}`, release.status, nextStatus, {
    provider_key: providerKey, external_event_id: externalEventId, provider_release_id: providerReleaseId || release.provider_release_id || null
  });
  return jsonOk({ processed: true, release_id: release.id, status: nextStatus });
}
