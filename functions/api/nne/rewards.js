import { jsonOk, requireNneSession } from "../../_lib/nne-api.js";
import { ensureNneSeason001 } from "../../_lib/nne-season-001.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;

  await ensureNneSeason001(env);

  const result = await env.DB.prepare(
    `SELECT
       r.id, r.name, r.description, r.icon, r.image_url, r.cost_credits AS regular_cost_credits,
       CASE WHEN r.sale_cost_credits IS NOT NULL
                  AND (r.sale_starts_at IS NULL OR datetime(r.sale_starts_at) <= datetime('now'))
                  AND (r.sale_ends_at IS NULL OR datetime(r.sale_ends_at) > datetime('now'))
            THEN r.sale_cost_credits ELSE r.cost_credits END AS cost_credits,
       r.sale_cost_credits, r.sale_starts_at, r.sale_ends_at, r.reward_type,
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
    season: { id: "001", name: "ROAD TO WESTDETRO", ends_at: "2026-08-29T04:00:00.000Z" },
    rewards: (result.results || []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      image_url: row.image_url || null,
      cost_credits: Number(row.cost_credits),
      regular_cost_credits: Number(row.regular_cost_credits),
      on_sale: Number(row.cost_credits) < Number(row.regular_cost_credits),
      sale_starts_at: row.sale_starts_at || null,
      sale_ends_at: row.sale_ends_at || null,
      reward_type: row.reward_type,
      minimum_level: Number(row.minimum_level),
      remaining: row.remaining == null ? null : Number(row.remaining),
      available:
        auth.user.level >= Number(row.minimum_level) &&
        auth.user.credits >= Number(row.cost_credits) &&
        (row.remaining == null || Number(row.remaining) > 0)
    }))
  });
}
