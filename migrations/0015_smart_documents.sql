-- BOOSTR Labs D1 Migration 0015
-- Smart Documents: living invoices, receipts, tickets, contracts, licenses and custom experiences.

CREATE TABLE IF NOT EXISTS smart_documents (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  created_by_user_id TEXT,
  public_slug TEXT NOT NULL,
  document_number TEXT,
  document_type TEXT NOT NULL DEFAULT 'invoice',
  title TEXT NOT NULL,
  subtitle TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  customer_name TEXT,
  customer_email TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  related_type TEXT,
  related_id TEXT,
  template_key TEXT NOT NULL DEFAULT 'immersive',
  theme_json TEXT,
  blocks_json TEXT,
  timeline_json TEXT,
  actions_json TEXT,
  access_mode TEXT NOT NULL DEFAULT 'public_link',
  published_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_smart_documents_public_slug
  ON smart_documents(public_slug);

CREATE UNIQUE INDEX IF NOT EXISTS idx_smart_documents_workspace_number
  ON smart_documents(workspace_id, document_number)
  WHERE document_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_smart_documents_related_unique
  ON smart_documents(workspace_id, related_type, related_id, document_type)
  WHERE related_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_smart_documents_workspace
  ON smart_documents(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_smart_documents_status
  ON smart_documents(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_smart_documents_customer
  ON smart_documents(customer_email, created_at DESC);

CREATE TABLE IF NOT EXISTS smart_document_events (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  visibility TEXT NOT NULL DEFAULT 'public',
  metadata_json TEXT,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_smart_document_events_document
  ON smart_document_events(document_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_smart_document_events_workspace
  ON smart_document_events(workspace_id, occurred_at DESC);
