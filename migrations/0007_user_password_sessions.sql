-- BOOSTR user password login foundation.
-- Existing users keep password_hash NULL until a password is set.

ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_set_at TEXT;
ALTER TABLE users ADD COLUMN last_login_at TEXT;

CREATE INDEX IF NOT EXISTS idx_users_status
  ON users(status);
