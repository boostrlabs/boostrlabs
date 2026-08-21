PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS nne_beats (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  bpm INTEGER,
  musical_key TEXT,
  tags TEXT,
  preview_url TEXT,
  artwork_url TEXT,
  lease_price_cents INTEGER,
  exclusive_price_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'submitted',
  westdetro_certified INTEGER NOT NULL DEFAULT 0,
  review_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_beats_public ON nne_beats(status,westdetro_certified,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_nne_beats_owner ON nne_beats(owner_user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS nne_service_listings (
  id TEXT PRIMARY KEY,
  seller_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  turnaround_days INTEGER,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_service_listings_public ON nne_service_listings(status,category,updated_at DESC);

CREATE TABLE IF NOT EXISTS nne_seller_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
  amount_cents INTEGER NOT NULL,
  kind TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id,kind,source_type,source_id)
);
CREATE INDEX IF NOT EXISTS idx_nne_seller_ledger_user ON nne_seller_ledger(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS nne_academy_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  cost_nne REAL NOT NULL,
  asset_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_academy_public ON nne_academy_items(status,category,updated_at DESC);

CREATE TABLE IF NOT EXISTS nne_jobs (
  id TEXT PRIMARY KEY,
  creator_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  compensation_type TEXT NOT NULL,
  budget_cents INTEGER,
  budget_nne REAL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_jobs_public ON nne_jobs(status,category,created_at DESC);

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
CREATE INDEX IF NOT EXISTS idx_nne_marketplace_orders_buyer ON nne_marketplace_orders(buyer_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nne_marketplace_orders_seller ON nne_marketplace_orders(seller_user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS nne_contract_documents (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES nne_marketplace_orders(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('beat_lease','beat_exclusive','service_agreement','invoice','receipt')),
  version TEXT NOT NULL DEFAULT 'v1',
  terms_json TEXT NOT NULL CHECK (json_valid(terms_json)),
  rendered_text TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nne_contract_documents_order ON nne_contract_documents(order_id,created_at DESC);

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
  UNIQUE(user_id,source_type,source_id)
);

INSERT OR IGNORE INTO nne_cashback_rules (id,label,source_type,cashback_percent,max_credits,status,created_at,updated_at)
VALUES ('nne_event_cashback_20','Eventos NNE × WESTDETRO · 20% cashback','event_ticket',20,NULL,'active',datetime('now'),datetime('now'));

INSERT OR IGNORE INTO nne_academy_items (id,title,description,category,cost_nne,status,created_at,updated_at) VALUES
('academy_westdetro_drums_001','WESTDETRO Drum Kit 001','Kit de drums curado para producir dentro del universo WESTDETRO.','drum_kit',20,'published',datetime('now'),datetime('now')),
('academy_vocal_project_001','Vocal Project 001','Proyecto educativo de voces, routing y procesamiento para estudio.','vocal_project',25,'published',datetime('now'),datetime('now')),
('academy_production_breakdown_001','Cómo construir un WESTDETRO','Breakdown de producción, estructura, drums y bajos.','course',15,'published',datetime('now'),datetime('now'));
