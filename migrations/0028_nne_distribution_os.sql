PRAGMA foreign_keys = ON;

-- NNE Distribution OS is deliberately isolated from the community-credit economy.
-- NNE Credits are promotional units; monetary royalties will use a separate ledger.
CREATE TABLE IF NOT EXISTS nne_distribution_artists (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  country_code TEXT,
  primary_genre TEXT,
  instagram_handle TEXT,
  spotify_artist_id TEXT,
  apple_music_artist_id TEXT,
  owner_user_id TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nne_distribution_access (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
  artist_id TEXT REFERENCES nne_distribution_artists(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('artist', 'manager', 'label_admin', 'reviewer', 'finance')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, artist_id, role)
);

CREATE TABLE IF NOT EXISTS nne_distribution_releases (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  artist_id TEXT NOT NULL REFERENCES nne_distribution_artists(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  release_type TEXT NOT NULL DEFAULT 'single' CHECK (release_type IN ('single', 'ep', 'album')),
  version_title TEXT,
  label_name TEXT NOT NULL DEFAULT 'NOSOTROSNOELLOS NNE',
  catalog_number TEXT,
  upc TEXT,
  primary_genre TEXT,
  secondary_genre TEXT,
  language_code TEXT NOT NULL DEFAULT 'es',
  original_release_date TEXT,
  release_date TEXT,
  copyright_year INTEGER,
  c_line TEXT,
  p_line TEXT,
  territories_json TEXT NOT NULL DEFAULT '["WORLDWIDE"]' CHECK (json_valid(territories_json)),
  stores_json TEXT NOT NULL DEFAULT '["spotify","apple_music","youtube_music","amazon_music","deezer","tidal","tiktok","meta"]' CHECK (json_valid(stores_json)),
  explicit_content INTEGER NOT NULL DEFAULT 0 CHECK (explicit_content IN (0,1)),
  artwork_object_key TEXT,
  artwork_content_type TEXT,
  artwork_etag TEXT,
  preview_artwork_url TEXT,
  rights_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (rights_confirmed IN (0,1)),
  agreement_accepted INTEGER NOT NULL DEFAULT 0 CHECK (agreement_accepted IN (0,1)),
  agreement_version TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','in_review','changes_requested','approved','packaged','delivered','live','delivered_demo','live_demo','takedown_requested','taken_down'
  )),
  provider_key TEXT NOT NULL DEFAULT 'nne_sandbox',
  provider_release_id TEXT,
  review_note TEXT,
  submitted_at TEXT,
  reviewed_at TEXT,
  reviewed_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_distribution_releases_owner
  ON nne_distribution_releases(owner_user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_nne_distribution_releases_status
  ON nne_distribution_releases(status, release_date, updated_at DESC);

CREATE TABLE IF NOT EXISTS nne_distribution_tracks (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL REFERENCES nne_distribution_releases(id) ON DELETE CASCADE,
  disc_number INTEGER NOT NULL DEFAULT 1 CHECK (disc_number > 0),
  track_number INTEGER NOT NULL CHECK (track_number > 0),
  title TEXT NOT NULL,
  version_title TEXT,
  artist_display TEXT NOT NULL,
  isrc TEXT,
  language_code TEXT NOT NULL DEFAULT 'es',
  primary_genre TEXT,
  explicit_content INTEGER NOT NULL DEFAULT 0 CHECK (explicit_content IN (0,1)),
  instrumental INTEGER NOT NULL DEFAULT 0 CHECK (instrumental IN (0,1)),
  preview_start_seconds INTEGER NOT NULL DEFAULT 0 CHECK (preview_start_seconds >= 0),
  master_object_key TEXT,
  master_content_type TEXT,
  master_original_name TEXT,
  master_size_bytes INTEGER,
  master_etag TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(release_id, disc_number, track_number)
);

CREATE INDEX IF NOT EXISTS idx_nne_distribution_tracks_release
  ON nne_distribution_tracks(release_id, disc_number, track_number);

CREATE TABLE IF NOT EXISTS nne_distribution_contributors (
  id TEXT PRIMARY KEY,
  track_id TEXT NOT NULL REFERENCES nne_distribution_tracks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('primary_artist','featured_artist','producer','songwriter','composer','publisher','mix_engineer','mastering_engineer')),
  ipi_cae TEXT,
  pro_name TEXT,
  publisher_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_distribution_contributors_track
  ON nne_distribution_contributors(track_id, role);

CREATE TABLE IF NOT EXISTS nne_distribution_splits (
  id TEXT PRIMARY KEY,
  track_id TEXT NOT NULL REFERENCES nne_distribution_tracks(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  participant_email TEXT,
  role TEXT NOT NULL DEFAULT 'master_owner',
  percentage_bps INTEGER NOT NULL CHECK (percentage_bps BETWEEN 1 AND 10000),
  payee_user_id TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','disputed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_distribution_splits_track
  ON nne_distribution_splits(track_id, status);

CREATE TABLE IF NOT EXISTS nne_distribution_agreements (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL REFERENCES nne_distribution_releases(id) ON DELETE RESTRICT,
  user_id TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  agreement_version TEXT NOT NULL,
  rights_attestation TEXT NOT NULL,
  accepted_ip TEXT,
  accepted_user_agent TEXT,
  accepted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nne_distribution_delivery_jobs (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL REFERENCES nne_distribution_releases(id) ON DELETE RESTRICT,
  provider_key TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','sending','accepted','rejected','failed','cancelled')),
  package_object_key TEXT,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  response_json TEXT CHECK (response_json IS NULL OR json_valid(response_json)),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error TEXT,
  created_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  accepted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_nne_distribution_jobs_release
  ON nne_distribution_delivery_jobs(release_id, created_at DESC);

CREATE TABLE IF NOT EXISTS nne_distribution_events (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL REFERENCES nne_distribution_releases(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  metadata_json TEXT CHECK (metadata_json IS NULL OR json_valid(metadata_json)),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_distribution_events_release
  ON nne_distribution_events(release_id, created_at DESC);

-- Artist/team onboarding is separate from the public community referral system.
-- Tokens are stored only as SHA-256 hashes; the plaintext exists only in the invite URL.
CREATE TABLE IF NOT EXISTS nne_distribution_invites (
  id TEXT PRIMARY KEY,
  artist_id TEXT NOT NULL REFERENCES nne_distribution_artists(id) ON DELETE CASCADE,
  intended_email TEXT,
  intended_username TEXT,
  role TEXT NOT NULL DEFAULT 'artist' CHECK (role IN ('artist','manager')),
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','accepted','revoked','expired')),
  expires_at TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
  accepted_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  accepted_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_distribution_invites_artist
  ON nne_distribution_invites(artist_id, status, expires_at);

ALTER TABLE nne_access_applications ADD COLUMN distribution_invite_id TEXT;

-- Provider records contain capability/configuration state only. API credentials remain
-- encrypted Cloudflare secrets and are never written to D1 or returned to the client.
CREATE TABLE IF NOT EXISTS nne_distribution_providers (
  provider_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('sandbox','white_label','direct_deal')),
  status TEXT NOT NULL CHECK (status IN ('sandbox','configuration_required','connected','paused')),
  capabilities_json TEXT NOT NULL DEFAULT '{}'
    CHECK (json_valid(capabilities_json)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Royalty accounting uses integer micros (1 currency unit = 1,000,000 micros), never
-- floating-point values. It is deliberately isolated from promotional NNE Credits.
CREATE TABLE IF NOT EXISTS nne_distribution_statements (
  id TEXT PRIMARY KEY,
  provider_key TEXT NOT NULL,
  external_statement_id TEXT,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  currency TEXT NOT NULL,
  gross_micros INTEGER NOT NULL DEFAULT 0,
  fee_micros INTEGER NOT NULL DEFAULT 0,
  net_micros INTEGER NOT NULL DEFAULT 0,
  line_count INTEGER NOT NULL DEFAULT 0,
  source_object_key TEXT,
  status TEXT NOT NULL DEFAULT 'imported' CHECK (status IN ('imported','reconciled','void')),
  imported_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  imported_at TEXT NOT NULL,
  UNIQUE(provider_key, external_statement_id)
);

CREATE TABLE IF NOT EXISTS nne_distribution_royalty_lines (
  id TEXT PRIMARY KEY,
  statement_id TEXT NOT NULL REFERENCES nne_distribution_statements(id) ON DELETE CASCADE,
  artist_id TEXT NOT NULL REFERENCES nne_distribution_artists(id) ON DELETE RESTRICT,
  release_id TEXT REFERENCES nne_distribution_releases(id) ON DELETE SET NULL,
  track_id TEXT REFERENCES nne_distribution_tracks(id) ON DELETE SET NULL,
  payee_user_id TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  dsp TEXT NOT NULL,
  territory TEXT,
  usage_type TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  gross_micros INTEGER NOT NULL DEFAULT 0,
  fee_micros INTEGER NOT NULL DEFAULT 0,
  net_micros INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  occurred_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_distribution_royalties_artist
  ON nne_distribution_royalty_lines(artist_id, currency, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nne_distribution_royalties_release
  ON nne_distribution_royalty_lines(release_id, track_id);

CREATE TABLE IF NOT EXISTS nne_distribution_payouts (
  id TEXT PRIMARY KEY,
  artist_id TEXT NOT NULL REFERENCES nne_distribution_artists(id) ON DELETE RESTRICT,
  payee_user_id TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  currency TEXT NOT NULL,
  amount_micros INTEGER NOT NULL CHECK (amount_micros > 0),
  method TEXT NOT NULL,
  destination_hint TEXT,
  external_payout_id TEXT,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','approved','processing','paid','failed','cancelled')),
  requested_at TEXT NOT NULL,
  reviewed_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  reviewed_at TEXT,
  paid_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_nne_distribution_payouts_artist
  ON nne_distribution_payouts(artist_id, currency, requested_at DESC);

INSERT INTO nne_distribution_artists (
  id, slug, name, country_code, primary_genre, instagram_handle, status, created_at, updated_at
) VALUES
  ('nne_dist_artist_janko','janko-diorr','Janko Diorr','VE','Latin Urban','jankodiorr','active',datetime('now'),datetime('now')),
  ('nne_dist_artist_gemese','gemese','Gemese','VE','Latin Urban','gemeseoficial','active',datetime('now'),datetime('now')),
  ('nne_dist_artist_xiam','xiam','Xiam','VE','Latin Urban','xiamoficial','active',datetime('now'),datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  name=excluded.name, country_code=excluded.country_code, primary_genre=excluded.primary_genre,
  instagram_handle=excluded.instagram_handle, updated_at=datetime('now');

INSERT INTO nne_distribution_providers (
  provider_key,display_name,mode,status,capabilities_json,created_at,updated_at
) VALUES (
  'nne_sandbox','NNE Sandbox','sandbox','sandbox',
  '{"catalog_delivery":true,"takedowns":true,"royalty_import":true,"upc_assignment":false,"isrc_assignment":false}',
  datetime('now'),datetime('now')
) ON CONFLICT(provider_key) DO UPDATE SET
  display_name=excluded.display_name, mode=excluded.mode,
  capabilities_json=excluded.capabilities_json, updated_at=datetime('now');

INSERT OR IGNORE INTO nne_distribution_access (
  id, user_id, artist_id, role, status, created_at, updated_at
)
SELECT 'nne_dist_access_janko_' || id, id, 'nne_dist_artist_janko', 'label_admin', 'active', datetime('now'), datetime('now')
FROM nne_users WHERE username='jankodiorr' LIMIT 1;

INSERT OR IGNORE INTO nne_distribution_access (
  id, user_id, artist_id, role, status, created_at, updated_at
)
SELECT 'nne_dist_access_gemese_' || id, id, 'nne_dist_artist_gemese', 'artist', 'active', datetime('now'), datetime('now')
FROM nne_users WHERE username IN ('gemese','gemeseoficial') LIMIT 1;

INSERT OR IGNORE INTO nne_distribution_access (
  id, user_id, artist_id, role, status, created_at, updated_at
)
SELECT 'nne_dist_access_xiam_' || id, id, 'nne_dist_artist_xiam', 'artist', 'active', datetime('now'), datetime('now')
FROM nne_users WHERE username IN ('xiam','xiamoficial') LIMIT 1;

INSERT OR IGNORE INTO nne_distribution_releases (
  id, owner_user_id, artist_id, title, release_type, label_name, primary_genre,
  language_code, copyright_year, c_line, p_line, preview_artwork_url, status,
  provider_key, created_at, updated_at
)
SELECT
  'nne_dist_release_westdetro',
  (SELECT id FROM nne_users WHERE username='jankodiorr' LIMIT 1),
  'nne_dist_artist_janko','WESTDETRO','album','NOSOTROSNOELLOS NNE','Latin Urban',
  'es',2026,'© 2026 NOSOTROSNOELLOS NNE LLC','℗ 2026 NOSOTROSNOELLOS NNE LLC',
  '/distribution/westdetro-cover.webp','draft','nne_sandbox',datetime('now'),datetime('now');

INSERT OR IGNORE INTO nne_distribution_tracks (
  id, release_id, track_number, title, artist_display, language_code, primary_genre, created_at, updated_at
) VALUES
  ('nne_dist_westdetro_01','nne_dist_release_westdetro',1,'WESTDETRO (INTRO)','Janko Diorr','es','Latin Urban',datetime('now'),datetime('now')),
  ('nne_dist_westdetro_02','nne_dist_release_westdetro',2,'PUNTO G','Janko Diorr','es','Latin Urban',datetime('now'),datetime('now')),
  ('nne_dist_westdetro_03','nne_dist_release_westdetro',3,'CAPTION','Janko Diorr feat. Gemese','es','Latin Urban',datetime('now'),datetime('now')),
  ('nne_dist_westdetro_04','nne_dist_release_westdetro',4,'PERÍMETRO','Janko Diorr feat. Prieto','es','Latin Urban',datetime('now'),datetime('now')),
  ('nne_dist_westdetro_05','nne_dist_release_westdetro',5,'DISTRICT','Janko Diorr feat. Dry, Gemese & Xiam','es','Latin Urban',datetime('now'),datetime('now')),
  ('nne_dist_westdetro_06','nne_dist_release_westdetro',6,'BABY MAMA','Janko Diorr feat. 82NGEL','es','Latin Urban',datetime('now'),datetime('now')),
  ('nne_dist_westdetro_07','nne_dist_release_westdetro',7,'ACAPE','Janko Diorr feat. Riguall, Xiam & Gemese','es','Latin Urban',datetime('now'),datetime('now')),
  ('nne_dist_westdetro_08','nne_dist_release_westdetro',8,'LATE NIGHT','Janko Diorr','es','Latin Urban',datetime('now'),datetime('now')),
  ('nne_dist_westdetro_09','nne_dist_release_westdetro',9,'BBY DEMON','Janko Diorr','es','Latin Urban',datetime('now'),datetime('now')),
  ('nne_dist_westdetro_10','nne_dist_release_westdetro',10,'BBSITA FLEX','Janko Diorr feat. Caci','es','Latin Urban',datetime('now'),datetime('now')),
  ('nne_dist_westdetro_11','nne_dist_release_westdetro',11,'SIN FORZAR FREESTYLE (INTERLUDE)','Janko Diorr','es','Latin Urban',datetime('now'),datetime('now')),
  ('nne_dist_westdetro_12','nne_dist_release_westdetro',12,'MODELO DE TV','Janko Diorr feat. Xiam','es','Latin Urban',datetime('now'),datetime('now')),
  ('nne_dist_westdetro_13','nne_dist_release_westdetro',13,'POPPI','Janko Diorr','es','Latin Urban',datetime('now'),datetime('now')),
  ('nne_dist_westdetro_14','nne_dist_release_westdetro',14,'¿CUÁNDO PA’ DARTE?','Janko Diorr feat. Angel Colla & Gemese','es','Latin Urban',datetime('now'),datetime('now')),
  ('nne_dist_westdetro_15','nne_dist_release_westdetro',15,'ES MALA PERO ASÍ ME GUSTA','Janko Diorr','es','Latin Urban',datetime('now'),datetime('now')),
  ('nne_dist_westdetro_16','nne_dist_release_westdetro',16,'DORI','Janko Diorr feat. 82NGEL','es','Latin Urban',datetime('now'),datetime('now'));

-- Production credits captured from the official tracklist. Songwriter/master splits
-- remain intentionally unconfirmed until every collaborator accepts them.
INSERT OR IGNORE INTO nne_distribution_contributors (id,track_id,name,role,created_at,updated_at) VALUES
  ('wd01_prod_janko','nne_dist_westdetro_01','Janko Diorr','producer',datetime('now'),datetime('now')),
  ('wd01_prod_krixn','nne_dist_westdetro_01','Krixn','producer',datetime('now'),datetime('now')),
  ('wd02_prod_janko','nne_dist_westdetro_02','Janko Diorr','producer',datetime('now'),datetime('now')),
  ('wd03_prod_janko','nne_dist_westdetro_03','Janko Diorr','producer',datetime('now'),datetime('now')),
  ('wd04_prod_janko','nne_dist_westdetro_04','Janko Diorr','producer',datetime('now'),datetime('now')),
  ('wd04_prod_prieto','nne_dist_westdetro_04','Prieto','producer',datetime('now'),datetime('now')),
  ('wd05_prod_janko','nne_dist_westdetro_05','Janko Diorr','producer',datetime('now'),datetime('now')),
  ('wd06_prod_janko','nne_dist_westdetro_06','Janko Diorr','producer',datetime('now'),datetime('now')),
  ('wd07_prod_janko','nne_dist_westdetro_07','Janko Diorr','producer',datetime('now'),datetime('now')),
  ('wd08_prod_janko','nne_dist_westdetro_08','Janko Diorr','producer',datetime('now'),datetime('now')),
  ('wd09_prod_janko','nne_dist_westdetro_09','Janko Diorr','producer',datetime('now'),datetime('now')),
  ('wd10_prod_janko','nne_dist_westdetro_10','Janko Diorr','producer',datetime('now'),datetime('now')),
  ('wd11_prod_janko','nne_dist_westdetro_11','Janko Diorr','producer',datetime('now'),datetime('now')),
  ('wd12_prod_janko','nne_dist_westdetro_12','Janko Diorr','producer',datetime('now'),datetime('now')),
  ('wd13_prod_janko','nne_dist_westdetro_13','Janko Diorr','producer',datetime('now'),datetime('now')),
  ('wd14_prod_janko','nne_dist_westdetro_14','Janko Diorr','producer',datetime('now'),datetime('now')),
  ('wd14_prod_krixn','nne_dist_westdetro_14','Krixn','producer',datetime('now'),datetime('now')),
  ('wd15_prod_janko','nne_dist_westdetro_15','Janko Diorr','producer',datetime('now'),datetime('now')),
  ('wd16_prod_janko','nne_dist_westdetro_16','Janko Diorr','producer',datetime('now'),datetime('now')),
  ('wd16_prod_krixn','nne_dist_westdetro_16','Krixn','producer',datetime('now'),datetime('now'));

INSERT OR IGNORE INTO nne_distribution_events (
  id, release_id, actor_user_id, event_type, to_status, metadata_json, created_at
) VALUES (
  'nne_dist_event_westdetro_created','nne_dist_release_westdetro',NULL,
  'release.pilot_created','draft','{"source":"official_tracklist","pilot":true}',datetime('now')
);
