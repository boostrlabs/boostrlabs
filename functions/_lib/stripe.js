import { now } from "./api.js";

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function ensureKeyring(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS boostr_keyring (
      key_name TEXT PRIMARY KEY,
      key_material TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();
}

async function encryptionSeed(env) {
  const configured = env.BOOSTR_ENCRYPTION_KEY || env.AUTH_SECRET || env.JWT_SECRET || env.SESSION_SECRET || env.BOOSTR_AUTH_SECRET;
  if (configured) return String(configured);
  await ensureKeyring(env);
  const row = await env.DB.prepare("SELECT key_material FROM boostr_keyring WHERE key_name = 'founder_settings_v1' LIMIT 1").first();
  if (!row?.key_material) throw new Error("stripe_keyring_missing");
  return row.key_material;
}

async function decryptValue(env, packed) {
  const [iv64, cipher64] = String(packed || "").split(".");
  if (!iv64 || !cipher64) throw new Error("stripe_secret_invalid");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(await encryptionSeed(env)));
  const key = await crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(iv64) }, key, base64ToBytes(cipher64));
  return new TextDecoder().decode(plain);
}

export async function ensureStripeSchema(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS stripe_payments (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      payment_link_id TEXT NOT NULL,
      stripe_checkout_session_id TEXT,
      stripe_payment_intent_id TEXT,
      customer_email TEXT,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      mode TEXT NOT NULL,
      status TEXT NOT NULL,
      checkout_url TEXT,
      metadata_json TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();
  await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_payments_session ON stripe_payments(stripe_checkout_session_id)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_stripe_payments_workspace ON stripe_payments(workspace_id, created_at DESC)").run();
}

export async function getStripeCredentials(env) {
  const row = await env.DB.prepare(
    "SELECT publishable_value, secret_value_encrypted, secret_mask FROM founder_secure_settings WHERE provider = 'stripe' AND secret_value_encrypted IS NOT NULL ORDER BY updated_at DESC LIMIT 1"
  ).first();
  if (!row?.secret_value_encrypted) throw new Error("stripe_not_configured");
  const secretKey = await decryptValue(env, row.secret_value_encrypted);
  const mode = secretKey.includes("_live_") ? "live" : "test";
  return { publishableKey: row.publishable_value || "", secretKey, secretMask: row.secret_mask || null, mode };
}

export async function stripeRequest(secretKey, path, { method = "GET", body = null, idempotencyKey = null } = {}) {
  const headers = { Authorization: `Bearer ${secretKey}` };
  if (body) headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const response = await fetch(`https://api.stripe.com/v1${path}`, { method, headers, body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || "Stripe request failed");
    error.code = data?.error?.code || "stripe_request_failed";
    error.status = response.status;
    throw error;
  }
  return data;
}

export function stripeForm(values = {}) {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== "") form.set(key, String(value));
  }
  return form;
}

export async function recordStripeActivity(env, { workspaceId, userId = null, eventType, title, body, metadata = {} }) {
  try {
    await env.DB.prepare(
      `INSERT INTO activity_events (id, workspace_id, user_id, event_type, title, body, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), workspaceId, userId, eventType, title, body || null, JSON.stringify(metadata), now()).run();
  } catch {}
}
