-- BOOSTR Labs workspace module access
-- No rows are seeded or backfilled by this migration.

CREATE TABLE IF NOT EXISTS workspace_modules (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('active', 'pending', 'locked', 'paused')),
  activated_at TEXT,
  activated_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workspace_modules_workspace_module
  ON workspace_modules(workspace_id, module_id);
