export type QuestType =
  | "social-proof"
  | "listening-trivia"
  | "referral"
  | "community";

export type QuestStatus = "open" | "pending" | "completed" | "locked";

export interface TriviaQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Quest {
  id: string;
  type: QuestType;
  platform: string;
  title: string;
  description: string;
  rewardCredits: number;
  status: QuestStatus;
  icon: string;
  songUrl?: string;
  minimumListenSeconds?: number;
  passPercentage?: number;
  trivia?: TriviaQuestion[];
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  costCredits: number;
  minimumLevel: number;
  icon: string;
}

export interface FeedItem {
  id: string;
  text: string;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  initials: string;
  level: number;
  credits: number;
  xp: number;
  xpToNextLevel: number;
  streakDays: number;
  nneScore: number;
  completedQuestCount: number;
  title: string;
}
