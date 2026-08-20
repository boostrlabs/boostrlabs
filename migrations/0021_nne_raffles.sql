PRAGMA foreign_keys = ON;

-- Keep reviewer exclusions available even on databases created only from migrations.
CREATE TABLE IF NOT EXISTS nne_artist_reviewers (
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  artist_slug TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(user_id, artist_slug)
);

CREATE TABLE IF NOT EXISTS nne_raffle_campaigns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prize_name TEXT NOT NULL,
  prize_reward_id TEXT REFERENCES nne_rewards(id) ON DELETE SET NULL,
  xp_per_entry REAL NOT NULL DEFAULT 10 CHECK (xp_per_entry > 0),
  max_entries_per_user INTEGER NOT NULL DEFAULT 3 CHECK (max_entries_per_user > 0),
  daily_eligible_xp_cap REAL NOT NULL DEFAULT 5 CHECK (daily_eligible_xp_cap > 0),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'closed', 'drawn', 'cancelled')),
  starts_at TEXT NOT NULL,
  closes_at TEXT NOT NULL,
  draw_at TEXT NOT NULL,
  winner_user_id TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_raffle_campaigns_public
  ON nne_raffle_campaigns(status, draw_at DESC);

CREATE TABLE IF NOT EXISTS nne_raffle_results (
  campaign_id TEXT PRIMARY KEY REFERENCES nne_raffle_campaigns(id) ON DELETE CASCADE,
  roster_json TEXT NOT NULL CHECK (json_valid(roster_json)),
  roster_hash TEXT NOT NULL,
  draw_nonce TEXT NOT NULL,
  total_entries INTEGER NOT NULL CHECK (total_entries >= 0),
  winner_user_id TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  winning_entry_index INTEGER,
  drawn_at TEXT NOT NULL,
  CHECK (
    (total_entries = 0 AND winner_user_id IS NULL AND winning_entry_index IS NULL)
    OR
    (total_entries > 0 AND winner_user_id IS NOT NULL AND winning_entry_index >= 0)
  )
);

INSERT OR IGNORE INTO nne_raffle_campaigns (
  id, title, description, prize_name, prize_reward_id,
  xp_per_entry, max_entries_per_user, daily_eligible_xp_cap,
  status, starts_at, closes_at, draw_at, created_at, updated_at
) VALUES (
  's1_weekly_beat_01',
  'BEAT WESTDETRO · DOMINGO',
  'Tu XP participa automáticamente. No tienes que gastarla.',
  'Beat WESTDETRO',
  NULL,
  10,
  3,
  5,
  'open',
  '2026-08-20T04:00:00.000Z',
  '2026-08-24T00:00:00.000Z',
  '2026-08-24T00:00:00.000Z',
  datetime('now'),
  datetime('now')
);
