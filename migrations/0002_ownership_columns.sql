-- BOOSTR Labs ownership columns
-- Existing rows are intentionally not backfilled.

ALTER TABLE leads ADD COLUMN workspace_id TEXT;
ALTER TABLE leads ADD COLUMN created_by_user_id TEXT;

ALTER TABLE audit_submissions ADD COLUMN workspace_id TEXT;

ALTER TABLE lead_events ADD COLUMN workspace_id TEXT;

-- orders.workspace_id already exists in 0001_boostr_core.sql.
