import { authCanSeeAll, clean, json, jsonError, now, requireDb, requireSession } from "../../_lib/api.js";

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function encryptionSeed(env) {
  return env.BOOSTR_ENCRYPTION_KEY || env.AUTH_SECRET || env.JWT_SECRET || env.SESSION_SECRET || env.BOOSTR_AUTH_SECRET || null;
}

async function encryptionKey(env) {
  const seed = encryptionSeed(env);
  if (!seed) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(seed)));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptValue(env, value) {
  const key = await encryptionKey(env);
  if (!key) throw new Error("encryption_key_missing");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));
  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
}

function maskKey(value = "") {
  const text = String(value);
  if (!text) return null;
  const prefix = text.split("_").slice(0, 2).join("_") || text.slice(0, 7);
  return `${prefix}_••••${text.slice(-4)}`;
}

async function ensureSchema(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS founder_secure_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      publishable_value TEXT,
      secret_value_encrypted TEXT,
      secret_mask TEXT,
      created_at TEXT,
      updated_at TEXT,
      UNIQUE(user_id, provider)
    )
  `).run();
}

async function authorize(request, env) {
  const auth = await requireSession(request, env);
  if (!auth.ok) return auth;
  const email = String(auth.user?.email || "").toLowerCase();
  if (!authCanSeeAll(auth) && email !== "janko@boostrlabs.com" && email !== "juan@boostrlabs.com") {
    return { ok: false, response: jsonError("founder_only", "Solo Janko o un administrador puede cambiar estas credenciales.", 403) };
  }
  return auth;
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await authorize(request, env);
  if (!auth.ok) return auth.response;
  await ensureSchema(env);
  const row = await env.DB.prepare(
    "SELECT publishable_value, secret_mask, updated_at FROM founder_secure_settings WHERE user_id = ? AND provider = 'stripe' LIMIT 1"
  ).bind(auth.user.id).first();
  return json({
    ok: true,
    stripe: {
      publishable_key: row?.publishable_value || "",
      secret_configured: Boolean(row?.secret_mask),
      secret_mask: row?.secret_mask || null,
      updated_at: row?.updated_at || null
    }
  });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await authorize(request, env);
  if (!auth.ok) return auth.response;
  await ensureSchema(env);
  const payload = await request.json().catch(() => null);
  const publishableKey = clean(payload?.publishable_key, 300);
  const secretKey = clean(payload?.secret_key, 500);

  if (publishableKey && !publishableKey.startsWith("pk_")) {
    return jsonError("invalid_publishable_key", "La publishable key debe comenzar con pk_", 400);
  }
  if (secretKey && !(secretKey.startsWith("sk_") || secretKey.startsWith("rk_"))) {
    return jsonError("invalid_secret_key", "La clave privada debe comenzar con sk_ o rk_", 400);
  }

  const existing = await env.DB.prepare(
    "SELECT id, secret_value_encrypted, secret_mask FROM founder_secure_settings WHERE user_id = ? AND provider = 'stripe' LIMIT 1"
  ).bind(auth.user.id).first();

  let encrypted = existing?.secret_value_encrypted || null;
  let secretMask = existing?.secret_mask || null;
  if (secretKey) {
    try {
      encrypted = await encryptValue(env, secretKey);
      secretMask = maskKey(secretKey);
    } catch (error) {
      return jsonError("encryption_unavailable", "El servidor todavía no tiene una llave de cifrado disponible.", 503, { detail: String(error?.message || error) });
    }
  }

  const timestamp = now();
  const id = existing?.id || crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO founder_secure_settings
      (id, user_id, provider, publishable_value, secret_value_encrypted, secret_mask, created_at, updated_at)
    VALUES (?, ?, 'stripe', ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, provider) DO UPDATE SET
      publishable_value = excluded.publishable_value,
      secret_value_encrypted = excluded.secret_value_encrypted,
      secret_mask = excluded.secret_mask,
      updated_at = excluded.updated_at
  `).bind(id, auth.user.id, publishableKey || "", encrypted, secretMask, timestamp, timestamp).run();

  return json({ ok: true, stripe: { publishable_key: publishableKey || "", secret_configured: Boolean(secretMask), secret_mask: secretMask, updated_at: timestamp } });
}

export async function onRequestDelete({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await authorize(request, env);
  if (!auth.ok) return auth.response;
  await ensureSchema(env);
  await env.DB.prepare("DELETE FROM founder_secure_settings WHERE user_id = ? AND provider = 'stripe'").bind(auth.user.id).run();
  return json({ ok: true, deleted: true });
}
