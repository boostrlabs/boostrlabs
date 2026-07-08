-- BOOSTR Labs D1 Migration 0010
-- Secret BOOSTR Code / invite-code validation foundation.

CREATE TABLE IF NOT EXISTS invite_codes (
  id TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  code_salt TEXT,
  label TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  allowed_role TEXT,
  allowed_persona TEXT,
  allowed_workspace_type TEXT,
  campaign TEXT,
  source TEXT,
  bypass_audit INTEGER NOT NULL DEFAULT 1,
  metadata_json TEXT,
  created_by_user_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  revoked_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invite_codes_hash ON invite_codes(code_hash);
CREATE INDEX IF NOT EXISTS idx_invite_codes_status ON invite_codes(status);
CREATE INDEX IF NOT EXISTS idx_invite_codes_campaign ON invite_codes(campaign);
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires ON invite_codes(expires_at);

CREATE TABLE IF NOT EXISTS invite_code_events (
  id TEXT PRIMARY KEY,
  invite_code_id TEXT,
  event_type TEXT NOT NULL,
  source TEXT,
  ip TEXT,
  user_agent TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_invite_code_events_code ON invite_code_events(invite_code_id);
CREATE INDEX IF NOT EXISTS idx_invite_code_events_type ON invite_code_events(event_type);
