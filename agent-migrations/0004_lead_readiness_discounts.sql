CREATE TABLE IF NOT EXISTS agent_readiness(
  user_id TEXT PRIMARY KEY,
  whatsapp_ready INTEGER NOT NULL DEFAULT 0,
  instagram_ready INTEGER NOT NULL DEFAULT 0,
  tiktok_ready INTEGER NOT NULL DEFAULT 0,
  kit_ready INTEGER NOT NULL DEFAULT 0,
  pricing_ready INTEGER NOT NULL DEFAULT 0,
  scripts_ready INTEGER NOT NULL DEFAULT 0,
  roleplay_ready INTEGER NOT NULL DEFAULT 0,
  approved_for_pool INTEGER NOT NULL DEFAULT 0,
  reviewed_at TEXT,
  reviewed_by TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS discount_codes(
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK(kind IN ('PERCENT','FIXED')),
  value REAL NOT NULL,
  min_amount REAL NOT NULL DEFAULT 500,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
