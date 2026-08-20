PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS nne_meta_contacts (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'whatsapp')),
  external_user_id TEXT NOT NULL,
  username TEXT,
  display_name TEXT,
  phone_hint TEXT,
  nne_user_id TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  consent_status TEXT NOT NULL DEFAULT 'unknown' CHECK (consent_status IN ('unknown', 'opted_in', 'opted_out')),
  consent_source TEXT,
  consented_at TEXT,
  opted_out_at TEXT,
  last_inbound_at TEXT,
  last_outbound_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(platform, external_user_id)
);

CREATE INDEX IF NOT EXISTS idx_nne_meta_contacts_platform_consent
  ON nne_meta_contacts(platform, consent_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS nne_meta_events (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'whatsapp')),
  external_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_user_id TEXT,
  external_thread_id TEXT,
  external_media_id TEXT,
  external_comment_id TEXT,
  message_text TEXT,
  payload_json TEXT CHECK (payload_json IS NULL OR json_valid(payload_json)),
  received_at TEXT NOT NULL,
  processed_at TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'ignored', 'failed')),
  error_code TEXT,
  UNIQUE(platform, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_nne_meta_events_platform_status
  ON nne_meta_events(platform, status, received_at DESC);

CREATE TABLE IF NOT EXISTS nne_meta_keyword_rules (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'whatsapp', 'all')),
  keyword TEXT NOT NULL COLLATE NOCASE,
  match_type TEXT NOT NULL DEFAULT 'contains' CHECK (match_type IN ('contains', 'exact')),
  public_reply TEXT,
  private_reply TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  priority INTEGER NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(platform, keyword)
);

INSERT INTO nne_meta_keyword_rules (
  id, platform, keyword, match_type, public_reply, private_reply, status, priority, created_at, updated_at
) VALUES
  ('meta_rule_nne', 'all', 'nne', 'contains',
   'Te mandamos la info por privado.',
   'NNE × WESTDETRO es una comunidad para artistas. Cumple Chambas, gana NNE Credits y XP y usa tus Credits para conseguir rewards. Entra aquí: https://nne.westdetro.com',
   'active', 10, datetime('now'), datetime('now')),
  ('meta_rule_chamba', 'all', 'chamba', 'contains',
   'Te mandamos cómo funciona por privado.',
   'Las Chambas son tareas cortas dentro de NNE × WESTDETRO. Envías evidencia, un reviewer la aprueba y recibes NNE Credits + XP. Empieza aquí: https://nne.westdetro.com',
   'active', 20, datetime('now'), datetime('now')),
  ('meta_rule_link', 'all', 'link', 'contains',
   'Te lo mando por privado.',
   'Este es el acceso oficial a NNE × WESTDETRO: https://nne.westdetro.com',
   'active', 30, datetime('now'), datetime('now')),
  ('meta_rule_info', 'all', 'info', 'contains',
   'Te mandamos toda la info por privado.',
   'NNE × WESTDETRO: de artistas haciéndolo real, para artistas que quieren hacerlo real. Registro e información: https://nne.westdetro.com',
   'active', 40, datetime('now'), datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  public_reply = excluded.public_reply,
  private_reply = excluded.private_reply,
  status = excluded.status,
  priority = excluded.priority,
  updated_at = datetime('now');
