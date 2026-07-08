-- BOOSTR Labs D1 Migration 0012
-- Production signup fields and first-run workspace bootstrap support.

ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN normalized_phone TEXT;
ALTER TABLE users ADD COLUMN signup_source TEXT;
ALTER TABLE users ADD COLUMN invite_code_id TEXT;
ALTER TABLE users ADD COLUMN onboarding_status TEXT NOT NULL DEFAULT 'first_run';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique
  ON users(username)
  WHERE username IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_normalized_phone_unique
  ON users(normalized_phone)
  WHERE normalized_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_invite_code
  ON users(invite_code_id);

CREATE INDEX IF NOT EXISTS idx_users_onboarding_status
  ON users(onboarding_status);

CREATE INDEX IF NOT EXISTS idx_workspaces_slug
  ON workspaces(slug);
