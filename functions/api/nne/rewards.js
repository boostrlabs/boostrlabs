import { jsonOk, requireNneSession } from "../../_lib/nne-api.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;

  const result = await env.DB.prepare(
    `SELECT
       r.id, r.name, r.description, r.icon, r.image_url, r.cost_credits,
       r.minimum_level, r.inventory, r.sort_order,
       CASE
         WHEN r.inventory IS NULL THEN NULL
         ELSE MAX(0, r.inventory - (
           SELECT COUNT(*)
           FROM nne_reward_redemptions x
           WHERE x.reward_id = r.id AND x.status <> 'cancelled'
         ))
       END AS remaining
     FROM nne_rewards r
     WHERE r.status = 'published'
     ORDER BY r.sort_order, r.created_at`
  ).all();

  return jsonOk({
    credits: auth.user.credits,
    level: auth.user.level,
    rewards: (result.results || []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      image_url: row.image_url || null,
      cost_credits: Number(row.cost_credits),
      minimum_level: Number(row.minimum_level),
      remaining: row.remaining == null ? null : Number(row.remaining),
      available:
        auth.user.level >= Number(row.minimum_level) &&
        auth.user.credits >= Number(row.cost_credits) &&
        (row.remaining == null || Number(row.remaining) > 0)
    }))
  });
}
