PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS nne_secure_beats (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
  title TEXT NOT NULL,
  producer_name TEXT NOT NULL,
  description TEXT,
  bpm INTEGER CHECK (bpm IS NULL OR bpm BETWEEN 30 AND 300),
  musical_key TEXT,
  artwork_object_key TEXT,
  stream_object_key TEXT,
  stream_content_type TEXT,
  master_object_key TEXT,
  master_content_type TEXT,
  sale_mode TEXT NOT NULL DEFAULT 'lease' CHECK (sale_mode IN ('lease', 'exclusive', 'both')),
  lease_price_credits INTEGER CHECK (lease_price_credits IS NULL OR lease_price_credits > 0),
  exclusive_price_credits INTEGER CHECK (exclusive_price_credits IS NULL OR exclusive_price_credits > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'sold', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_secure_beats_catalog
  ON nne_secure_beats(status, sort_order, created_at DESC);

CREATE TABLE IF NOT EXISTS nne_beat_listen_sessions (
  id TEXT PRIMARY KEY,
  beat_id TEXT NOT NULL REFERENCES nne_secure_beats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  nne_session_id TEXT NOT NULL REFERENCES nne_sessions(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  user_agent_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_beat_listen_session_access
  ON nne_beat_listen_sessions(user_id, beat_id, status, expires_at);

CREATE TABLE IF NOT EXISTS nne_beat_licenses (
  id TEXT PRIMARY KEY,
  beat_id TEXT NOT NULL REFERENCES nne_secure_beats(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
  license_type TEXT NOT NULL CHECK (license_type IN ('lease', 'exclusive')),
  price_credits INTEGER NOT NULL CHECK (price_credits > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'refunded')),
  license_number TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_beat_licenses_user
  ON nne_beat_licenses(user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nne_beat_license_owner
  ON nne_beat_licenses(beat_id, user_id)
  WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_nne_beat_exclusive_license
  ON nne_beat_licenses(beat_id)
  WHERE license_type = 'exclusive' AND status = 'active';

CREATE TABLE IF NOT EXISTS nne_beat_download_sessions (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL REFERENCES nne_beat_licenses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  nne_session_id TEXT NOT NULL REFERENCES nne_sessions(id) ON DELETE CASCADE,
  asset_kind TEXT NOT NULL CHECK (asset_kind IN ('master')),
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'revoked')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_nne_beat_download_access
  ON nne_beat_download_sessions(user_id, license_id, status, expires_at);
