PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS nne_channel_settings (
  channel TEXT PRIMARY KEY CHECK (channel IN ('whatsapp', 'telegram', 'instagram')),
  label TEXT NOT NULL,
  join_url TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused')),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nne_messaging_contacts (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'telegram')),
  external_user_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  nne_user_id TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  username TEXT,
  display_name TEXT,
  phone_hint TEXT,
  opted_in_at TEXT NOT NULL,
  last_message_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'unsubscribed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(platform, external_user_id)
);

CREATE INDEX IF NOT EXISTS idx_nne_messaging_contacts_platform_status
  ON nne_messaging_contacts(platform, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS nne_messaging_events (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'telegram')),
  external_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  external_user_id TEXT,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'ignored', 'failed')),
  error_code TEXT,
  UNIQUE(platform, external_event_id)
);

INSERT INTO nne_channel_settings (channel, label, join_url, description, status, updated_at)
VALUES
  ('whatsapp', 'WhatsApp Community', NULL, 'Avisos rápidos, conversación diaria y oportunidades que necesitan respuesta inmediata.', 'pending', datetime('now')),
  ('telegram', 'Telegram Channel', NULL, 'Briefs completos, archivos, anuncios de chambas y seguimiento de lanzamientos.', 'pending', datetime('now')),
  ('instagram', 'WESTDETRO MOB', NULL, 'Contenido visual, adelantos, referencias y anuncios cortos desde Instagram.', 'pending', datetime('now'))
ON CONFLICT(channel) DO UPDATE SET
  label = excluded.label,
  description = excluded.description,
  updated_at = datetime('now');

INSERT INTO nne_quests (
  id, type, platform, title, description, icon, reward_credits, reward_xp,
  status, cadence, verification_method, minimum_listen_seconds,
  pass_percentage, minimum_level, starts_at, ends_at, sort_order, created_at, updated_at
)
VALUES
  (
    'nne_join_whatsapp', 'community', 'WhatsApp', 'Entra a la WhatsApp Community',
    'Entra a la comunidad para recibir avisos rápidos, oportunidades y conversación diaria. Sube una captura donde se vea que ya entraste.\n\nAbrir contenido: https://nne.westdetro.com/join/whatsapp',
    'WA', 0.50, 25, 'published', 'once', 'manual', 0, 75, 1,
    '2026-08-20T00:00:00.000Z', NULL, 7, datetime('now'), datetime('now')
  ),
  (
    'nne_join_telegram', 'community', 'Telegram', 'Entra al canal de Telegram',
    'Entra al canal para recibir briefs completos, archivos y anuncios de chambas. Sube una captura donde se vea que ya entraste.\n\nAbrir contenido: https://nne.westdetro.com/join/telegram',
    'TG', 0.25, 20, 'published', 'once', 'manual', 0, 75, 1,
    '2026-08-20T00:00:00.000Z', NULL, 8, datetime('now'), datetime('now')
  ),
  (
    'nne_join_instagram_mob', 'community', 'Instagram', 'Entra a WESTDETRO MOB',
    'Entra al canal de Instagram para ver adelantos, referencias y drops visuales. Sube una captura donde se vea que ya entraste.\n\nAbrir contenido: https://nne.westdetro.com/join/instagram',
    'IG', 0.25, 20, 'published', 'once', 'manual', 0, 75, 1,
    '2026-08-20T00:00:00.000Z', NULL, 9, datetime('now'), datetime('now')
  )
ON CONFLICT(id) DO UPDATE SET
  platform = excluded.platform,
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  reward_credits = excluded.reward_credits,
  reward_xp = excluded.reward_xp,
  status = 'published',
  cadence = 'once',
  verification_method = 'manual',
  starts_at = excluded.starts_at,
  ends_at = NULL,
  sort_order = excluded.sort_order,
  updated_at = datetime('now');
