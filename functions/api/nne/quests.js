import { jsonOk, requireNneSession } from "../../_lib/nne-api.js";
import { nnePeriodKey, questStatusForUser } from "../../_lib/nne-community.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;

  const result = await env.DB.prepare(
    `SELECT
       q.id, q.type, q.platform, q.title, q.description, q.icon,
       q.reward_credits, q.reward_xp, q.cadence, q.verification_method,
       q.minimum_listen_seconds, q.pass_percentage, q.minimum_level,
       q.song_id, q.sort_order, s.title AS song_title, s.artist_name,
       s.listen_url, s.artwork_url
     FROM nne_quests q
     LEFT JOIN nne_songs s ON s.id = q.song_id
     WHERE q.status = 'published'
       AND (q.starts_at IS NULL OR q.starts_at <= ?)
       AND (q.ends_at IS NULL OR q.ends_at > ?)
     ORDER BY q.sort_order, q.created_at`
  )
    .bind(new Date().toISOString(), new Date().toISOString())
    .all();

  const quests = [];
  for (const row of result.results || []) {
    const periodKey = nnePeriodKey(row.cadence);
    const attempt = await env.DB.prepare(
      `SELECT id, status, unlock_at, score, submitted_at, rejection_reason
       FROM nne_quest_attempts
       WHERE quest_id = ? AND user_id = ? AND period_key = ?
       LIMIT 1`
    )
      .bind(row.id, auth.user.id, periodKey)
      .first();

    quests.push({
      id: row.id,
      type: row.type,
      platform: row.platform,
      title: row.title,
      description: row.description,
      icon: row.icon,
      reward_credits: Number(row.reward_credits),
      reward_xp: Number(row.reward_xp),
      cadence: row.cadence,
      verification_method: row.verification_method,
      minimum_listen_seconds: Number(row.minimum_listen_seconds || 0),
      pass_percentage: Number(row.pass_percentage || 75),
      minimum_level: Number(row.minimum_level || 1),
      status: questStatusForUser(row, attempt, auth.user.level),
      attempt: attempt
        ? {
            id: attempt.id,
            status: attempt.status,
            unlock_at: attempt.unlock_at || null,
            score: attempt.score == null ? null : Number(attempt.score),
            submitted_at: attempt.submitted_at || null,
            rejection_reason: attempt.rejection_reason || null
          }
        : null,
      song: row.song_id
        ? {
            id: row.song_id,
            title: row.song_title,
            artist_name: row.artist_name,
            listen_url: row.listen_url,
            artwork_url: row.artwork_url || null
          }
        : null
    });
  }

  return jsonOk({ quests });
}
