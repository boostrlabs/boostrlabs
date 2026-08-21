PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS nne_application_demographics (
  application_id TEXT PRIMARY KEY REFERENCES nne_access_applications(id) ON DELETE CASCADE,
  residence_country TEXT NOT NULL,
  origin_country TEXT,
  city TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nne_application_professions (
  application_id TEXT NOT NULL REFERENCES nne_access_applications(id) ON DELETE CASCADE,
  profession TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (application_id, profession)
);

CREATE INDEX IF NOT EXISTS idx_nne_application_professions_profession
  ON nne_application_professions(profession, application_id);

CREATE TABLE IF NOT EXISTS nne_user_professions (
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  profession TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, profession)
);

CREATE INDEX IF NOT EXISTS idx_nne_user_professions_profession
  ON nne_user_professions(profession, user_id);

CREATE TABLE IF NOT EXISTS nne_user_demographics (
  user_id TEXT PRIMARY KEY REFERENCES nne_users(id) ON DELETE CASCADE,
  residence_country TEXT NOT NULL,
  origin_country TEXT,
  city TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nne_identity_verifications (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES nne_access_applications(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES nne_users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('instagram', 'telegram', 'whatsapp')),
  external_identifier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'challenge_sent', 'verified', 'failed', 'revoked')),
  challenge_hash TEXT,
  challenge_expires_at TEXT,
  sent_at TEXT,
  verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (application_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nne_identity_verifications_application_channel
  ON nne_identity_verifications(application_id, channel)
  WHERE application_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nne_identity_verifications_user_channel
  ON nne_identity_verifications(user_id, channel)
  WHERE user_id IS NOT NULL;
