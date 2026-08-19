PRAGMA foreign_keys = ON;

ALTER TABLE nne_users ADD COLUMN phone_e164 TEXT;
ALTER TABLE nne_users ADD COLUMN phone_verified_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nne_users_phone_verified_unique
  ON nne_users(phone_e164)
  WHERE phone_e164 IS NOT NULL AND phone_verified_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS nne_password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms')),
  token_hash TEXT NOT NULL UNIQUE,
  destination_hint TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'revoked')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used_at TEXT,
  requested_ip TEXT
);

CREATE INDEX IF NOT EXISTS idx_nne_password_reset_user_status
  ON nne_password_reset_tokens(user_id, status, expires_at);

CREATE INDEX IF NOT EXISTS idx_nne_password_reset_expiry
  ON nne_password_reset_tokens(status, expires_at);
