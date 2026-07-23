import { jsonOk, requireNneAdmin } from "../../../_lib/nne-api.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;

  const rows = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS value FROM nne_users WHERE status = 'active'"),
    env.DB.prepare("SELECT COUNT(*) AS value FROM nne_quest_attempts WHERE status = 'pending'"),
    env.DB.prepare("SELECT COUNT(*) AS value FROM nne_reward_redemptions WHERE status IN ('requested', 'in_progress')"),
    env.DB.prepare("SELECT COALESCE(SUM(amount), 0) AS value FROM nne_credit_transactions"),
    env.DB.prepare(
      `SELECT COUNT(*) AS value
       FROM nne_quest_attempts
       WHERE status IN ('approved', 'completed')
         AND completed_at >= datetime('now', '-7 days')`
    )
  ]);

  return jsonOk({
    metrics: {
      active_users: Number(rows[0]?.results?.[0]?.value || 0),
      pending_evidence: Number(rows[1]?.results?.[0]?.value || 0),
      open_redemptions: Number(rows[2]?.results?.[0]?.value || 0),
      credits_in_circulation: Number(rows[3]?.results?.[0]?.value || 0),
      quests_completed_7d: Number(rows[4]?.results?.[0]?.value || 0)
    }
  });
}
