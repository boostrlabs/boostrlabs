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

export type DistributionReleaseStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "packaged"
  | "delivered"
  | "live"
  | "delivered_demo"
  | "live_demo"
  | "takedown_requested"
  | "taken_down";

export interface DistributionContributor {
  id?: string;
  track_id?: string;
  name: string;
  role: "primary_artist" | "featured_artist" | "producer" | "songwriter" | "composer" | "publisher" | "mix_engineer" | "mastering_engineer";
  ipi_cae?: string | null;
  pro_name?: string | null;
  publisher_name?: string | null;
}

export interface DistributionSplit {
  id?: string;
  participant_name: string;
  participant_email?: string | null;
  role: string;
  percentage: number;
  percentage_bps?: number;
  status: "pending" | "accepted" | "disputed";
}

export interface DistributionTrack {
  id: string;
  disc_number: number;
  track_number: number;
  title: string;
  version_title?: string | null;
  artist_display: string;
  isrc?: string | null;
  language_code: string;
  primary_genre?: string | null;
  explicit_content: boolean;
  instrumental: boolean;
  master_ready: boolean;
  master_original_name?: string | null;
  contributors: DistributionContributor[];
  splits: DistributionSplit[];
}

export interface DistributionCheck {
  key: string;
  label: string;
  ready: boolean;
  detail: string;
}

export interface DistributionRelease {
  id: string;
  artist_id: string;
  artist_name: string;
  artist_slug: string;
  owner_username?: string | null;
  title: string;
  release_type: "single" | "ep" | "album";
  version_title?: string | null;
  label_name: string;
  catalog_number?: string | null;
  upc?: string | null;
  primary_genre?: string | null;
  secondary_genre?: string | null;
  language_code: string;
  original_release_date?: string | null;
  release_date?: string | null;
  copyright_year?: number | null;
  c_line?: string | null;
  p_line?: string | null;
  explicit_content: boolean;
  rights_confirmed: boolean;
  agreement_accepted: boolean;
  agreement_version?: string | null;
  status: DistributionReleaseStatus;
  provider_key: string;
  provider?: {
    key: string;
    name: string;
    mode: "sandbox" | "white_label" | "direct_deal";
    status: "sandbox" | "configuration_required" | "connected" | "paused";
    ready: boolean;
    capabilities: Record<string, boolean>;
  };
  provider_release_id?: string | null;
  review_note?: string | null;
  artwork_url?: string | null;
  territories: string[];
  stores: string[];
  tracks: DistributionTrack[];
  readiness: { score: number; ready: boolean; checks: DistributionCheck[]; blockers: DistributionCheck[] };
  events: Array<{ id: string; event_type: string; from_status?: string | null; to_status?: string | null; created_at: string }>;
  delivery_jobs: Array<{ id: string; provider_key: string; status: string; created_at: string; accepted_at?: string | null }>;
  updated_at: string;
}

export interface DistributionArtist {
  id: string;
  slug: string;
  name: string;
  instagram_handle?: string | null;
}

export interface DistributionFinance {
  balances: Array<{
    currency: string;
    earned_micros: number;
    paid_micros: number;
    reserved_micros: number;
    available_micros: number;
  }>;
  statements: Array<{
    id: string;
    provider_key: string;
    period_start: string;
    period_end: string;
    currency: string;
    net_micros: number;
    line_count: number;
    status: string;
  }>;
  payouts: Array<{
    id: string;
    artist_id: string;
    artist_name: string;
    currency: string;
    amount_micros: number;
    status: string;
    requested_at: string;
  }>;
  accounting_unit: "micros";
  credits_separated: true;
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
