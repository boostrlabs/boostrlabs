-- BOOSTR Labs minimal module data sources
-- No rows are seeded or backfilled by this migration.

CREATE TABLE IF NOT EXISTS smart_links (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  target_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_smart_links_workspace
  ON smart_links(workspace_id);

CREATE INDEX IF NOT EXISTS idx_smart_links_workspace_slug
  ON smart_links(workspace_id, slug);

CREATE TABLE IF NOT EXISTS artist_profiles (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'locked',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_artist_profiles_workspace
  ON artist_profiles(workspace_id);
