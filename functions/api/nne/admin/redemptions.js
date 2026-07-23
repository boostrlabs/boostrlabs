import { jsonOk, requireNneAdmin } from "../../../_lib/nne-api.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const result = await env.DB.prepare(
    `SELECT x.*, r.name AS reward_name, u.username, u.display_name, u.email
     FROM nne_reward_redemptions x
     JOIN nne_rewards r ON r.id = x.reward_id
     JOIN nne_users u ON u.id = x.user_id
     ORDER BY
       CASE x.status WHEN 'requested' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
       x.created_at DESC
     LIMIT 200`
  ).all();
  return jsonOk({ redemptions: result.results || [] });
}
