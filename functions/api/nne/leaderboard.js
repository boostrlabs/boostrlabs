import { initials } from "../../_lib/nne-community.js";
import { jsonOk, requireNneSession } from "../../_lib/nne-api.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;

  const result = await env.DB.prepare(
    `SELECT
       u.id, u.username, u.display_name, u.avatar_url,
       p.level, p.completed_quest_count,
       COALESCE(SUM(t.amount), 0) AS credits_earned
     FROM nne_users u
     JOIN nne_profiles p ON p.user_id = u.id
     LEFT JOIN nne_credit_transactions t
       ON t.user_id = u.id AND t.amount > 0
     WHERE u.status = 'active'
     GROUP BY u.id
     ORDER BY credits_earned DESC, p.completed_quest_count DESC, u.created_at ASC
     LIMIT 50`
  ).all();

  const entries = (result.results || []).map((row, index) => ({
    rank: index + 1,
    user_id: row.id,
    username: row.username,
    handle: `@${row.username}`,
    name: row.display_name,
    initials: initials(row.display_name),
    avatar_url: row.avatar_url || null,
    level: Number(row.level),
    completed_quests: Number(row.completed_quest_count),
    score: Number(row.credits_earned)
  }));

  const currentUser = entries.find((entry) => entry.user_id === auth.user.id) || null;
  return jsonOk({ entries, current_user: currentUser });
}
