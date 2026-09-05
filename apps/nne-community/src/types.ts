export type QuestType =
  | "social-proof"
  | "listening-trivia"
  | "referral"
  | "community";

export type QuestStatus = "open" | "pending" | "completed" | "locked";

export interface TriviaOption {
  id: string;
  text: string;
}

export interface TriviaQuestion {
  id: string;
  prompt: string;
  options: TriviaOption[];
}

export interface TriviaSession {
  id: string;
  status: "locked" | "open" | "passed" | "failed" | "expired";
  unlockAt: string;
  expiresAt: string;
  score: number | null;
}

export interface QuestAttempt {
  id: string;
  status: string;
  unlockAt?: string | null;
  score?: number | null;
  submittedAt?: string | null;
  rejectionReason?: string | null;
}

export interface Quest {
  id: string;
  type: QuestType;
  platform: string;
  title: string;
  description: string;
  sourceUrl?: string | null;
  rewardCredits: number;
  rewardXp: number;
  status: QuestStatus;
  icon: string;
  verificationMethod: "manual" | "trivia" | "referral" | "automatic";
  minimumLevel: number;
  minimumListenSeconds: number;
  passPercentage: number;
  attempt: QuestAttempt | null;
  song?: {
    id: string;
    title: string;
    artistName: string;
    listenUrl: string;
    artworkUrl: string | null;
  } | null;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  costCredits: number;
  regularCostCredits: number;
  saleCostCredits: number | null;
  onSale: boolean;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  rewardType: "physical" | "service" | "digital";
  minimumLevel: number;
  icon: string;
  imageUrl: string | null;
  remaining: number | null;
  available: boolean;
}

export interface FeedItem {
  id: string;
  type: string;
  text: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  name: string;
  initials: string;
  level: number;
  score: number;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  name: string;
  handle: string;
  initials: string;
  role: "member" | "admin";
  avatarUrl: string | null;
  level: number;
  credits: number;
  xp: number;
  xpInLevel: number;
  xpToNextLevel: number;
  streakDays: number;
  nneScore: number;
  completedQuestCount: number;
  title: string;
}

export interface DashboardData {
  user: UserProfile;
  quests: Quest[];
  feed: FeedItem[];
  leaderboard: LeaderboardEntry[];
  currentRank: number | null;
  referralCode: string | null;
  referralReward: ReferralReward;
  economy: {
    dailyCap: number;
    earnedToday: number;
    remainingToday: number;
    referenceUsdPerCredit: number;
    redemptionOnly: boolean;
    resetsAt: string;
  };
}

export interface BeatLicense {
  id: string;
  licenseType: "lease" | "exclusive";
  licenseNumber: string;
  licensedAt: string;
}

export interface Beat {
  id: string;
  slug: string;
  title: string;
  producerName: string;
  description: string;
  bpm: number | null;
  musicalKey: string | null;
  saleMode: "lease" | "exclusive" | "both";
  leasePriceCredits: number | null;
  exclusivePriceCredits: number | null;
  artworkUrl: string | null;
  streamReady: boolean;
  available: boolean;
  license: BeatLicense | null;
}

export interface ReferralReward {
  credits: number;
  xp: number;
}

export interface ReferralPreview {
  code: string;
  referrer: {
    username: string;
    handle: string;
    name: string;
  };
  reward: ReferralReward;
}

export interface RaffleParticipant {
  username: string;
  name: string;
  entries: number;
}

export interface RaffleCampaign {
  id: string;
  title: string;
  description: string;
  prizeName: string;
  prizeRewardId: string | null;
  xpPerEntry: number;
  maxEntriesPerUser: number;
  dailyEligibleXpCap: number;
  status: "open" | "closed" | "drawn";
  startsAt: string;
  closesAt: string;
  drawAt: string;
  userEligibleXp: number;
  userEntries: number;
  xpToNextEntry: number;
  participantCount: number;
  totalEntries: number;
  participants: RaffleParticipant[];
  result: {
    winner: {
      userId: string;
      username: string;
      name: string;
    } | null;
    rosterHash: string;
    totalEntries: number;
    drawnAt: string;
  } | null;
}
