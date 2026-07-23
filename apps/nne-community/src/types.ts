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
}
