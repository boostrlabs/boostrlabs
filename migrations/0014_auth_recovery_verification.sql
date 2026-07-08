-- BOOSTR Labs D1 Migration 0014
-- Auth recovery and email verification foundation.

ALTER TABLE users ADD COLUMN password_reset_token_hash TEXT;
ALTER TABLE users ADD COLUMN password_reset_token_expires_at TEXT;
ALTER TABLE users ADD COLUMN email_verification_token_hash TEXT;
ALTER TABLE users ADD COLUMN email_verification_token_expires_at TEXT;
ALTER TABLE users ADD COLUMN email_verified_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_password_reset_token_hash
  ON users(password_reset_token_hash)
  WHERE password_reset_token_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_verification_token_hash
  ON users(email_verification_token_hash)
  WHERE email_verification_token_hash IS NOT NULL;
