import { clean, jsonError, jsonOk, now, onOptions, readJson, requireNneAdmin, writeNneAudit } from "../../../../../_lib/nne-api.js";
import { buildDistributionManifest, loadDistributionRelease, writeDistributionEvent } from "../../../../../_lib/nne-distribution.js";
import { deliverDistributionPackage } from "../../../../../_lib/nne-distribution-provider.js";
import { requireNneAssets } from "../../../../../_lib/nne-secure-media.js";

const actions = new Set(["approve", "request_changes", "package", "deliver", "mark_live_demo"]);

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env, params }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const action = clean(parsed.payload?.action, 40);
  const note = clean(parsed.payload?.note, 1200);
  if (!actions.has(action)) return jsonError("nne_distribution_review_action", "Acción de revisión no válida.", 400);
  const release = await loadDistributionRelease(env, params.id);
  if (!release) return jsonError("nne_distribution_release_not_found", "Lanzamiento no encontrado.", 404);
  const timestamp = now();
  let nextStatus = release.status;
  let metadata = { note: note || null };

  if (action === "request_changes") {
    if (!["in_review", "approved"].includes(release.status)) return jsonError("nne_distribution_review_status", "Este lanzamiento no está disponible para correcciones.", 409);
    if (!note) return jsonError("nne_distribution_review_note", "Escribe las correcciones solicitadas.", 400);
    nextStatus = "changes_requested";
    await env.DB.prepare(
      "UPDATE nne_distribution_releases SET status=?,review_note=?,reviewed_at=?,reviewed_by=?,updated_at=? WHERE id=?"
    ).bind(nextStatus, note, timestamp, auth.user.id, timestamp, release.id).run();
  }

  if (action === "approve") {
    if (release.status !== "in_review") return jsonError("nne_distribution_review_status", "El lanzamiento debe estar en revisión.", 409);
    if (!release.readiness.ready) return jsonError("nne_distribution_release_incomplete", "El lanzamiento ya no cumple todos los controles.", 422, { readiness: release.readiness });
    nextStatus = "approved";
    await env.DB.prepare(
      "UPDATE nne_distribution_releases SET status=?,review_note=?,reviewed_at=?,reviewed_by=?,updated_at=? WHERE id=?"
    ).bind(nextStatus, note || null, timestamp, auth.user.id, timestamp, release.id).run();
  }

  if (action === "package") {
    if (release.status !== "approved") return jsonError("nne_distribution_package_status", "Primero aprueba el lanzamiento.", 409);
    if (!release.readiness.ready) return jsonError("nne_distribution_release_incomplete", "El paquete no puede generarse con bloqueos.", 422, { readiness: release.readiness });
    const assets = requireNneAssets(env);
    if (!assets.ok) return assets.response;
    const manifest = buildDistributionManifest(release);
    const jobId = `dist_job_${crypto.randomUUID().replaceAll("-", "")}`;
    const idempotencyKey = `release:${release.id}:v1:${release.updated_at}`;
    const objectKey = `nne/distribution/releases/${release.id}/packages/${jobId}.json`;
    const encoded = JSON.stringify(manifest, null, 2);
    await env.BOOSTR_ASSETS.put(objectKey, encoded, {
      httpMetadata: { contentType: "application/json; charset=utf-8" },
      customMetadata: { releaseId: release.id, provider: release.provider_key, generatedBy: auth.user.id }
    });
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO nne_distribution_delivery_jobs (
          id,release_id,provider_key,idempotency_key,status,package_object_key,payload_json,attempt_count,created_by,created_at,updated_at
        ) VALUES (?,?,?,?, 'ready',?,?,0,?,?,?)`
      ).bind(jobId, release.id, release.provider_key, idempotencyKey, objectKey, encoded, auth.user.id, timestamp, timestamp),
      env.DB.prepare("UPDATE nne_distribution_releases SET status='packaged',updated_at=? WHERE id=?").bind(timestamp, release.id)
    ]);
    nextStatus = "packaged";
    metadata = { ...metadata, job_id: jobId, provider: release.provider_key, package_object_key: objectKey };
  }

  if (action === "deliver") {
    if (release.status !== "packaged") return jsonError("nne_distribution_delivery_status", "Genera el paquete antes de entregarlo al proveedor.", 409);
    const job = await env.DB.prepare(
      "SELECT id FROM nne_distribution_delivery_jobs WHERE release_id=? AND status='ready' ORDER BY created_at DESC LIMIT 1"
    ).bind(release.id).first();
    if (!job?.id) return jsonError("nne_distribution_delivery_job_missing", "No hay un paquete listo.", 409);
    const fullJob = await env.DB.prepare(
      "SELECT id,idempotency_key,payload_json FROM nne_distribution_delivery_jobs WHERE id=? LIMIT 1"
    ).bind(job.id).first();
    let providerResult;
    try {
      providerResult = await deliverDistributionPackage(env, {
        release,
        manifest: JSON.parse(fullJob.payload_json),
        idempotencyKey: fullJob.idempotency_key
      });
    } catch (error) {
      await env.DB.prepare(
        "UPDATE nne_distribution_delivery_jobs SET status='failed',attempt_count=attempt_count+1,last_error=?,updated_at=? WHERE id=?"
      ).bind(clean(error?.message, 500), timestamp, job.id).run();
      return jsonError(error?.code || "nne_distribution_provider_failed", "El proveedor no aceptó la entrega. El paquete sigue intacto para reintentar.", 502);
    }
    const providerReleaseId = providerResult.provider_release_id;
    const response = JSON.stringify(providerResult);
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE nne_distribution_delivery_jobs SET status='accepted',attempt_count=attempt_count+1,response_json=?,accepted_at=?,updated_at=? WHERE id=?"
      ).bind(response, timestamp, timestamp, job.id),
      env.DB.prepare(
        "UPDATE nne_distribution_releases SET status=?,provider_release_id=?,updated_at=? WHERE id=?"
      ).bind(providerResult.environment === "sandbox" ? "delivered_demo" : "delivered", providerReleaseId, timestamp, release.id)
    ]);
    nextStatus = providerResult.environment === "sandbox" ? "delivered_demo" : "delivered";
    metadata = { ...metadata, job_id: job.id, provider_release_id: providerReleaseId, environment: providerResult.environment };
  }

  if (action === "mark_live_demo") {
    if (release.status !== "delivered_demo") return jsonError("nne_distribution_live_status", "La entrega sandbox debe ser aceptada primero.", 409);
    nextStatus = "live_demo";
    await env.DB.prepare("UPDATE nne_distribution_releases SET status='live_demo',updated_at=? WHERE id=?")
      .bind(timestamp, release.id).run();
    metadata = { ...metadata, environment: "sandbox", simulated: true };
  }

  await writeDistributionEvent(env, release.id, auth.user.id, `release.${action}`, release.status, nextStatus, metadata);
  await writeNneAudit(env, request, auth.user.id, `distribution.${action}`, "nne_distribution_release", release.id, metadata);
  return jsonOk({ release: await loadDistributionRelease(env, release.id) });
}
