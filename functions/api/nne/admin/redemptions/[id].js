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

const statuses = new Set(["requested", "in_progress", "fulfilled"]);
export const onRequestOptions = onOptions;

export async function onRequestPatch({ request, env, params }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const status = clean(parsed.payload?.status, 30);
  if (!statuses.has(status)) return jsonError("nne_redemption_status_invalid", "Estado inválido.", 400);

  const id = clean(params.id, 120);
  const existing = await env.DB.prepare(
    "SELECT id, status FROM nne_reward_redemptions WHERE id = ? LIMIT 1"
  ).bind(id).first();
  if (!existing?.id) return jsonError("nne_redemption_not_found", "Canje no encontrado.", 404);
  if (existing.status === "cancelled") {
    return jsonError("nne_redemption_cancelled", "Un canje cancelado no puede reabrirse.", 409);
  }

  const timestamp = now();
  await env.DB.prepare(
    `UPDATE nne_reward_redemptions
     SET status = ?, fulfillment_note = ?, handled_by = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(status, clean(parsed.payload?.fulfillment_note, 2000) || null, auth.user.id, timestamp, id)
    .run();
  await writeNneAudit(env, request, auth.user.id, "redemption.status_changed", "nne_reward_redemption", id, {
    from: existing.status,
    to: status
  });
  return jsonOk({ redemption: { id, status, updated_at: timestamp } });
}
