import { now } from "./nne-api.js";

export async function ensureNneEconomicOs(env) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS nne_marketplace_beats (id TEXT PRIMARY KEY,seller_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,title TEXT NOT NULL,producer_name TEXT NOT NULL,bpm INTEGER,musical_key TEXT,tags TEXT,preview_url TEXT,artwork_url TEXT,lease_price_cents INTEGER,exclusive_price_cents INTEGER,currency TEXT NOT NULL DEFAULT 'usd',westdetro_status TEXT NOT NULL DEFAULT 'submitted',marketplace_status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS nne_marketplace_services (id TEXT PRIMARY KEY,seller_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,title TEXT NOT NULL,category TEXT NOT NULL,description TEXT NOT NULL,price_cents INTEGER NOT NULL,currency TEXT NOT NULL DEFAULT 'usd',delivery_days INTEGER NOT NULL DEFAULT 7,revisions INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS nne_jobs (id TEXT PRIMARY KEY,client_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,title TEXT NOT NULL,category TEXT NOT NULL,description TEXT NOT NULL,budget_type TEXT NOT NULL DEFAULT 'usd',budget_amount INTEGER NOT NULL,deadline_at TEXT,status TEXT NOT NULL DEFAULT 'open',created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS nne_academy_items (id TEXT PRIMARY KEY,creator_user_id TEXT REFERENCES nne_users(id) ON DELETE SET NULL,title TEXT NOT NULL,category TEXT NOT NULL,description TEXT NOT NULL,cost_credits INTEGER NOT NULL,asset_key TEXT,preview_url TEXT,status TEXT NOT NULL DEFAULT 'draft',sort_order INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS nne_seller_earnings (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,order_id TEXT,amount_cents INTEGER NOT NULL,kind TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'available',description TEXT NOT NULL,created_at TEXT NOT NULL,available_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS nne_cashback_rules (id TEXT PRIMARY KEY,label TEXT NOT NULL,source_type TEXT NOT NULL,cashback_percent REAL NOT NULL,max_credits REAL,status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`
  ];
  for (const sql of statements) await env.DB.prepare(sql).run();
  await env.DB.prepare(`INSERT OR IGNORE INTO nne_cashback_rules (id,label,source_type,cashback_percent,max_credits,status,created_at,updated_at) VALUES ('nne_event_cashback_20','Eventos NNE × WESTDETRO · 20% cashback','event_ticket',20,NULL,'active',?,?)`).bind(now(), now()).run();
}

export function centsFromUsd(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
}
