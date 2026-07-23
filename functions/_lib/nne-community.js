import { clean, now } from "./nne-api.js";

export function nnePeriodKey(cadence, date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  if (cadence === "daily") return day;
  if (cadence === "weekly") {
    const utcDate = new Date(`${day}T00:00:00.000Z`);
    const weekday = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() - weekday + 1);
    return `week:${utcDate.toISOString().slice(0, 10)}`;
  }
  return "once";
}

export function initials(name) {
  return clean(name, 100)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "NN";
}

export function questStatusForUser(quest, attempt, userLevel) {
  if (Number(userLevel || 1) < Number(quest.minimum_level || 1)) return "locked";
  if (!attempt) return "open";
  if (["approved", "completed"].includes(attempt.status)) return "completed";
  if (attempt.status === "pending") return "pending";
  return "open";
}

export async function getNneQuest(env, questId) {
  return env.DB.prepare(
    `SELECT q.*, s.title AS song_title, s.artist_name, s.listen_url, s.artwork_url
     FROM nne_quests q
     LEFT JOIN nne_songs s ON s.id = q.song_id
     WHERE q.id = ?
       AND q.status = 'published'
       AND (q.starts_at IS NULL OR q.starts_at <= ?)
       AND (q.ends_at IS NULL OR q.ends_at > ?)
     LIMIT 1`
  )
    .bind(questId, now(), now())
    .first();
}

export async function completeNneQuest(env, {
  attemptId,
  userId,
  quest,
  score = null,
  actorUserId = null,
  completionStatus = "completed",
  leadingStatements = []
}) {
  const timestamp = now();
  const today = timestamp.slice(0, 10);
  const transactionId = crypto.randomUUID();
  const feedId = crypto.randomUUID();

  await env.DB.batch([
    ...leadingStatements,
    env.DB.prepare(
      `UPDATE nne_quest_attempts
       SET status = ?, score = ?, completed_at = ?, reviewed_at = ?,
           reviewed_by = ?, updated_at = ?, rejection_reason = NULL
       WHERE id = ? AND user_id = ? AND status NOT IN ('approved', 'completed')`
    ).bind(
      completionStatus,
      score,
      timestamp,
      actorUserId ? timestamp : null,
      actorUserId,
      timestamp,
      attemptId,
      userId
    ),
    env.DB.prepare(
      `INSERT INTO nne_credit_transactions (
        id, user_id, amount, kind, source_type, source_id, description, actor_user_id, created_at
      ) VALUES (?, ?, ?, 'quest_reward', 'quest_attempt', ?, ?, ?, ?)`
    ).bind(
      transactionId,
      userId,
      Number(quest.reward_credits),
      attemptId,
      `Quest completada: ${quest.title}`,
      actorUserId,
      timestamp
    ),
    env.DB.prepare(
      `UPDATE nne_profiles
       SET xp = xp + ?,
           level = 1 + CAST((xp + ?) / 1000 AS INTEGER),
           completed_quest_count = completed_quest_count + 1,
           streak_days = CASE
             WHEN last_activity_date = ? THEN streak_days
             WHEN last_activity_date = date(?, '-1 day') THEN streak_days + 1
             ELSE 1
           END,
           last_activity_date = ?,
           nne_score = MIN(100, nne_score + 1),
           updated_at = ?
       WHERE user_id = ?`
    ).bind(
      Number(quest.reward_xp || quest.reward_credits || 0),
      Number(quest.reward_xp || quest.reward_credits || 0),
      today,
      today,
      today,
      timestamp,
      userId
    ),
    env.DB.prepare(
      `INSERT INTO nne_feed_events (
        id, user_id, event_type, message, visibility, source_type, source_id, created_at
      )
      SELECT ?, u.id, 'quest_completed', '@' || u.username || ' completó ' || ? || '.',
             'public', 'quest_attempt', ?, ?
      FROM nne_users u
      WHERE u.id = ?`
    ).bind(feedId, quest.title, attemptId, timestamp, userId)
  ]);
}

export function parseOptions(value) {
  try {
    const options = JSON.parse(value || "[]");
    if (!Array.isArray(options)) return [];
    return options
      .map((option) => ({
        id: clean(option?.id, 80),
        text: clean(option?.text, 500)
      }))
      .filter((option) => option.id && option.text);
  } catch {
    return [];
  }
}

export function shuffle(items) {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [output[index], output[randomIndex]] = [output[randomIndex], output[index]];
  }
  return output;
}
