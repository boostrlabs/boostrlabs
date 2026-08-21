PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS nne_academy_redemptions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES nne_academy_items(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
  cost_nne REAL NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(item_id,user_id)
);

CREATE TABLE IF NOT EXISTS nne_portfolio_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_portfolio_user ON nne_portfolio_items(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS nne_bounties (
  id TEXT PRIMARY KEY,
  created_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_nne REAL NOT NULL DEFAULT 0,
  reward_usd_cents INTEGER,
  winner_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS nne_bounty_entries (
  id TEXT PRIMARY KEY,
  bounty_id TEXT NOT NULL REFERENCES nne_bounties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  submission_url TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(bounty_id,user_id)
);

CREATE TABLE IF NOT EXISTS nne_wishlist (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_name TEXT NOT NULL,
  target_cost_nne REAL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id,target_type,target_id)
);

CREATE TABLE IF NOT EXISTS nne_drops (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  drop_type TEXT NOT NULL,
  target_id TEXT,
  cost_nne REAL,
  inventory INTEGER,
  starts_at TEXT,
  ends_at TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nne_partner_offers (
  id TEXT PRIMARY KEY,
  partner_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cashback_percent REAL,
  redemption_cost_nne REAL,
  external_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nne_job_applications (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES nne_jobs(id) ON DELETE CASCADE,
  applicant_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  pitch TEXT NOT NULL,
  portfolio_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(job_id,applicant_user_id)
);

CREATE TABLE IF NOT EXISTS nne_seller_payout_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  payout_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  external_reference TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_seller_payout_user ON nne_seller_payout_requests(user_id,created_at DESC);
