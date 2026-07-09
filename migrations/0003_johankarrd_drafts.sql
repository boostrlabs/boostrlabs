CREATE TABLE IF NOT EXISTS johankarrd_drafts (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_johankarrd_drafts_owner ON johankarrd_drafts(owner);
