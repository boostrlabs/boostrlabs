import { now, randomHex, sha256 } from "./nne-api.js";

const roundXp = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

function entriesFor(campaign, eligibleXp) {
  const threshold = Number(campaign.xp_per_entry || 10);
  const maximum = Number(campaign.max_entries_per_user || 3);
  return Math.min(maximum, Math.floor((Number(eligibleXp || 0) + 1e-9) / threshold));
}

export async function getNneRaffleEligibility(env, campaign) {
  const result = await env.DB.prepare(
    `WITH daily_work AS (
       SELECT
         a.user_id,
         date(a.completed_at) AS activity_day,
         CASE
           WHEN SUM(CAST(q.reward_xp AS REAL)) > ? THEN ?
           ELSE SUM(CAST(q.reward_xp AS REAL))
         END AS eligible_xp
       FROM nne_quest_attempts a
       JOIN nne_quests q ON q.id = a.quest_id
       WHERE a.status IN ('approved', 'completed')
         AND a.completed_at >= ?
         AND a.completed_at < ?
         AND q.type <> 'referral'
         AND CAST(q.reward_xp AS REAL) > 0
       GROUP BY a.user_id, date(a.completed_at)
     ), totals AS (
       SELECT user_id, ROUND(SUM(eligible_xp), 2) AS eligible_xp
       FROM daily_work
       GROUP BY user_id
     )
     SELECT
       u.id AS user_id,
       u.username,
       u.display_name,
       COALESCE(t.eligible_xp, 0) AS eligible_xp
     FROM nne_users u
     LEFT JOIN totals t ON t.user_id = u.id
     WHERE u.status = 'active'
       AND u.role = 'member'
       AND NOT EXISTS (
         SELECT 1 FROM nne_artist_reviewers r
         WHERE r.user_id = u.id AND r.active = 1
       )
     ORDER BY u.id`
  ).bind(
    Number(campaign.daily_eligible_xp_cap || 5),
    Number(campaign.daily_eligible_xp_cap || 5),
    campaign.starts_at,
    campaign.closes_at
  ).all();

  return (result.results || []).map((row) => {
    const eligibleXp = roundXp(row.eligible_xp);
    return {
      userId: row.user_id,
      username: row.username,
      name: row.display_name,
      eligibleXp,
      entries: entriesFor(campaign, eligibleXp)
    };
  });
}

async function persistedResult(env, campaignId) {
  return env.DB.prepare(
    `SELECT
       x.campaign_id, x.roster_hash, x.draw_nonce, x.total_entries,
       x.winner_user_id, x.winning_entry_index, x.drawn_at,
       u.username AS winner_username, u.display_name AS winner_name
     FROM nne_raffle_results x
     LEFT JOIN nne_users u ON u.id = x.winner_user_id
     WHERE x.campaign_id = ?
     LIMIT 1`
  ).bind(campaignId).first();
}

export async function finalizeNneRaffle(env, campaign, force = false) {
  const existing = await persistedResult(env, campaign.id);
  if (existing) return existing;
  if (!force && Date.now() < new Date(campaign.draw_at).getTime()) return null;
  if (["draft", "cancelled"].includes(campaign.status)) return null;

  const eligibility = await getNneRaffleEligibility(env, campaign);
  const roster = eligibility
    .filter((item) => item.entries > 0)
    .sort((left, right) => left.userId.localeCompare(right.userId))
    .map((item) => ({
      userId: item.userId,
      username: item.username,
      eligibleXp: item.eligibleXp,
      entries: item.entries
    }));
  const rosterJson = JSON.stringify(roster);
  const rosterHash = await sha256(rosterJson);
  const drawNonce = randomHex(32);
  const totalEntries = roster.reduce((total, item) => total + item.entries, 0);
  let winnerUserId = null;
  let winningEntryIndex = null;

  if (totalEntries > 0) {
    const digest = await sha256(`${rosterHash}:${drawNonce}:${campaign.id}`);
    winningEntryIndex = Number.parseInt(digest.slice(0, 12), 16) % totalEntries;
    let cursor = 0;
    for (const item of roster) {
      cursor += item.entries;
      if (winningEntryIndex < cursor) {
        winnerUserId = item.userId;
        break;
      }
    }
  }

  const drawnAt = now();
  await env.DB.prepare(
    `INSERT OR IGNORE INTO nne_raffle_results (
       campaign_id, roster_json, roster_hash, draw_nonce, total_entries,
       winner_user_id, winning_entry_index, drawn_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    campaign.id,
    rosterJson,
    rosterHash,
    drawNonce,
    totalEntries,
    winnerUserId,
    winningEntryIndex,
    drawnAt
  ).run();

  const result = await persistedResult(env, campaign.id);
  await env.DB.prepare(
    `UPDATE nne_raffle_campaigns
     SET status = 'drawn', winner_user_id = ?, updated_at = ?
     WHERE id = ? AND status NOT IN ('draft', 'cancelled')`
  ).bind(result?.winner_user_id || null, result?.drawn_at || drawnAt, campaign.id).run();

  if (result?.winner_user_id) {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO nne_feed_events (
         id, user_id, event_type, message, visibility, source_type, source_id, created_at
       ) VALUES (?, ?, 'raffle_winner', ?, 'public', 'raffle', ?, ?)`
    ).bind(
      `raffle_result_${campaign.id}`,
      result.winner_user_id,
      `@${result.winner_username} ganó ${campaign.prize_name} en el sorteo semanal.`,
      campaign.id,
      result.drawn_at
    ).run();
  }

  return result;
}

function xpToNextEntry(campaign, eligibility) {
  if (eligibility.entries >= Number(campaign.max_entries_per_user || 3)) return 0;
  const threshold = Number(campaign.xp_per_entry || 10);
  const remainder = roundXp(eligibility.eligibleXp % threshold);
  return roundXp(remainder === 0 ? threshold : threshold - remainder);
}

export async function listNneRaffles(env, userId) {
  const query = await env.DB.prepare(
    `SELECT c.*
     FROM nne_raffle_campaigns c
     WHERE c.status NOT IN ('draft', 'cancelled')
     ORDER BY
       CASE WHEN c.status = 'open' THEN 0 ELSE 1 END,
       CASE WHEN c.status = 'open' THEN c.draw_at END ASC,
       c.draw_at DESC
     LIMIT 8`
  ).all();

  const campaigns = [];
  for (const campaign of query.results || []) {
    let result = await persistedResult(env, campaign.id);
    if (!result && Date.now() >= new Date(campaign.draw_at).getTime()) {
      result = await finalizeNneRaffle(env, campaign);
      campaign.status = "drawn";
      campaign.winner_user_id = result?.winner_user_id || null;
    }

    const eligibility = await getNneRaffleEligibility(env, campaign);
    const currentUser = eligibility.find((item) => item.userId === userId) || {
      userId,
      username: "",
      name: "",
      eligibleXp: 0,
      entries: 0
    };
    const participants = eligibility
      .filter((item) => item.entries > 0)
      .sort((left, right) => right.entries - left.entries || left.username.localeCompare(right.username));

    campaigns.push({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      prizeName: campaign.prize_name,
      prizeRewardId: campaign.prize_reward_id || null,
      xpPerEntry: Number(campaign.xp_per_entry),
      maxEntriesPerUser: Number(campaign.max_entries_per_user),
      dailyEligibleXpCap: Number(campaign.daily_eligible_xp_cap),
      status: result ? "drawn" : campaign.status,
      startsAt: campaign.starts_at,
      closesAt: campaign.closes_at,
      drawAt: campaign.draw_at,
      userEligibleXp: currentUser.eligibleXp,
      userEntries: currentUser.entries,
      xpToNextEntry: xpToNextEntry(campaign, currentUser),
      participantCount: participants.length,
      totalEntries: result
        ? Number(result.total_entries || 0)
        : participants.reduce((total, item) => total + item.entries, 0),
      participants: participants.map((item) => ({
        username: item.username,
        name: item.name,
        entries: item.entries
      })),
      result: result ? {
        winner: result.winner_user_id ? {
          userId: result.winner_user_id,
          username: result.winner_username,
          name: result.winner_name
        } : null,
        rosterHash: result.roster_hash,
        totalEntries: Number(result.total_entries || 0),
        drawnAt: result.drawn_at
      } : null
    });
  }

  return campaigns;
}
