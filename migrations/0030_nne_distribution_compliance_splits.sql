-- Payout compliance, executable split sheets, deal models, and provider-safe TikTok clips.

CREATE TABLE IF NOT EXISTS nne_distribution_payee_profiles (
  id TEXT PRIMARY KEY,
  artist_id TEXT NOT NULL UNIQUE REFERENCES nne_distribution_artists(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('individual','business')),
  tax_residency_country TEXT NOT NULL,
  address_country TEXT NOT NULL,
  tax_form_type TEXT NOT NULL CHECK (tax_form_type IN ('W-9','W-8BEN','W-8BEN-E','manual-review')),
  tax_status TEXT NOT NULL DEFAULT 'required'
    CHECK (tax_status IN ('required','submitted','verified','rejected','expired')),
  tax_document_object_key TEXT,
  tax_document_hash TEXT,
  payout_method TEXT,
  payout_destination_hint TEXT,
  review_note TEXT,
  reviewed_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  reviewed_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_distribution_payees_status
  ON nne_distribution_payee_profiles(tax_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS nne_distribution_split_agreements (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL REFERENCES nne_distribution_releases(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','ready','sent','partially_signed','completed','declined','voided','failed')),
  provider TEXT NOT NULL DEFAULT 'nne_local' CHECK (provider IN ('nne_local','docusign')),
  pdf_object_key TEXT NOT NULL,
  executed_pdf_object_key TEXT,
  content_hash TEXT NOT NULL,
  external_envelope_id TEXT,
  external_status TEXT,
  created_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  sent_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(release_id, version)
);

CREATE INDEX IF NOT EXISTS idx_nne_distribution_split_agreements_release
  ON nne_distribution_split_agreements(release_id, created_at DESC);

CREATE TABLE IF NOT EXISTS nne_distribution_split_signers (
  id TEXT PRIMARY KEY,
  agreement_id TEXT NOT NULL REFERENCES nne_distribution_split_agreements(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  role TEXT NOT NULL,
  percentage_bps INTEGER NOT NULL CHECK (percentage_bps BETWEEN 1 AND 10000),
  routing_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','delivered','signed','declined')),
  external_recipient_id TEXT,
  signed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nne_distribution_split_signers_agreement
  ON nne_distribution_split_signers(agreement_id, routing_order);

CREATE TABLE IF NOT EXISTS nne_distribution_esign_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  agreement_id TEXT REFERENCES nne_distribution_split_agreements(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  received_at TEXT NOT NULL,
  processed_at TEXT,
  UNIQUE(provider, external_event_id)
);

CREATE TABLE IF NOT EXISTS nne_distribution_tiktok_clip_requests (
  id TEXT PRIMARY KEY,
  track_id TEXT NOT NULL REFERENCES nne_distribution_tracks(id) ON DELETE CASCADE,
  start_seconds INTEGER NOT NULL CHECK (start_seconds >= 0),
  duration_seconds INTEGER NOT NULL DEFAULT 60 CHECK (duration_seconds BETWEEN 5 AND 60),
  label TEXT,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','provider_review','approved','rejected','delivered')),
  provider_reference TEXT,
  created_by TEXT REFERENCES nne_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE nne_distribution_releases ADD COLUMN deal_model TEXT NOT NULL DEFAULT 'fee_100'
  CHECK (deal_model IN ('fee_100','scholarship_80_20'));
ALTER TABLE nne_distribution_releases ADD COLUMN label_share_bps INTEGER NOT NULL DEFAULT 0
  CHECK (label_share_bps BETWEEN 0 AND 10000);

ALTER TABLE nne_distribution_payouts ADD COLUMN compliance_profile_id TEXT;
ALTER TABLE nne_distribution_payouts ADD COLUMN compliance_status_at_request TEXT;
