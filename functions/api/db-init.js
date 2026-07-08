import { json, managerAuth } from "../_lib/api.js";

const expectedTables = [
  "leads",
  "audit_submissions",
  "lead_events",
  "modules",
  "workspaces",
  "users",
  "workspace_members",
  "sessions",
  "orders"
];

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    created_by_user_id TEXT,
    source TEXT NOT NULL DEFAULT 'website',
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    preferred_contact_method TEXT,
    business_name TEXT,
    industry TEXT,
    project_goal TEXT,
    budget_range TEXT,
    timeline TEXT,
    current_status TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    assigned_to TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC)",
  "CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)",
  "CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source)",
  "CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(contact_email)",
  "CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to)",
  "CREATE INDEX IF NOT EXISTS idx_leads_business ON leads(business_name)",
  `CREATE TABLE IF NOT EXISTS audit_submissions (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    source TEXT NOT NULL DEFAULT 'boostr-audit',
    page_url TEXT,
    language TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    contact_raw TEXT,
    business_name TEXT,
    industry TEXT,
    stage TEXT,
    traffic TEXT,
    signals INTEGER DEFAULT 0,
    recommended_modules TEXT,
    answers_json TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_submissions(created_at DESC)",
  "CREATE INDEX IF NOT EXISTS idx_audit_status ON audit_submissions(status)",
  "CREATE INDEX IF NOT EXISTS idx_audit_email ON audit_submissions(contact_email)",
  "CREATE INDEX IF NOT EXISTS idx_audit_source ON audit_submissions(source)",
  `CREATE TABLE IF NOT EXISTS lead_events (
    id TEXT PRIMARY KEY,
    workspace_id TEXT,
    lead_id TEXT,
    audit_submission_id TEXT,
    event_type TEXT NOT NULL,
    payload_json TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    FOREIGN KEY (audit_submission_id) REFERENCES audit_submissions(id) ON DELETE SET NULL
  )`,
  "CREATE INDEX IF NOT EXISTS idx_lead_events_lead ON lead_events(lead_id)",
  "CREATE INDEX IF NOT EXISTS idx_lead_events_audit ON lead_events(audit_submission_id)",
  "CREATE INDEX IF NOT EXISTS idx_lead_events_type ON lead_events(event_type)",
  "CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON lead_events(created_at DESC)",
  `CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'available',
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS idx_modules_status ON modules(status)",
  "CREATE INDEX IF NOT EXISTS idx_modules_category ON modules(category)",
  `CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    owner_email TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'client',
    workspace_id TEXT,
    status TEXT NOT NULL DEFAULT 'invited',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
  )`,
  "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
  "CREATE INDEX IF NOT EXISTS idx_users_workspace ON users(workspace_id)",
  `CREATE TABLE IF NOT EXISTS workspace_members (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'partner', 'client', 'artist')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'disabled')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_members_workspace_user ON workspace_members(workspace_id, user_id)",
  "CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id)",
  "CREATE INDEX IF NOT EXISTS idx_workspace_members_role ON workspace_members(role)",
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_token_hash TEXT NOT NULL UNIQUE,
    active_workspace_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TEXT,
    revoked_at TEXT,
    ip TEXT,
    user_agent TEXT
  )`,
  "CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(session_token_hash)",
  "CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(status, expires_at)",
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    lead_id TEXT,
    workspace_id TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    item_name TEXT NOT NULL,
    item_type TEXT,
    amount_cents INTEGER DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    fulfillment_status TEXT NOT NULL DEFAULT 'pending',
    metadata_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
  )`,
  "CREATE INDEX IF NOT EXISTS idx_orders_lead ON orders(lead_id)",
  "CREATE INDEX IF NOT EXISTS idx_orders_workspace ON orders(workspace_id)",
  "CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status)",
  "CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)",
  `INSERT OR IGNORE INTO modules (id, name, slug, category, status, description, created_at, updated_at)
   VALUES
     ('mod_audit', 'BOOSTR Audit', 'boostr-audit', 'lead-capture', 'active', 'Public diagnostic intake and recommendation flow.', datetime('now'), datetime('now')),
     ('mod_smart_links', 'Smart Links', 'smart-links', 'front-door', 'available', 'Custom partner front doors and deep links.', datetime('now'), datetime('now')),
     ('mod_manager_os', 'Manager OS', 'manager-os', 'operations', 'active', 'Internal lead and operations workspace.', datetime('now'), datetime('now')),
     ('mod_checkout', 'Smart Checkout', 'smart-checkout', 'commerce', 'planned', 'Order and payment flow for products, services and licenses.', datetime('now'), datetime('now')),
     ('mod_artist_os', 'Artist OS', 'artist-os', 'vertical', 'available', 'Artist infrastructure without creative control.', datetime('now'), datetime('now'))`
];

async function initDb(request, env) {
  const auth = managerAuth(request, env);
  if (!auth.ok) return auth.response;

  const allowDbInit = env.ENVIRONMENT === "development" || env.ALLOW_DB_INIT === "true";
  if (!allowDbInit) {
    return json({ ok: false, error: "Database initialization is disabled." }, 403);
  }

  if (!env.DB) {
    return json({ ok: false, error: "D1 DB binding missing." }, 503);
  }

  try {
    for (const sql of schemaStatements) {
      await env.DB.prepare(sql).run();
    }

    const tableResult = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
    ).all();

    const tables = (tableResult.results || []).map((row) => row.name);
    const ready = expectedTables.every((table) => tables.includes(table));

    return json({ ok: true, tables_present: tables, ready });
  } catch (error) {
    console.error("Database init failed:", error);
    return json({ ok: false, error: error?.message || "Database initialization failed." }, 500);
  }
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  return initDb(request, env);
}

export async function onRequestPost({ request, env }) {
  return initDb(request, env);
}
