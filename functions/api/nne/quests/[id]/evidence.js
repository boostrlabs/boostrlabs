import {
  clean,
  jsonError,
  jsonOk,
  now,
  onOptions,
  requireNneSession,
  writeNneAudit
} from "../../../../_lib/nne-api.js";
import { getNneQuest, nnePeriodKey } from "../../../../_lib/nne-community.js";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 10 * 1024 * 1024;

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env, params }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  if (!env.BOOSTR_ASSETS) {
    return jsonError("nne_storage_unavailable", "El almacenamiento de evidencias no está disponible.", 503);
  }

  const quest = await getNneQuest(env, clean(params.id, 120));
  if (!quest?.id) return jsonError("nne_quest_not_found", "Esta quest no está disponible.", 404);
  if (quest.verification_method !== "manual") {
    return jsonError("nne_evidence_not_required", "Esta quest no utiliza evidencia visual.", 409);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return jsonError("nne_invalid_evidence_form", "No pudimos leer la evidencia.", 400);
  }
  const file = form.get("evidence");
  const note = clean(form.get("note"), 1000);
  if (!file || typeof file.arrayBuffer !== "function") {
    return jsonError("nne_evidence_required", "Selecciona una imagen como evidencia.", 400, {
      fields: ["evidence"]
    });
  }
  if (!allowedTypes.has(file.type)) {
    return jsonError("nne_evidence_type", "Usa una imagen JPG, PNG o WEBP.", 415);
  }
  if (!file.size || file.size > maxBytes) {
    return jsonError("nne_evidence_size", "La evidencia debe pesar menos de 10 MB.", 413);
  }

  const periodKey = nnePeriodKey(quest.cadence);
  const attempt = await env.DB.prepare(
    `SELECT id, status, evidence_r2_key
     FROM nne_quest_attempts
     WHERE quest_id = ? AND user_id = ? AND period_key = ?
     LIMIT 1`
  )
    .bind(quest.id, auth.user.id, periodKey)
    .first();
  if (!attempt?.id) {
    return jsonError("nne_attempt_required", "Comienza la quest antes de subir la evidencia.", 409);
  }
  if (["approved", "completed"].includes(attempt.status)) {
    return jsonError("nne_quest_already_completed", "Esta quest ya fue completada.", 409);
  }
  if (attempt.status === "pending") {
    return jsonError("nne_evidence_already_pending", "Tu evidencia ya está en revisión.", 409);
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const objectKey = `nne/evidence/${auth.user.id}/${attempt.id}/${crypto.randomUUID()}.${extension}`;
  const bytes = await file.arrayBuffer();
  await env.BOOSTR_ASSETS.put(objectKey, bytes, {
    httpMetadata: { contentType: file.type },
    customMetadata: {
      nneUserId: auth.user.id,
      nneQuestId: quest.id,
      nneAttemptId: attempt.id
    }
  });

  const timestamp = now();
  try {
    await env.DB.prepare(
      `UPDATE nne_quest_attempts
       SET status = 'pending', evidence_r2_key = ?, evidence_content_type = ?,
           evidence_original_name = ?, evidence_note = ?, submitted_at = ?, updated_at = ?,
           rejection_reason = NULL
       WHERE id = ? AND user_id = ?`
    )
      .bind(
        objectKey,
        file.type,
        clean(file.name, 240) || `evidence.${extension}`,
        note || null,
        timestamp,
        timestamp,
        attempt.id,
        auth.user.id
      )
      .run();
  } catch (error) {
    await env.BOOSTR_ASSETS.delete(objectKey);
    throw error;
  }

  if (attempt.evidence_r2_key && attempt.evidence_r2_key.startsWith("nne/")) {
    await env.BOOSTR_ASSETS.delete(attempt.evidence_r2_key);
  }
  await writeNneAudit(env, request, auth.user.id, "quest.evidence_submitted", "nne_quest_attempt", attempt.id, {
    quest_id: quest.id,
    object_key: objectKey
  });

  return jsonOk({
    attempt: {
      id: attempt.id,
      status: "pending",
      submitted_at: timestamp
    }
  });
}
