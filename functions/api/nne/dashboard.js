import { initials, nnePeriodKey, questStatusForUser } from "../../_lib/nne-community.js";
import { jsonOk, requireNneSession } from "../../_lib/nne-api.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;

  const [questRows, feedRows, leaderRows, referral] = await Promise.all([
    env.DB.prepare(
      `SELECT id, type, platform, title, description, icon, reward_credits,
              reward_xp, cadence, verification_method, minimum_level, sort_order
       FROM nne_quests
       WHERE status = 'published'
         AND (starts_at IS NULL OR starts_at <= ?)
         AND (ends_at IS NULL OR ends_at > ?)
       ORDER BY sort_order
       LIMIT 6`
    ).bind(new Date().toISOString(), new Date().toISOString()).all(),
    env.DB.prepare(
      `SELECT id, event_type, message, created_at
       FROM nne_feed_events
       WHERE visibility = 'public'
       ORDER BY created_at DESC
       LIMIT 8`
    ).all(),
    env.DB.prepare(
      `SELECT u.id, u.username, u.display_name, p.level,
              COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) AS score
       FROM nne_users u
       JOIN nne_profiles p ON p.user_id = u.id
       LEFT JOIN nne_credit_transactions t ON t.user_id = u.id
       WHERE u.status = 'active'
       GROUP BY u.id
       ORDER BY score DESC, p.completed_quest_count DESC
       LIMIT 10`
    ).all(),
    env.DB.prepare(
      `SELECT referral_code
       FROM nne_referrals
       WHERE referrer_user_id = ? AND referred_user_id IS NULL AND status = 'invited'
       ORDER BY created_at DESC LIMIT 1`
    ).bind(auth.user.id).first()
  ]);

  const quests = [];
  for (const quest of questRows.results || []) {
    const attempt = await env.DB.prepare(
      `SELECT id, status, unlock_at, score
       FROM nne_quest_attempts
       WHERE quest_id = ? AND user_id = ? AND period_key = ?
       LIMIT 1`
    ).bind(quest.id, auth.user.id, nnePeriodKey(quest.cadence)).first();
    quests.push({
      id: quest.id,
      type: quest.type,
      platform: quest.platform,
      title: quest.title,
      description: quest.description,
      icon: quest.icon,
      reward_credits: Number(quest.reward_credits),
      verification_method: quest.verification_method,
      status: questStatusForUser(quest, attempt, auth.user.level),
      attempt: attempt || null
    });
  }

  const leaderboard = (leaderRows.results || []).map((row, index) => ({
    rank: index + 1,
    user_id: row.id,
    username: row.username,
    name: row.display_name,
    initials: initials(row.display_name),
    level: Number(row.level),
    score: Number(row.score)
  }));

  return jsonOk({
    user: {
      ...auth.user,
      initials: initials(auth.user.name),
      xp_to_next_level: 1000,
      xp_in_level: auth.user.xp % 1000
    },
    quests,
    feed: feedRows.results || [],
    leaderboard,
    current_rank: leaderboard.find((entry) => entry.user_id === auth.user.id)?.rank || null,
    referral_code: referral?.referral_code || null
  });
}
