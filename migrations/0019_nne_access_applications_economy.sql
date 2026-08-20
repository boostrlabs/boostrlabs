PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS nne_access_applications (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  artist_role TEXT NOT NULL CHECK (artist_role IN ('artist', 'producer', 'engineer', 'designer', 'manager', 'fan', 'other')),
  country TEXT NOT NULL,
  city TEXT,
  instagram_handle TEXT,
  whatsapp_contact TEXT,
  telegram_handle TEXT,
  primary_contact TEXT NOT NULL CHECK (primary_contact IN ('instagram', 'whatsapp', 'telegram')),
  bio TEXT NOT NULL,
  referral_code TEXT COLLATE NOCASE,
  promo_code TEXT COLLATE NOCASE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note TEXT,
  reviewed_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  reviewed_at TEXT,
  approved_user_id TEXT UNIQUE REFERENCES nne_users(id) ON DELETE SET NULL,
  ip TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_access_applications_review
  ON nne_access_applications(status, created_at);

CREATE TABLE IF NOT EXISTS nne_promo_campaigns (
  code TEXT PRIMARY KEY COLLATE NOCASE,
  name TEXT NOT NULL,
  reward_credits INTEGER NOT NULL CHECK (reward_credits > 0),
  max_redemptions INTEGER CHECK (max_redemptions IS NULL OR max_redemptions > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended')),
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nne_promo_claims (
  id TEXT PRIMARY KEY,
  campaign_code TEXT NOT NULL COLLATE NOCASE REFERENCES nne_promo_campaigns(code) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
  application_id TEXT NOT NULL UNIQUE REFERENCES nne_access_applications(id) ON DELETE RESTRICT,
  reward_credits INTEGER NOT NULL CHECK (reward_credits > 0),
  created_at TEXT NOT NULL,
  UNIQUE(campaign_code, user_id)
);

INSERT OR IGNORE INTO nne_promo_campaigns (
  code, name, reward_credits, max_redemptions, status, starts_at, ends_at, created_at, updated_at
) VALUES (
  'PRIMEROS50', 'Primeros 50 miembros aprobados', 10, 50, 'active',
  NULL, NULL, datetime('now'), datetime('now')
);

ALTER TABLE nne_rewards ADD COLUMN reward_type TEXT NOT NULL DEFAULT 'physical'
  CHECK (reward_type IN ('physical', 'service', 'digital'));
ALTER TABLE nne_rewards ADD COLUMN sale_cost_credits INTEGER
  CHECK (sale_cost_credits IS NULL OR sale_cost_credits > 0);
ALTER TABLE nne_rewards ADD COLUMN sale_starts_at TEXT;
ALTER TABLE nne_rewards ADD COLUMN sale_ends_at TEXT;

INSERT OR IGNORE INTO nne_rewards (
  id, name, description, icon, image_url, cost_credits, minimum_level, inventory,
  status, fulfillment_notes, sort_order, reward_type, sale_cost_credits,
  sale_starts_at, sale_ends_at, created_at, updated_at
) VALUES
  (
    's1_reward_focusrite_solo_3rd', 'Focusrite Scarlett Solo 3rd Gen',
    'Interfaz de audio para grabar voces e instrumentos. Oferta de lanzamiento por tiempo limitado.',
    'FS', NULL, 70, 1, NULL, 'published', 'Entrega coordinada por el equipo NNE × WESTDETRO.',
    72, 'physical', 56, '2026-08-20T04:00:00.000Z', '2026-09-21T04:00:00.000Z',
    datetime('now'), datetime('now')
  ),
  (
    's1_reward_at2020', 'Audio-Technica AT2020',
    'Micrófono de condensador para construir tu espacio de grabación.',
    'MIC', NULL, 80, 1, NULL, 'published', 'Entrega coordinada por el equipo NNE × WESTDETRO.',
    73, 'physical', NULL, NULL, NULL, datetime('now'), datetime('now')
  ),
  (
    's1_reward_xlr_cable', 'Cable XLR',
    'Cable XLR para conectar tu micrófono a la interfaz.',
    'XLR', NULL, 10, 1, NULL, 'published', 'Modelo y longitud sujetos a disponibilidad.',
    74, 'physical', NULL, NULL, NULL, datetime('now'), datetime('now')
  );

UPDATE nne_rewards
SET reward_type = 'service'
WHERE id IN ('s1_reward_creator_review', 's1_reward_westdetro_beat', 's1_reward_production');
