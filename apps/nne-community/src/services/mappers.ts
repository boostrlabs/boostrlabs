import type {
  DashboardData,
  FeedItem,
  LeaderboardEntry,
  Quest,
  Reward,
  UserProfile
} from "../types";

type Raw = Record<string, any>;

export function mapUser(row: Raw): UserProfile {
  const name = String(row.name || row.display_name || row.username || "NNE Member");
  return {
    id: String(row.id),
    email: String(row.email || ""),
    username: String(row.username || ""),
    name,
    handle: String(row.handle || `@${row.username || ""}`),
    initials: String(row.initials || name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()),
    role: row.role === "admin" ? "admin" : "member",
    avatarUrl: row.avatar_url || null,
    level: Number(row.level || 1),
    credits: Number(row.credits || 0),
    xp: Number(row.xp || 0),
    xpInLevel: Number(row.xp_in_level ?? Number(row.xp || 0) % 1000),
    xpToNextLevel: Number(row.xp_to_next_level || 1000),
    streakDays: Number(row.streak_days || 0),
    nneScore: Number(row.nne_score || 0),
    completedQuestCount: Number(row.completed_quest_count || 0),
    title: String(row.title || "New Wave")
  };
}

export function mapQuest(row: Raw): Quest {
  return {
    id: String(row.id),
    type: row.type,
    platform: String(row.platform),
    title: String(row.title),
    description: String(row.description),
    sourceUrl: row.source_url || null,
    rewardCredits: Number(row.reward_credits || 0),
    rewardXp: Number(row.reward_xp || row.reward_credits || 0),
    status: row.status,
    icon: String(row.icon || "◆"),
    verificationMethod: row.verification_method,
    minimumLevel: Number(row.minimum_level || 1),
    minimumListenSeconds: Number(row.minimum_listen_seconds || 0),
    passPercentage: Number(row.pass_percentage || 75),
    attempt: row.attempt
      ? {
          id: String(row.attempt.id),
          status: String(row.attempt.status),
          unlockAt: row.attempt.unlock_at || null,
          score: row.attempt.score == null ? null : Number(row.attempt.score),
          submittedAt: row.attempt.submitted_at || null,
          rejectionReason: row.attempt.rejection_reason || null
        }
      : null,
    song: row.song
      ? {
          id: String(row.song.id),
          title: String(row.song.title),
          artistName: String(row.song.artist_name),
          listenUrl: String(row.song.listen_url),
          artworkUrl: row.song.artwork_url || null
        }
      : null
  };
}

export function mapFeed(row: Raw): FeedItem {
  return {
    id: String(row.id),
    type: String(row.type || row.event_type),
    text: String(row.message || row.text),
    createdAt: String(row.created_at)
  };
}

export function mapLeaderboard(row: Raw): LeaderboardEntry {
  return {
    rank: Number(row.rank),
    userId: String(row.user_id),
    username: String(row.username),
    name: String(row.name),
    initials: String(row.initials || "NN"),
    level: Number(row.level || 1),
    score: Number(row.score || 0)
  };
}

export function mapReward(row: Raw): Reward {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description),
    costCredits: Number(row.cost_credits),
    regularCostCredits: Number(row.regular_cost_credits || row.cost_credits),
    saleCostCredits: row.sale_cost_credits == null ? null : Number(row.sale_cost_credits),
    onSale: Boolean(row.on_sale),
    saleStartsAt: row.sale_starts_at || null,
    saleEndsAt: row.sale_ends_at || null,
    rewardType: row.reward_type || "physical",
    minimumLevel: Number(row.minimum_level),
    icon: String(row.icon || "◆"),
    imageUrl: row.image_url || null,
    remaining: row.remaining == null ? null : Number(row.remaining),
    available: Boolean(row.available)
  };
}

export function mapDashboard(payload: Raw): DashboardData {
  return {
    user: mapUser(payload.user),
    quests: (payload.quests || []).map(mapQuest),
    feed: (payload.feed || []).map(mapFeed),
    leaderboard: (payload.leaderboard || []).map(mapLeaderboard),
    currentRank: payload.current_rank == null ? null : Number(payload.current_rank),
    referralCode: payload.referral_code || null,
    referralReward: {
      credits: Number(payload.referral_reward?.credits || 1),
      xp: Number(payload.referral_reward?.xp || 100)
    },
    economy: {
      dailyCap: Number(payload.economy?.daily_cap || 5),
      earnedToday: Number(payload.economy?.earned_today || 0),
      remainingToday: Number(payload.economy?.remaining_today ?? 5),
      referenceUsdPerCredit: Number(payload.economy?.reference_usd_per_credit || 1),
      redemptionOnly: payload.economy?.redemption_only !== false,
      resetsAt: String(payload.economy?.resets_at || "00:00 UTC")
    }
  };
}
