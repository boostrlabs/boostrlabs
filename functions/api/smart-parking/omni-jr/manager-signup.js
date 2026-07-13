import {
  clean,
  createSession,
  hashPassword,
  isValidEmail,
  json,
  jsonError,
  normalizePhone,
  now,
  readJson,
  requireDb,
  sessionCookie
} from "../../../_lib/api.js";

const INVITE_HASH = "1fadf7595ca11b0efea0423ba4339221ad726b468be488d58d02e7c2b37e21db";
const OPERATOR_SLUG = "omni-jr-parking";
const RESERVED_USERNAME = "maikfine";

function normalizeUsername(value) {
  return clean(value, 40).toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value || "")));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function ensureUserColumns(env) {
  const result = await env.DB.prepare("PRAGMA table_info(users)").all();
  const existing = new Set((result.results || []).map((column) => column.name));
  const additions = [
    ["password_hash", "TEXT"],
    ["password_set_at", "TEXT"],
    ["last_login_at", "TEXT"],
    ["username", "TEXT"],
    ["phone", "TEXT"],
    ["normalized_phone", "TEXT"],
    ["default_workspace_id", "TEXT"],
    ["default_persona_id", "TEXT"],
    ["language", "TEXT NOT NULL DEFAULT 'es'"],
    ["theme", "TEXT NOT NULL DEFAULT 'light'"],
    ["signup_source", "TEXT"],
    ["onboarding_status", "TEXT NOT NULL DEFAULT 'complete'"]
  ];
  for (const [name, definition] of additions) {
    if (!existing.has(name)) await env.DB.prepare(`ALTER TABLE users ADD COLUMN ${name} ${definition}`).run();
  }
}

async function ensureSchema(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS workspace_members (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_members_workspace_user ON workspace_members(workspace_id, user_id)").run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      persona_type TEXT NOT NULL,
      display_name TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      metadata_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();
  await ensureUserColumns(env);
}

async function ensureWorkspace(env, ownerEmail, timestamp) {
  let workspace = await env.DB.prepare("SELECT id, name, slug, type, status FROM workspaces WHERE slug = ? LIMIT 1")
    .bind(OPERATOR_SLUG).first();
  if (workspace?.id) return workspace;
  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO workspaces (id, type, name, slug, owner_email, status, created_at, updated_at)
    VALUES (?, 'partner', 'OMNI JR Parking', ?, ?, 'active', ?, ?)
  `).bind(id, OPERATOR_SLUG, ownerEmail || null, timestamp, timestamp).run();
  return await env.DB.prepare("SELECT id, name, slug, type, status FROM workspaces WHERE id = ? LIMIT 1").bind(id).first();
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};

  if ((await sha256(clean(payload.invite, 200))) !== INVITE_HASH) {
    return jsonError("invalid_manager_invite", "Este enlace de registro no es válido.", 403);
  }

  const displayName = clean(payload.display_name || "Maikfine", 120);
  const username = normalizeUsername(payload.username || RESERVED_USERNAME);
  const emailInput = clean(payload.email, 180).toLowerCase();
  const phoneRaw = clean(payload.phone, 80);
  const phone = phoneRaw ? normalizePhone(phoneRaw) : "";
  const password = clean(payload.password, 500);

  if (username !== RESERVED_USERNAME) return jsonError("reserved_manager_username", "Este acceso está reservado para maikfine.", 400, { fields: ["username"] });
  if (!emailInput && !phone) return jsonError("contact_required", "Agrega un número de teléfono o correo electrónico.", 400, { fields: ["phone", "email"] });
  if (emailInput && !isValidEmail(emailInput)) return jsonError("invalid_email", "Usa un correo electrónico válido.", 400, { fields: ["email"] });
  if (phone && phone.replace(/\D/g, "").length < 7) return jsonError("invalid_phone", "Usa un número de teléfono válido.", 400, { fields: ["phone"] });
  if (password.length < 8) return jsonError("weak_password", "La contraseña debe tener al menos 8 caracteres.", 400, { fields: ["password"] });

  await ensureSchema(env);
  const existing = await env.DB.prepare(`
    SELECT id, username, email, normalized_phone FROM users
    WHERE username = ? OR (? != '' AND lower(email) = ?) OR (? != '' AND normalized_phone = ?)
    LIMIT 1
  `).bind(username, emailInput, emailInput, phone, phone).first();
  if (existing?.id) {
    return jsonError("manager_account_exists", "La cuenta ya existe. Inicia sesión con usuario, teléfono o correo.", 409, {
      login_url: "/login/?next=/app/parking/omni-jr/manager/"
    });
  }

  const timestamp = now();
  const workspace = await ensureWorkspace(env, emailInput || null, timestamp);
  const userId = crypto.randomUUID();
  const personaId = crypto.randomUUID();
  const email = emailInput || `${username}.${phone.replace(/\D/g, "").slice(-8)}@accounts.boostr.invalid`;
  const passwordHash = await hashPassword(password);

  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO users (
        id, email, name, role, workspace_id, status, created_at, updated_at,
        password_hash, password_set_at, last_login_at, username, phone, normalized_phone,
        default_workspace_id, default_persona_id, language, theme, signup_source, onboarding_status
      ) VALUES (?, ?, ?, 'manager', ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'es', 'light', 'omni_jr_manager_invite', 'complete')
    `).bind(
      userId,
      email,
      displayName,
      workspace.id,
      timestamp,
      timestamp,
      passwordHash,
      timestamp,
      timestamp,
      username,
      phoneRaw || null,
      phone || null,
      workspace.id,
      personaId
    ),
    env.DB.prepare(`
      INSERT INTO workspace_members (id, workspace_id, user_id, role, status, created_at, updated_at)
      VALUES (?, ?, ?, 'manager', 'active', ?, ?)
    `).bind(crypto.randomUUID(), workspace.id, userId, timestamp, timestamp),
    env.DB.prepare(`
      INSERT INTO personas (id, user_id, workspace_id, persona_type, display_name, status, metadata_json, created_at, updated_at)
      VALUES (?, ?, ?, 'manager', ?, 'active', ?, ?, ?)
    `).bind(personaId, userId, workspace.id, `${displayName} · OMNI JR Manager`, JSON.stringify({ source: "omni_jr_manager_invite", operator: "omni_jr" }), timestamp, timestamp)
  ]);

  const session = await createSession(env, request, userId, workspace.id);
  return json({
    ok: true,
    token: session.token,
    expires_at: session.expires_at,
    user: { id: userId, name: displayName, username, phone: phoneRaw || null, email: emailInput || null, role: "manager" },
    workspace,
    redirect: "/app/parking/omni-jr/manager/"
  }, 201, { "Set-Cookie": sessionCookie(session.token, request) });
}
