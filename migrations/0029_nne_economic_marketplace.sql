PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS nne_marketplace_profiles (
  user_id TEXT PRIMARY KEY REFERENCES nne_users(id) ON DELETE CASCADE,
  seller_status TEXT NOT NULL DEFAULT 'active' CHECK (seller_status IN ('active','paused','suspended')),
  headline TEXT,
  bio TEXT,
  stripe_account_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nne_beats (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  bpm INTEGER,
  musical_key TEXT,
  tags TEXT,
  preview_url TEXT,
  artwork_url TEXT,
  lease_price_cents INTEGER CHECK (lease_price_cents IS NULL OR lease_price_cents > 0),
  exclusive_price_cents INTEGER CHECK (exclusive_price_cents IS NULL OR exclusive_price_cents > 0),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft','submitted','reviewing','published','rejected','archived')),
  westdetro_certified INTEGER NOT NULL DEFAULT 0 CHECK (westdetro_certified IN (0,1)),
  review_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_beats_public ON nne_beats(status,westdetro_certified,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_nne_beats_owner ON nne_beats(owner_user_id,updated_at DESC);

CREATE TABLE IF NOT EXISTS nne_service_listings (
  id TEXT PRIMARY KEY,
  seller_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  turnaround_days INTEGER,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','paused','archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_services_public ON nne_service_listings(status,category,updated_at DESC);

CREATE TABLE IF NOT EXISTS nne_market_orders (
  id TEXT PRIMARY KEY,
  buyer_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
  seller_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
  item_type TEXT NOT NULL CHECK (item_type IN ('beat_lease','beat_exclusive','service')),
  item_id TEXT NOT NULL,
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents > 0),
  platform_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (platform_fee_cents >= 0),
  seller_net_cents INTEGER NOT NULL CHECK (seller_net_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','in_progress','delivered','completed','refunded','disputed','cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_market_orders_buyer ON nne_market_orders(buyer_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nne_market_orders_seller ON nne_market_orders(seller_user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS nne_seller_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents <> 0),
  kind TEXT NOT NULL CHECK (kind IN ('sale','refund','adjustment','payout')),
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id,kind,source_type,source_id)
);
CREATE INDEX IF NOT EXISTS idx_nne_seller_ledger_user ON nne_seller_ledger(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS nne_market_contracts (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES nne_market_orders(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('beat_lease','beat_exclusive','service_agreement')),
  version TEXT NOT NULL,
  terms_json TEXT NOT NULL CHECK (json_valid(terms_json)),
  rendered_text TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nne_invoices (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES nne_market_orders(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','paid','void','refunded')),
  issued_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nne_academy_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('course','sample_pack','drum_kit','vocal_project','preset','plugin','template','data')),
  cost_nne REAL NOT NULL CHECK (cost_nne > 0),
  asset_url TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','paused','archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_academy_public ON nne_academy_items(status,category,updated_at DESC);

CREATE TABLE IF NOT EXISTS nne_academy_redemptions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES nne_academy_items(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
  cost_nne REAL NOT NULL CHECK (cost_nne > 0),
  created_at TEXT NOT NULL,
  UNIQUE(item_id,user_id)
);

CREATE TABLE IF NOT EXISTS nne_jobs (
  id TEXT PRIMARY KEY,
  creator_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  compensation_type TEXT NOT NULL CHECK (compensation_type IN ('usd','nne','mixed')),
  budget_cents INTEGER,
  budget_nne REAL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','assigned','completed','cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_jobs_public ON nne_jobs(status,category,created_at DESC);

CREATE TABLE IF NOT EXISTS nne_cashback_rules (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  source_type TEXT NOT NULL,
  cashback_percent REAL NOT NULL CHECK (cashback_percent > 0 AND cashback_percent <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO nne_academy_items (id,title,description,category,cost_nne,status,created_at,updated_at) VALUES
('academy_westdetro_drums_001','WESTDETRO Drum Kit 001','Kit de drums curado para producir dentro del universo WESTDETRO.','drum_kit',20,'published',datetime('now'),datetime('now')),
('academy_vocal_project_001','Vocal Project 001','Proyecto educativo de voces, routing y procesamiento para estudio.','vocal_project',25,'published',datetime('now'),datetime('now')),
('academy_production_breakdown_001','Cómo construir un WESTDETRO','Breakdown de producción, estructura, drums y bajos.','course',15,'published',datetime('now'),datetime('now'));

INSERT OR IGNORE INTO nne_cashback_rules (id,label,source_type,cashback_percent,status,created_at,updated_at) VALUES
('cashback_events_20','Eventos NNE / WESTDETRO','event_ticket',20,'active',datetime('now'),datetime('now'));
