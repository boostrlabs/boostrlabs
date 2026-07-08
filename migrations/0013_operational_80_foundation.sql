-- BOOSTR Labs D1 Migration 0013
-- Operational foundation for invite acceptance, Intelligence Engine V1, files and invoices.

ALTER TABLE users ADD COLUMN invite_token_hash TEXT;
ALTER TABLE users ADD COLUMN invite_token_expires_at TEXT;
ALTER TABLE users ADD COLUMN invite_accepted_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_invite_token_hash
  ON users(invite_token_hash)
  WHERE invite_token_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS workspace_files (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  uploaded_by_user_id TEXT,
  related_type TEXT,
  related_id TEXT,
  title TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT NOT NULL DEFAULT 'link',
  visibility TEXT NOT NULL DEFAULT 'workspace' CHECK (visibility IN ('private', 'workspace', 'client_visible', 'public_link')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workspace_files_workspace
  ON workspace_files(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workspace_files_related
  ON workspace_files(related_type, related_id);

CREATE INDEX IF NOT EXISTS idx_workspace_files_status
  ON workspace_files(status);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  created_by_user_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  invoice_number TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid_later', 'void', 'archived')),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  due_at TEXT,
  related_type TEXT,
  related_id TEXT,
  line_items_json TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_workspace_number
  ON invoices(workspace_id, invoice_number)
  WHERE invoice_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_workspace
  ON invoices(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_status
  ON invoices(status);

CREATE INDEX IF NOT EXISTS idx_invoices_related
  ON invoices(related_type, related_id);
