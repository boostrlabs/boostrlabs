PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS nne_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  avatar_url TEXT,
  email_verified_at TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_users_role_status
  ON nne_users(role, status);

CREATE TABLE IF NOT EXISTS nne_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked_at TEXT,
  ip TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_nne_sessions_user_status
  ON nne_sessions(user_id, status, expires_at);

CREATE TABLE IF NOT EXISTS nne_profiles (
  user_id TEXT PRIMARY KEY REFERENCES nne_users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  streak_days INTEGER NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  last_activity_date TEXT,
  nne_score INTEGER NOT NULL DEFAULT 0 CHECK (nne_score BETWEEN 0 AND 100),
  title TEXT NOT NULL DEFAULT 'New Wave',
  completed_quest_count INTEGER NOT NULL DEFAULT 0 CHECK (completed_quest_count >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nne_credit_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL CHECK (amount <> 0),
  kind TEXT NOT NULL CHECK (kind IN ('quest_reward', 'reward_redemption', 'admin_adjustment', 'referral_reward', 'launch_bonus')),
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  description TEXT NOT NULL,
  actor_user_id TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, kind, source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_nne_credit_transactions_user_created
  ON nne_credit_transactions(user_id, created_at DESC);

CREATE TRIGGER IF NOT EXISTS nne_credit_transactions_no_overdraft
BEFORE INSERT ON nne_credit_transactions
WHEN NEW.amount < 0
  AND (
    COALESCE(
      (SELECT SUM(amount) FROM nne_credit_transactions WHERE user_id = NEW.user_id),
      0
    ) + NEW.amount
  ) < 0
BEGIN
  SELECT RAISE(ABORT, 'insufficient_credits');
END;

CREATE TABLE IF NOT EXISTS nne_songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  listen_url TEXT NOT NULL,
  artwork_url TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nne_quests (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('social-proof', 'listening-trivia', 'referral', 'community')),
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '◆',
  reward_credits INTEGER NOT NULL CHECK (reward_credits >= 0),
  reward_xp INTEGER NOT NULL DEFAULT 100 CHECK (reward_xp >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'archived')),
  cadence TEXT NOT NULL DEFAULT 'once' CHECK (cadence IN ('once', 'daily', 'weekly')),
  verification_method TEXT NOT NULL DEFAULT 'manual' CHECK (verification_method IN ('manual', 'trivia', 'referral', 'automatic')),
  song_id TEXT REFERENCES nne_songs(id) ON DELETE SET NULL,
  minimum_listen_seconds INTEGER NOT NULL DEFAULT 0 CHECK (minimum_listen_seconds >= 0),
  pass_percentage INTEGER NOT NULL DEFAULT 75 CHECK (pass_percentage BETWEEN 0 AND 100),
  minimum_level INTEGER NOT NULL DEFAULT 1 CHECK (minimum_level >= 1),
  starts_at TEXT,
  ends_at TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_quests_public
  ON nne_quests(status, sort_order, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS nne_quest_attempts (
  id TEXT PRIMARY KEY,
  quest_id TEXT NOT NULL REFERENCES nne_quests(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL DEFAULT 'once',
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'pending', 'approved', 'rejected', 'completed', 'failed')),
  evidence_r2_key TEXT,
  evidence_content_type TEXT,
  evidence_original_name TEXT,
  evidence_note TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  unlock_at TEXT,
  score INTEGER,
  submitted_at TEXT,
  reviewed_at TEXT,
  reviewed_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(quest_id, user_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_nne_quest_attempts_review
  ON nne_quest_attempts(status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_nne_quest_attempts_user
  ON nne_quest_attempts(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS nne_trivia_questions (
  id TEXT PRIMARY KEY,
  song_id TEXT REFERENCES nne_songs(id) ON DELETE CASCADE,
  quest_id TEXT REFERENCES nne_quests(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  options_json TEXT NOT NULL CHECK (json_valid(options_json)),
  correct_option_id TEXT NOT NULL,
  explanation TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_trivia_questions_quest
  ON nne_trivia_questions(quest_id, status, sort_order);

CREATE TABLE IF NOT EXISTS nne_trivia_sessions (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL UNIQUE REFERENCES nne_quest_attempts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL REFERENCES nne_quests(id) ON DELETE RESTRICT,
  questions_json TEXT NOT NULL CHECK (json_valid(questions_json)),
  answer_key_json TEXT NOT NULL CHECK (json_valid(answer_key_json)),
  answers_json TEXT CHECK (answers_json IS NULL OR json_valid(answers_json)),
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'open', 'passed', 'failed', 'expired')),
  unlock_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  score INTEGER,
  created_at TEXT NOT NULL,
  submitted_at TEXT
);

CREATE TABLE IF NOT EXISTS nne_rewards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '◆',
  image_url TEXT,
  cost_credits INTEGER NOT NULL CHECK (cost_credits > 0),
  minimum_level INTEGER NOT NULL DEFAULT 1 CHECK (minimum_level >= 1),
  inventory INTEGER CHECK (inventory IS NULL OR inventory >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'archived')),
  fulfillment_notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_rewards_public
  ON nne_rewards(status, sort_order);

CREATE TABLE IF NOT EXISTS nne_reward_redemptions (
  id TEXT PRIMARY KEY,
  reward_id TEXT NOT NULL REFERENCES nne_rewards(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
  cost_credits INTEGER NOT NULL CHECK (cost_credits > 0),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'in_progress', 'fulfilled', 'cancelled')),
  fulfillment_note TEXT,
  handled_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_reward_redemptions_status
  ON nne_reward_redemptions(status, created_at);

CREATE TRIGGER IF NOT EXISTS nne_reward_redemptions_inventory
BEFORE INSERT ON nne_reward_redemptions
WHEN (
  SELECT inventory
  FROM nne_rewards
  WHERE id = NEW.reward_id
) IS NOT NULL
AND (
  SELECT inventory
  FROM nne_rewards
  WHERE id = NEW.reward_id
) <= (
  SELECT COUNT(*)
  FROM nne_reward_redemptions
  WHERE reward_id = NEW.reward_id
    AND status <> 'cancelled'
)
BEGIN
  SELECT RAISE(ABORT, 'reward_out_of_stock');
END;

CREATE TABLE IF NOT EXISTS nne_feed_events (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'admin')),
  source_type TEXT,
  source_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_feed_events_public
  ON nne_feed_events(visibility, created_at DESC);

CREATE TABLE IF NOT EXISTS nne_referrals (
  id TEXT PRIMARY KEY,
  referrer_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  referred_user_id TEXT UNIQUE REFERENCES nne_users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'registered', 'qualified', 'rewarded')),
  created_at TEXT NOT NULL,
  qualified_at TEXT,
  rewarded_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_nne_referrals_referrer
  ON nne_referrals(referrer_user_id, status);

CREATE TABLE IF NOT EXISTS nne_audit_events (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata_json TEXT CHECK (metadata_json IS NULL OR json_valid(metadata_json)),
  ip TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_audit_events_created
  ON nne_audit_events(created_at DESC);

CREATE TABLE IF NOT EXISTS nne_rate_limits (
  key TEXT NOT NULL,
  window_start TEXT NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 1 CHECK (hit_count >= 0),
  expires_at TEXT NOT NULL,
  PRIMARY KEY(key, window_start)
);

INSERT OR IGNORE INTO nne_songs (
  id, title, artist_name, listen_url, artwork_url, status, created_at, updated_at
) VALUES (
  'song_caption',
  'CAPTION',
  'NNE',
  'https://www.youtube.com/',
  NULL,
  'published',
  datetime('now'),
  datetime('now')
);

INSERT OR IGNORE INTO nne_quests (
  id, type, platform, title, description, icon, reward_credits, reward_xp,
  status, cadence, verification_method, song_id, minimum_listen_seconds,
  pass_percentage, minimum_level, sort_order, created_at, updated_at
) VALUES
  (
    'quest_instagram_gemese', 'social-proof', 'Instagram',
    'Comenta el Reel de Gemese',
    'Deja un comentario relacionado con el contenido del video.',
    '◉', 120, 120, 'published', 'once', 'manual', NULL, 0, 75, 1, 10,
    datetime('now'), datetime('now')
  ),
  (
    'quest_youtube_subscribe', 'social-proof', 'YouTube',
    'Suscríbete y activa la campana',
    'Suscríbete al canal oficial de NNE y activa las notificaciones.',
    '▶', 180, 180, 'published', 'once', 'manual', NULL, 0, 75, 1, 20,
    datetime('now'), datetime('now')
  ),
  (
    'quest_caption_listening', 'listening-trivia', 'Spotify / YouTube',
    'CAPTION — Listening Quest',
    'Escucha la canción y supera una trivia aleatoria sobre letras, voces y estructura.',
    '♫', 150, 150, 'published', 'daily', 'trivia', 'song_caption', 30, 75, 1, 30,
    datetime('now'), datetime('now')
  ),
  (
    'quest_tiktok_share', 'social-proof', 'TikTok',
    'Comparte WESTDETRO',
    'Comparte el video con una persona que conecte genuinamente con el movimiento.',
    '↗', 150, 150, 'published', 'daily', 'manual', NULL, 0, 75, 1, 40,
    datetime('now'), datetime('now')
  ),
  (
    'quest_referral_artist', 'referral', 'Referral',
    'Invita a un artista',
    'Comparte tu enlace. El reward se acredita cuando la persona complete el registro.',
    '+', 500, 500, 'published', 'weekly', 'referral', NULL, 0, 75, 1, 50,
    datetime('now'), datetime('now')
  );

INSERT OR IGNORE INTO nne_trivia_questions (
  id, song_id, quest_id, prompt, options_json, correct_option_id,
  explanation, status, sort_order, created_at, updated_at
) VALUES
  (
    'caption_q1', 'song_caption', 'quest_caption_listening',
    '¿Qué artista entra primero después del coro?',
    '[{"id":"a","text":"Janko"},{"id":"b","text":"Gemese"},{"id":"c","text":"Xiam"},{"id":"d","text":"Entran juntos"}]',
    'a', NULL, 'active', 10, datetime('now'), datetime('now')
  ),
  (
    'caption_q2', 'song_caption', 'quest_caption_listening',
    '¿Cuál opción describe mejor el cambio del beat antes del segundo verso?',
    '[{"id":"a","text":"Se queda completamente sin drums"},{"id":"b","text":"Entra un cambio de bajo y percusión"},{"id":"c","text":"Aparece una guitarra acústica"},{"id":"d","text":"La canción termina"}]',
    'b', NULL, 'active', 20, datetime('now'), datetime('now')
  ),
  (
    'caption_q3', 'song_caption', 'quest_caption_listening',
    '¿Qué elemento se repite con más claridad en el hook?',
    '[{"id":"a","text":"Una frase corta"},{"id":"b","text":"Un silbido"},{"id":"c","text":"Una llamada telefónica"},{"id":"d","text":"Un sample hablado largo"}]',
    'a', NULL, 'active', 30, datetime('now'), datetime('now')
  ),
  (
    'caption_q4', 'song_caption', 'quest_caption_listening',
    '¿Cuál artista hace la última entrada vocal completa?',
    '[{"id":"a","text":"Janko"},{"id":"b","text":"Gemese"},{"id":"c","text":"Xiam"},{"id":"d","text":"82NGEL"}]',
    'b', NULL, 'active', 40, datetime('now'), datetime('now')
  );

INSERT OR IGNORE INTO nne_rewards (
  id, name, description, icon, cost_credits, minimum_level, inventory,
  status, sort_order, created_at, updated_at
) VALUES
  ('reward_feedback', 'Feedback de canción', 'Revisión privada de estructura, mezcla y estrategia.', '🎧', 1200, 1, NULL, 'published', 10, datetime('now'), datetime('now')),
  ('reward_master', 'Master Stereo', 'Master profesional listo para distribución.', '🎚', 5000, 10, NULL, 'published', 20, datetime('now'), datetime('now')),
  ('reward_vocal_mix', 'Mezcla vocal', 'Voces procesadas, balanceadas y listas para release.', '🎙', 6500, 18, NULL, 'published', 30, datetime('now'), datetime('now')),
  ('reward_beat_lease', 'Beat Lease', 'Licencia de uso para un beat seleccionado.', '🎹', 7500, 15, NULL, 'published', 40, datetime('now'), datetime('now')),
  ('reward_cover', 'Cover Art', 'Diseño visual premium para un lanzamiento.', '◆', 8500, 22, NULL, 'published', 50, datetime('now'), datetime('now')),
  ('reward_exclusive', 'Beat Exclusivo', 'Producción exclusiva realizada por NNE.', '★', 15000, 30, NULL, 'published', 60, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO nne_feed_events (
  id, user_id, event_type, message, visibility, source_type, source_id, created_at
) VALUES (
  'feed_nne_rewards_launch',
  NULL,
  'reward_catalog_published',
  'El catálogo inicial de rewards ya está disponible.',
  'public',
  'system',
  'mvp_launch',
  datetime('now')
);
