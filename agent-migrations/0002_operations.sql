CREATE TABLE IF NOT EXISTS auth_attempts (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS deals (id TEXT PRIMARY KEY, lead_id TEXT NOT NULL, agent_id TEXT NOT NULL, business_name TEXT NOT NULL, customer_email TEXT NOT NULL, amount_cents INTEGER NOT NULL, commission_cents INTEGER NOT NULL, scope TEXT NOT NULL, terms TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'DRAFT', stripe_invoice_id TEXT UNIQUE, invoice_url TEXT, created_at TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS commission_per_deal ON commissions(lead_id) WHERE lead_id LIKE 'deal_%';
CREATE TABLE IF NOT EXISTS private_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
ALTER TABLE commissions ADD COLUMN payout_method TEXT;
ALTER TABLE commissions ADD COLUMN payout_reference TEXT;
INSERT INTO settings(key,value) VALUES ('email','boostrlabs@gmail.com'),('whatsapp','https://wa.me/13059008163') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
