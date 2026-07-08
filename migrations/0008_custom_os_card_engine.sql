-- BOOSTR Custom OS card engine foundation.
-- No seed data. No payment processing.

CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  persona_type TEXT NOT NULL CHECK (persona_type IN (
    'admin',
    'manager',
    'partner',
    'client',
    'artist',
    'creator',
    'producer',
    'seller',
    'agent_later'
  )),
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'paused', 'disabled', 'archived')),
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_personas_user
  ON personas(user_id);

CREATE INDEX IF NOT EXISTS idx_personas_workspace
  ON personas(workspace_id);

CREATE INDEX IF NOT EXISTS idx_personas_type
  ON personas(persona_type);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT,
  persona_id TEXT,
  source_type TEXT NOT NULL,
  source_id TEXT,
  card_type TEXT NOT NULL CHECK (card_type IN (
    'lead',
    'next_to_boost',
    'product',
    'music',
    'payment',
    'order',
    'file',
    'invoice',
    'insight',
    'health',
    'human_need',
    'asset_request',
    'partner_action'
  )),
  title TEXT NOT NULL,
  summary TEXT,
  priority INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN (
    'unread',
    'read',
    'high_potential',
    'normal',
    'special_case',
    'later',
    'approved',
    'rejected',
    'active',
    'done',
    'blocked',
    'archived'
  )),
  owner_user_id TEXT,
  owner_role TEXT,
  action_label TEXT,
  action_url TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cards_workspace
  ON cards(workspace_id);

CREATE INDEX IF NOT EXISTS idx_cards_user
  ON cards(user_id);

CREATE INDEX IF NOT EXISTS idx_cards_persona
  ON cards(persona_id);

CREATE INDEX IF NOT EXISTS idx_cards_type
  ON cards(card_type);

CREATE INDEX IF NOT EXISTS idx_cards_status
  ON cards(status);

CREATE INDEX IF NOT EXISTS idx_cards_priority
  ON cards(priority DESC);

CREATE INDEX IF NOT EXISTS idx_cards_source
  ON cards(source_type, source_id);

CREATE TABLE IF NOT EXISTS human_needs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  persona_id TEXT,
  need_type TEXT NOT NULL CHECK (need_type IN (
    'cash',
    'create',
    'manage',
    'review',
    'boost_product',
    'boost_music',
    'boost_partners',
    'clear_head',
    'feel_artist',
    'feel_business'
  )),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_human_needs_workspace
  ON human_needs(workspace_id);

CREATE INDEX IF NOT EXISTS idx_human_needs_user
  ON human_needs(user_id);

CREATE INDEX IF NOT EXISTS idx_human_needs_created
  ON human_needs(created_at DESC);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  title TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN (
    'digital',
    'physical',
    'service',
    'booking',
    'license',
    'membership',
    'auction_later'
  )),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  price_amount INTEGER,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  asset_status TEXT,
  fulfillment_type TEXT,
  requires_account INTEGER NOT NULL DEFAULT 0 CHECK (requires_account IN (0, 1)),
  allow_guest_checkout INTEGER NOT NULL DEFAULT 1 CHECK (allow_guest_checkout IN (0, 1)),
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_workspace
  ON products(workspace_id);

CREATE INDEX IF NOT EXISTS idx_products_type
  ON products(product_type);

CREATE INDEX IF NOT EXISTS idx_products_status
  ON products(status);

CREATE TABLE IF NOT EXISTS pilot_profiles (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  profile_type TEXT,
  story_json TEXT,
  audit_summary_json TEXT,
  demo_mode INTEGER NOT NULL DEFAULT 0 CHECK (demo_mode IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pilot_profiles_workspace
  ON pilot_profiles(workspace_id);

CREATE INDEX IF NOT EXISTS idx_pilot_profiles_name
  ON pilot_profiles(name);

CREATE TABLE IF NOT EXISTS payment_links (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  product_id TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  amount_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'USD',
  checkout_mode TEXT,
  requires_account INTEGER NOT NULL DEFAULT 0 CHECK (requires_account IN (0, 1)),
  allow_guest_checkout INTEGER NOT NULL DEFAULT 1 CHECK (allow_guest_checkout IN (0, 1)),
  license_metadata_json TEXT,
  disclosure_json TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_links_workspace
  ON payment_links(workspace_id);

CREATE INDEX IF NOT EXISTS idx_payment_links_product
  ON payment_links(product_id);

CREATE TABLE IF NOT EXISTS order_reservations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  product_id TEXT,
  payment_link_id TEXT,
  user_id TEXT,
  guest_email TEXT,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'expired', 'converted', 'cancelled')),
  reservation_type TEXT,
  metadata_json TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_reservations_workspace
  ON order_reservations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_order_reservations_status
  ON order_reservations(status);
