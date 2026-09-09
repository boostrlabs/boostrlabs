
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('AGENT')),
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  pin_hash TEXT,
  pin_salt TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions(
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS applications(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  instagram TEXT,
  tiktok TEXT,
  email TEXT NOT NULL,
  english_level TEXT,
  sales_experience TEXT,
  service_experience TEXT,
  availability TEXT,
  devices TEXT,
  status TEXT NOT NULL DEFAULT 'NEW',
  invite_path TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invites(
  token_hash TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_requests(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lead_pool(
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  temperature TEXT NOT NULL CHECK(temperature IN ('FRIO','TIBIO','CALIENTE')),
  industry TEXT,
  suggested_product TEXT,
  contact_name TEXT,
  contact_role TEXT,
  phone TEXT,
  whatsapp TEXT,
  instagram TEXT,
  facebook TEXT,
  email TEXT,
  website TEXT,
  city TEXT,
  country TEXT,
  language TEXT,
  preferred_channel TEXT,
  opportunity_summary TEXT,
  recommended_opener TEXT,
  closing_notes TEXT,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  claimed_by TEXT,
  claimed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads(
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('AGENT','BOOSTR_POOL')),
  pool_lead_id TEXT,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  product_id TEXT,
  temperature TEXT DEFAULT 'FRIO',
  phone TEXT,
  whatsapp TEXT,
  instagram TEXT,
  facebook TEXT,
  email TEXT,
  website TEXT,
  city TEXT,
  country TEXT,
  status TEXT NOT NULL DEFAULT 'NUEVO',
  opportunity_summary TEXT,
  recommended_opener TEXT,
  closing_notes TEXT,
  notes TEXT,
  sale_amount REAL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS commissions(
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  lead_id TEXT,
  business_name TEXT,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weekly_claims(
  agent_id TEXT NOT NULL,
  week_key TEXT NOT NULL,
  claims INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(agent_id, week_key)
);

CREATE TABLE IF NOT EXISTS settings(
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

INSERT OR IGNORE INTO settings(key,value) VALUES
('instagram',''),('tiktok',''),('x',''),('facebook',''),('whatsapp',''),('email','');
