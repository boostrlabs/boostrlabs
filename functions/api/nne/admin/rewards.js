import {
  clean,
  jsonError,
  jsonOk,
  now,
  onOptions,
  readJson,
  requireNneAdmin,
  writeNneAudit
} from "../../../_lib/nne-api.js";

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const result = await env.DB.prepare(
    `SELECT r.*,
            (SELECT COUNT(*) FROM nne_reward_redemptions x WHERE x.reward_id = r.id AND x.status <> 'cancelled') AS redeemed
     FROM nne_rewards r
     ORDER BY r.sort_order, r.created_at DESC`
  ).all();
  return jsonOk({ rewards: result.results || [] });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};
  const name = clean(payload.name, 160);
  const description = clean(payload.description, 1000);
  const costCredits = Math.floor(Number(payload.cost_credits || 0));
  if (!name || !description || costCredits < 1) {
    return jsonError("nne_reward_fields_invalid", "Nombre, descripción y costo son requeridos.", 400);
  }

  const id = `reward_${crypto.randomUUID().replaceAll("-", "")}`;
  const timestamp = now();
  await env.DB.prepare(
    `INSERT INTO nne_rewards (
      id, name, description, icon, image_url, cost_credits, minimum_level,
      inventory, status, fulfillment_notes, sort_order, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      name,
      description,
      clean(payload.icon, 8) || "◆",
      clean(payload.image_url, 1000) || null,
      costCredits,
      Math.max(1, Math.floor(Number(payload.minimum_level || 1))),
      payload.inventory == null || payload.inventory === ""
        ? null
        : Math.max(0, Math.floor(Number(payload.inventory))),
      ["draft", "published", "paused", "archived"].includes(payload.status) ? payload.status : "draft",
      clean(payload.fulfillment_notes, 2000) || null,
      Math.floor(Number(payload.sort_order || 0)),
      auth.user.id,
      timestamp,
      timestamp
    )
    .run();
  await writeNneAudit(env, request, auth.user.id, "reward.created", "nne_reward", id, { name });
  return jsonOk({ reward: { id, name } }, 201);
}
