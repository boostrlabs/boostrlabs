import { clean, now } from "./nne-api.js";

export async function ensureNneMarketplace(env) {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_beats (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      bpm INTEGER,
      musical_key TEXT,
      tags TEXT,
      preview_url TEXT,
      artwork_url TEXT,
      lease_price_cents INTEGER,
      exclusive_price_cents INTEGER,
      status TEXT NOT NULL DEFAULT 'submitted',
      westdetro_certified INTEGER NOT NULL DEFAULT 0,
      review_note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_service_listings (
      id TEXT PRIMARY KEY,
      seller_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      turnaround_days INTEGER,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_seller_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
      amount_cents INTEGER NOT NULL,
      kind TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id,kind,source_type,source_id)
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_academy_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      cost_nne REAL NOT NULL,
      asset_url TEXT,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_academy_redemptions (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL REFERENCES nne_academy_items(id) ON DELETE RESTRICT,
      user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE RESTRICT,
      cost_nne REAL NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(item_id,user_id)
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_jobs (
      id TEXT PRIMARY KEY,
      creator_user_id TEXT NOT NULL REFERENCES nne_users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      compensation_type TEXT NOT NULL,
      budget_cents INTEGER,
      budget_nne REAL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_marketplace_orders (
      id TEXT PRIMARY KEY,buyer_user_id TEXT NOT NULL,seller_user_id TEXT NOT NULL,item_type TEXT NOT NULL,item_id TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,platform_fee_cents INTEGER NOT NULL DEFAULT 0,seller_net_cents INTEGER NOT NULL,currency TEXT NOT NULL DEFAULT 'usd',
      stripe_checkout_session_id TEXT UNIQUE,stripe_payment_intent_id TEXT UNIQUE,status TEXT NOT NULL DEFAULT 'pending_payment',created_at TEXT NOT NULL,paid_at TEXT,completed_at TEXT,updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_contract_documents (
      id TEXT PRIMARY KEY,order_id TEXT NOT NULL,document_type TEXT NOT NULL,version TEXT NOT NULL DEFAULT 'v1',terms_json TEXT NOT NULL,rendered_text TEXT NOT NULL,created_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS nne_cashback_rules (
      id TEXT PRIMARY KEY,label TEXT NOT NULL,source_type TEXT NOT NULL,cashback_percent REAL NOT NULL,max_credits REAL,status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL,updated_at TEXT NOT NULL
    )`)
  ]);

  const timestamp = now();
  const seed = await env.DB.prepare("SELECT id FROM nne_academy_items WHERE id='academy_westdetro_drums_001' LIMIT 1").first();
  if (!seed?.id) {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO nne_academy_items (id,title,description,category,cost_nne,status,created_at,updated_at)
        VALUES ('academy_westdetro_drums_001','WESTDETRO Drum Kit 001','Kit de drums curado para producir dentro del universo WESTDETRO.','drum_kit',20,'published',?,?)`).bind(timestamp,timestamp),
      env.DB.prepare(`INSERT INTO nne_academy_items (id,title,description,category,cost_nne,status,created_at,updated_at)
        VALUES ('academy_vocal_project_001','Vocal Project 001','Proyecto educativo de voces, routing y procesamiento para estudio.','vocal_project',25,'published',?,?)`).bind(timestamp,timestamp),
      env.DB.prepare(`INSERT INTO nne_academy_items (id,title,description,category,cost_nne,status,created_at,updated_at)
        VALUES ('academy_production_breakdown_001','Cómo construir un WESTDETRO','Breakdown de producción, estructura, drums y bajos.','course',15,'published',?,?)`).bind(timestamp,timestamp)
    ]);
  }
  await env.DB.prepare(`INSERT OR IGNORE INTO nne_cashback_rules (id,label,source_type,cashback_percent,max_credits,status,created_at,updated_at)
    VALUES ('nne_event_cashback_20','Eventos NNE × WESTDETRO · 20% cashback','event_ticket',20,NULL,'active',?,?)`).bind(timestamp,timestamp).run();
}

export function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function safeCategory(value, fallback = "other") {
  return clean(value, 80).toLowerCase().replace(/[^a-z0-9_-]/g, "_") || fallback;
}
