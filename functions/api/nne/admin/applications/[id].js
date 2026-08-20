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
import { activateNneApplication } from "../../../../_lib/nne-access.js";

export const onRequestOptions = onOptions;

export async function onRequestPatch({ request, env, params }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const action = clean(parsed.payload?.action, 20);
  const reviewNote = clean(parsed.payload?.review_note, 600);
  if (!['approve', 'reject'].includes(action)) {
    return jsonError('nne_application_action_invalid', 'Elige aprobar o rechazar la solicitud.', 400);
  }

  const application = await env.DB.prepare(
    `SELECT * FROM nne_access_applications WHERE id = ? LIMIT 1`
  ).bind(clean(params.id, 100)).first();
  if (!application?.id) return jsonError('nne_application_not_found', 'Solicitud no encontrada.', 404);
  if (application.status !== 'pending') {
    return jsonError('nne_application_already_reviewed', 'Esta solicitud ya fue revisada.', 409);
  }

  const timestamp = now();
  if (action === 'reject') {
    await env.DB.prepare(
      `UPDATE nne_access_applications
       SET status = 'rejected', review_note = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
       WHERE id = ? AND status = 'pending'`
    ).bind(reviewNote || null, auth.user.id, timestamp, timestamp, application.id).run();
    await writeNneAudit(env, request, auth.user.id, 'access.application_rejected', 'nne_access_application', application.id, { review_note: reviewNote || null });
    return jsonOk({ application: { id: application.id, status: 'rejected' } });
  }

  if (application.email_verification_status === "pending") {
    return jsonError(
      "nne_application_email_unverified",
      "La persona todavía no verificó su correo.",
      409
    );
  }

  let activated;
  try {
    activated = await activateNneApplication(env, application, {
      role: "member",
      reviewerId: auth.user.id,
      reviewNote,
      timestamp
    });
  } catch (error) {
    if (error?.code === "nne_application_identity_taken") {
      return jsonError(error.code, error.message, 409);
    }
    throw error;
  }
  await writeNneAudit(env, request, auth.user.id, 'access.application_approved', 'nne_access_application', application.id, {
    approved_user_id: activated.userId,
    referral_applied: activated.referralApplied,
    promo_code: activated.promoCode
  });
  return jsonOk({ application: { id: application.id, status: 'approved', approved_user_id: activated.userId } });
}
