-- BOOSTR normal app backend surfaces.
-- Metadata only. No secrets. No payment processing.

ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN default_workspace_id TEXT;
ALTER TABLE users ADD COLUMN default_persona_id TEXT;
ALTER TABLE users ADD COLUMN language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'es'));
ALTER TABLE users ADD COLUMN timezone TEXT;
ALTER TABLE users ADD COLUMN theme TEXT NOT NULL DEFAULT 'platinum_dark';

CREATE INDEX IF NOT EXISTS idx_users_default_workspace
  ON users(default_workspace_id);

CREATE TABLE IF NOT EXISTS user_contact_methods (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT,
  contact_type TEXT NOT NULL CHECK (contact_type IN (
    'artist_email',
    'business_email',
    'personal_phone',
    'business_phone',
    'whatsapp',
    'instagram',
    'website',
    'smart_link'
  )),
  label TEXT,
  value TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'workspace', 'public_profile')),
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_contact_methods_user
  ON user_contact_methods(user_id);

CREATE INDEX IF NOT EXISTS idx_user_contact_methods_workspace
  ON user_contact_methods(workspace_id);

CREATE TABLE IF NOT EXISTS workspace_preferences (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL UNIQUE,
  default_mode TEXT,
  default_persona_id TEXT,
  default_language TEXT NOT NULL DEFAULT 'en' CHECK (default_language IN ('en', 'es')),
  card_density TEXT NOT NULL DEFAULT 'comfortable' CHECK (card_density IN ('compact', 'comfortable', 'expanded')),
  show_demo_labels INTEGER NOT NULL DEFAULT 1 CHECK (show_demo_labels IN (0, 1)),
  reduce_motion INTEGER NOT NULL DEFAULT 0 CHECK (reduce_motion IN (0, 1)),
  notification_preferences_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workspace_preferences_workspace
  ON workspace_preferences(workspace_id);

CREATE TABLE IF NOT EXISTS api_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT,
  label TEXT NOT NULL,
  prefix TEXT NOT NULL,
  token_hash TEXT,
  status TEXT NOT NULL DEFAULT 'future' CHECK (status IN ('future', 'active', 'revoked', 'disabled')),
  scopes_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user
  ON api_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_api_tokens_workspace
  ON api_tokens(workspace_id);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  workspace_id TEXT NOT NULL,
  card_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  priority INTEGER NOT NULL DEFAULT 50,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_workspace
  ON notifications(workspace_id);

CREATE INDEX IF NOT EXISTS idx_notifications_status
  ON notifications(status);

CREATE TABLE IF NOT EXISTS activity_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT,
  persona_id TEXT,
  card_id TEXT,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_events_workspace
  ON activity_events(workspace_id);

CREATE INDEX IF NOT EXISTS idx_activity_events_user
  ON activity_events(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_events_card
  ON activity_events(card_id);

CREATE INDEX IF NOT EXISTS idx_activity_events_type
  ON activity_events(event_type);
