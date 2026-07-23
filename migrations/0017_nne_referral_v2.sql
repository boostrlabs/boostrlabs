PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS nne_referral_codes (
  referral_code TEXT PRIMARY KEY COLLATE NOCASE,
  referrer_user_id TEXT NOT NULL UNIQUE REFERENCES nne_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_referral_codes_user_status
  ON nne_referral_codes(referrer_user_id, status);

CREATE TABLE IF NOT EXISTS nne_referral_events (
  id TEXT PRIMARY KEY,
  referrer_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  referred_user_id TEXT NOT NULL UNIQUE REFERENCES nne_users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL COLLATE NOCASE,
  status TEXT NOT NULL DEFAULT 'rewarded' CHECK (status IN ('registered', 'rewarded', 'reversed')),
  reward_credits_each INTEGER NOT NULL DEFAULT 0 CHECK (reward_credits_each >= 0),
  reward_xp_each INTEGER NOT NULL DEFAULT 0 CHECK (reward_xp_each >= 0),
  created_at TEXT NOT NULL,
  rewarded_at TEXT,
  UNIQUE(referrer_user_id, referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_nne_referral_events_referrer
  ON nne_referral_events(referrer_user_id, created_at DESC);

INSERT OR IGNORE INTO nne_referral_codes (
  referral_code, referrer_user_id, status, created_at, updated_at
)
SELECT referral_code, referrer_user_id, 'active', created_at, created_at
FROM nne_referrals
ORDER BY created_at ASC;

INSERT OR IGNORE INTO nne_referral_events (
  id, referrer_user_id, referred_user_id, referral_code, status,
  reward_credits_each, reward_xp_each, created_at, rewarded_at
)
SELECT
  id,
  referrer_user_id,
  referred_user_id,
  referral_code,
  CASE WHEN status = 'rewarded' THEN 'rewarded' ELSE 'registered' END,
  COALESCE((
    SELECT reward_credits
    FROM nne_quests
    WHERE id = 'quest_referral_artist'
    LIMIT 1
  ), 500),
  COALESCE((
    SELECT reward_xp
    FROM nne_quests
    WHERE id = 'quest_referral_artist'
    LIMIT 1
  ), 500),
  created_at,
  rewarded_at
FROM nne_referrals
WHERE referred_user_id IS NOT NULL;
