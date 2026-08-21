PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS nne_marketplace_beats (
  id TEXT PRIMARY KEY,
  seller_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  producer_name TEXT NOT NULL,
  bpm INTEGER,
  musical_key TEXT,
  tags TEXT,
  preview_url TEXT,
  artwork_url TEXT,
  lease_price_cents INTEGER CHECK (lease_price_cents IS NULL OR lease_price_cents > 0),
  exclusive_price_cents INTEGER CHECK (exclusive_price_cents IS NULL OR exclusive_price_cents > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  westdetro_status TEXT NOT NULL DEFAULT 'submitted' CHECK (westdetro_status IN ('submitted','reviewing','certified','not_westdetro')),
  marketplace_status TEXT NOT NULL DEFAULT 'pending' CHECK (marketplace_status IN ('pending','published','paused','sold','archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_marketplace_beats_public ON nne_marketplace_beats(marketplace_status, westdetro_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nne_marketplace_beats_seller ON nne_marketplace_beats(seller_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS nne_marketplace_services (
  id TEXT PRIMARY KEY,
  seller_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  delivery_days INTEGER NOT NULL DEFAULT 7 CHECK (delivery_days > 0),
  revisions INTEGER NOT NULL DEFAULT 1 CHECK (revisions >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','paused','archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_marketplace_services_public ON nne_marketplace_services(status, category, created_at DESC);

CREATE TABLE IF NOT EXISTS nne_marketplace_orders (
  id TEXT PRIMARY KEY,
  buyer_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
  seller_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
  item_type TEXT NOT NULL CHECK (item_type IN ('beat_lease','beat_exclusive','service')),
  item_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  platform_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (platform_fee_cents >= 0),
  seller_net_cents INTEGER NOT NULL CHECK (seller_net_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','paid','in_progress','delivered','completed','refunded','cancelled','disputed')),
  created_at TEXT NOT NULL,
  paid_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_marketplace_orders_buyer ON nne_marketplace_orders(buyer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nne_marketplace_orders_seller ON nne_marketplace_orders(seller_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS nne_seller_earnings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
  order_id TEXT REFERENCES nne_marketplace_orders(id) ON DELETE RESTRICT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents <> 0),
  kind TEXT NOT NULL CHECK (kind IN ('sale','refund','payout','adjustment')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('pending','available','paid','reversed')),
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  available_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_nne_seller_earnings_user ON nne_seller_earnings(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS nne_contract_documents (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES nne_marketplace_orders(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('beat_lease','beat_exclusive','service_agreement','invoice','receipt')),
  version TEXT NOT NULL DEFAULT 'v1',
  terms_json TEXT NOT NULL CHECK (json_valid(terms_json)),
  rendered_text TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_contract_documents_order ON nne_contract_documents(order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS nne_jobs (
  id TEXT PRIMARY KEY,
  client_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  budget_type TEXT NOT NULL DEFAULT 'usd' CHECK (budget_type IN ('usd','nne','mixed')),
  budget_amount INTEGER NOT NULL CHECK (budget_amount > 0),
  deadline_at TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','assigned','completed','cancelled','archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_jobs_public ON nne_jobs(status, category, created_at DESC);

CREATE TABLE IF NOT EXISTS nne_academy_items (
  id TEXT PRIMARY KEY,
  creator_user_id TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('course','sample_pack','drum_kit','preset','vocal_chain','project','stems','plugin','data','template','other')),
  description TEXT NOT NULL,
  cost_credits INTEGER NOT NULL CHECK (cost_credits > 0),
  asset_key TEXT,
  preview_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','paused','archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_academy_public ON nne_academy_items(status, category, sort_order, created_at DESC);

CREATE TABLE IF NOT EXISTS nne_cashback_rules (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  source_type TEXT NOT NULL,
  cashback_percent REAL NOT NULL CHECK (cashback_percent > 0 AND cashback_percent <= 100),
  max_credits REAL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nne_cashback_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
  rule_id TEXT REFERENCES nne_cashback_rules(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  purchase_amount_cents INTEGER NOT NULL CHECK (purchase_amount_cents > 0),
  awarded_credits REAL NOT NULL CHECK (awarded_credits > 0),
  status TEXT NOT NULL DEFAULT 'awarded' CHECK (status IN ('pending','awarded','reversed')),
  created_at TEXT NOT NULL,
  UNIQUE(user_id, source_type, source_id)
);

INSERT OR IGNORE INTO nne_cashback_rules (id,label,source_type,cashback_percent,max_credits,status,created_at,updated_at)
VALUES ('nne_event_cashback_20','Eventos NNE × WESTDETRO · 20% cashback','event_ticket',20,NULL,'active',datetime('now'),datetime('now'));
