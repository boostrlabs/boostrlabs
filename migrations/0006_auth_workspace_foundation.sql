-- BOOSTR auth and workspace foundation.
-- Existing rows are not backfilled.

CREATE TABLE IF NOT EXISTS workspace_members (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'partner', 'client', 'artist')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'disabled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_members_workspace_user
  ON workspace_members(workspace_id, user_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user
  ON workspace_members(user_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace
  ON workspace_members(workspace_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_role
  ON workspace_members(role);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_token_hash TEXT NOT NULL UNIQUE,
  active_workspace_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT,
  revoked_at TEXT,
  ip TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user
  ON sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash
  ON sessions(session_token_hash);

CREATE INDEX IF NOT EXISTS idx_sessions_active
  ON sessions(status, expires_at);

CREATE INDEX IF NOT EXISTS idx_leads_workspace
  ON leads(workspace_id);

CREATE INDEX IF NOT EXISTS idx_leads_created_by_user
  ON leads(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_workspace
  ON audit_submissions(workspace_id);

CREATE INDEX IF NOT EXISTS idx_lead_events_workspace
  ON lead_events(workspace_id);
