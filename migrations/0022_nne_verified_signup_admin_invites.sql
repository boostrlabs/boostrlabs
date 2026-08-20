PRAGMA foreign_keys = ON;

-- Existing applications predate email verification and remain reviewable. New
-- applications explicitly opt into the pending -> verified flow.
ALTER TABLE nne_access_applications ADD COLUMN email_verification_status TEXT NOT NULL DEFAULT 'legacy'
  CHECK (email_verification_status IN ('legacy', 'pending', 'verified'));
ALTER TABLE nne_access_applications ADD COLUMN email_verified_at TEXT;
ALTER TABLE nne_access_applications ADD COLUMN admin_invite_id TEXT;

CREATE TABLE IF NOT EXISTS nne_email_verification_tokens (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES nne_access_applications(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'revoked')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used_at TEXT,
  requested_ip TEXT
);

CREATE INDEX IF NOT EXISTS idx_nne_email_verification_application
  ON nne_email_verification_tokens(application_id, status, expires_at);

CREATE TABLE IF NOT EXISTS nne_admin_invites (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  intended_username TEXT NOT NULL COLLATE NOCASE,
  granted_role TEXT NOT NULL DEFAULT 'admin' CHECK (granted_role = 'admin'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'revoked')),
  expires_at TEXT NOT NULL,
  created_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  used_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  used_at TEXT,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_nne_admin_invites_status_expiry
  ON nne_admin_invites(status, expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nne_access_applications_admin_invite
  ON nne_access_applications(admin_invite_id)
  WHERE admin_invite_id IS NOT NULL;

