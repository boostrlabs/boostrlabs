PRAGMA foreign_keys = ON;

-- Idempotent intake for signed delivery-status webhooks from a distribution partner.
CREATE TABLE IF NOT EXISTS nne_distribution_provider_events (
  id TEXT PRIMARY KEY,
  provider_key TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  release_id TEXT NOT NULL REFERENCES nne_distribution_releases(id) ON DELETE CASCADE,
  provider_release_id TEXT,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  received_at TEXT NOT NULL,
  processed_at TEXT,
  UNIQUE(provider_key, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_nne_distribution_provider_events_release
  ON nne_distribution_provider_events(release_id, received_at DESC);
