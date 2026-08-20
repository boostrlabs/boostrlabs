PRAGMA foreign_keys = ON;

-- Verification tokens for members whose accounts existed before the
-- application-based verification flow was introduced.
CREATE TABLE IF NOT EXISTS nne_user_email_verification_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'revoked')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used_at TEXT,
  requested_ip TEXT
);

CREATE INDEX IF NOT EXISTS idx_nne_user_email_verification_user
  ON nne_user_email_verification_tokens(user_id, status, expires_at);

-- A password is only the first login step. The raw challenge token and the
-- six-digit code never reach D1; only their SHA-256 digests are stored.
CREATE TABLE IF NOT EXISTS nne_login_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  destination TEXT NOT NULL,
  challenge_hash TEXT NOT NULL UNIQUE,
  code_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'revoked')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used_at TEXT,
  requested_ip TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_nne_login_challenges_user
  ON nne_login_challenges(user_id, status, expires_at);
