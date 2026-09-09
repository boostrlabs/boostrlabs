CREATE TABLE IF NOT EXISTS agent_credentials(
  user_id TEXT PRIMARY KEY,
  public_slug TEXT NOT NULL UNIQUE,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','INACTIVE')),
  active_from TEXT NOT NULL,
  active_to TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_credentials_slug ON agent_credentials(public_slug);
