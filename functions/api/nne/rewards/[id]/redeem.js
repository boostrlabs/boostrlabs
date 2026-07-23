import {
  clean,
  jsonError,
  jsonOk,
  now,
  onOptions,
  requireNneSession,
  writeNneAudit
} from "../../../../_lib/nne-api.js";

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env, params }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;

  const reward = await env.DB.prepare(
    `SELECT id, name, cost_credits, minimum_level, status
     FROM nne_rewards
     WHERE id = ? AND status = 'published'
     LIMIT 1`
  )
    .bind(clean(params.id, 120))
    .first();
  if (!reward?.id) return jsonError("nne_reward_not_found", "Este reward no está disponible.", 404);
  if (auth.user.level < Number(reward.minimum_level)) {
    return jsonError("nne_reward_level_required", `Necesitas nivel ${reward.minimum_level} para canjearlo.`, 403);
  }

  const redemptionId = crypto.randomUUID();
  const timestamp = now();
  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO nne_reward_redemptions (
          id, reward_id, user_id, cost_credits, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'requested', ?, ?)`
      ).bind(
        redemptionId,
        reward.id,
        auth.user.id,
        Number(reward.cost_credits),
        timestamp,
        timestamp
      ),
      env.DB.prepare(
        `INSERT INTO nne_credit_transactions (
          id, user_id, amount, kind, source_type, source_id, description, actor_user_id, created_at
        ) VALUES (?, ?, ?, 'reward_redemption', 'reward_redemption', ?, ?, NULL, ?)`
      ).bind(
        crypto.randomUUID(),
        auth.user.id,
        -Number(reward.cost_credits),
        redemptionId,
        `Canje: ${reward.name}`,
        timestamp
      ),
      env.DB.prepare(
        `INSERT INTO nne_feed_events (
          id, user_id, event_type, message, visibility, source_type, source_id, created_at
        )
        SELECT ?, id, 'reward_redeemed', '@' || username || ' canjeó ' || ? || '.',
               'public', 'reward_redemption', ?, ?
        FROM nne_users WHERE id = ?`
      ).bind(crypto.randomUUID(), reward.name, redemptionId, timestamp, auth.user.id)
    ]);
  } catch (error) {
    const message = String(error?.message || error);
    if (message.includes("insufficient_credits")) {
      return jsonError("nne_insufficient_credits", "No tienes créditos suficientes para este reward.", 409);
    }
    if (message.includes("reward_out_of_stock")) {
      return jsonError("nne_reward_out_of_stock", "Este reward acaba de agotarse.", 409);
    }
    throw error;
  }

  await writeNneAudit(env, request, auth.user.id, "reward.redeemed", "nne_reward_redemption", redemptionId, {
    reward_id: reward.id,
    cost_credits: Number(reward.cost_credits)
  });
  return jsonOk(
    {
      redemption: {
        id: redemptionId,
        reward_id: reward.id,
        reward_name: reward.name,
        cost_credits: Number(reward.cost_credits),
        status: "requested",
        created_at: timestamp
      },
      credits: auth.user.credits - Number(reward.cost_credits)
    },
    201
  );
}
