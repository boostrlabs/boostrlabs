import {
  clean,
  createSession,
  hashPassword,
  isValidEmail,
  json,
  jsonError,
  jsonOk,
  normalizePhone,
  readJson,
  requireDb,
  sessionCookie
} from "../_lib/api.js";

const encoder = new TextEncoder();
const toHex = (buffer) =>
  [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, "0")).join("");

const reservedUsernames = new Set([
  "admin",
  "root",
  "boostr",
  "boostrlabs",
  "api",
  "support",
  "login",
  "signup",
  "audit",
  "manager",
  "app",
  "dashboard",
  "jankodiorr",
  "82ngel"
]);

const personaTypes = new Set(["client", "artist", "creator", "producer", "seller", "partner", "agent_later"]);
const publicRoles = new Set(["client", "artist", "partner"]);

const normalizeUsername = (value) => clean(value, 40).toLowerCase().replace(/[^a-z0-9_-]/g, "");
const validUsername = (value) => /^[a-z0-9][a-z0-9_-]{2,31}$/.test(value) && !reservedUsernames.has(value);
const slugify = (value) =>
  clean(value, 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54) || "workspace";
const normalizeCode = (value) => clean(value, 160).replace(/\s+/g, "").toLowerCase();

async function hashInviteCode(code, salt = "") {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(`${salt}:${normalizeCode(code)}`)));
}

async function findInviteCode(env, rawCode) {
  const code = normalizeCode(rawCode);
  if (!code) return null;

  const configured = clean(env.BOOSTR_SECRET_CODE || env.BOOSTR_INVITE_CODE || "", 160);
  if (configured) {
    const suppliedHash = await hashInviteCode(code, "env");
    const configuredHash = await hashInviteCode(configured, "env");
    if (suppliedHash === configuredHash) {
      return {
        id: "env-secret-code",
        label: "BOOSTR private access",
        allowed_role: "client",
        allowed_persona: "client",
        allowed_workspace_type: "onboarding",
        campaign: "env_secret_code",
        db_backed: false
      };
    }
  }

  let rows = [];
  try {
    const result = await env.DB.prepare(
      `SELECT id, code_hash, code_salt, label, status, max_uses, used_count, expires_at,
              allowed_role, allowed_persona, allowed_workspace_type, campaign, source
       FROM invite_codes
       WHERE status = 'active'
         AND (expires_at IS NULL OR expires_at > ?)
         AND used_count < max_uses
       LIMIT 200`
    )
      .bind(new Date().toISOString())
      .all();
    rows = result.results || [];
  } catch {
    return null;
  }

  for (const row of rows) {
    const candidate = await hashInviteCode(code, row.code_salt || "");
    if (candidate === row.code_hash) return { ...row, db_backed: true };
  }
  return null;
}

async function uniqueWorkspaceSlug(env, base) {
  const root = slugify(base);
  for (let index = 0; index < 20; index += 1) {
    const slug = index === 0 ? root : `${root}-${index + 1}`;
    const existing = await env.DB.prepare("SELECT id FROM workspaces WHERE slug = ? LIMIT 1").bind(slug).first();
    if (!existing?.id) return slug;
  }
  return `${root}-${crypto.randomUUID().slice(0, 8)}`;
}

function safePersona(value, invite) {
  const raw = clean(invite?.allowed_persona || value || "client", 40).toLowerCase();
  if (raw === "manager_candidate") return "client";
  return personaTypes.has(raw) ? raw : "client";
}

function safeRole(persona, invite) {
  const fromInvite = clean(invite?.allowed_role || "", 40).toLowerCase();
  if (publicRoles.has(fromInvite)) return fromInvite;
  if (persona === "artist") return "artist";
  return "client";
}

function defaultCards(workspaceId, userId, personaId, language) {
  const es = language === "es";
  const cards = [
    ["next_to_boost", es ? "Completa tu perfil" : "Complete profile", es ? "Agrega contacto, persona e información base." : "Add contact, persona and basic account info.", 96, "Open profile", "/app"],
    ["next_to_boost", es ? "Agrega datos del negocio" : "Add business details", es ? "Dile a BOOSTR para qué existe este workspace." : "Tell BOOSTR what this workspace is for.", 92, "Prepare workspace", "/app"],
    ["asset_request", es ? "Sube logo/assets" : "Upload logo/assets", es ? "Logo, fotos, proof, ofertas y brand files." : "Logo, photos, proof, offers and brand files.", 88, "Files later", "/app/files"],
    ["product", es ? "Agrega producto/servicio" : "Add first product/service", es ? "Crea lo primero que este negocio puede vender." : "Create the first thing this business can sell.", 86, "Product setup", "/smart-payment-link"],
    ["insight", "Start BOOSTR Audit", es ? "Genera señales para cards, módulos y rutas." : "Generate signals for cards, modules and routes.", 84, "Start Audit", "/audit"],
    ["payment", "Smart Payment Link later", es ? "Prepara una ruta de oferta/pago antes de Stripe." : "Prepare an offer/payment route before Stripe.", 80, "Preview", "/smart-payment-link"],
    ["human_need", es ? "Elige persona" : "Choose persona", es ? "Client, artist, partner, seller o manager." : "Client, artist, partner, seller or manager.", 76, "Select role", "/app"],
    ["partner_action", "Request BOOSTR Manager setup", es ? "Pide ayuda para armar el dashboard custom." : "Ask BOOSTR to help build the custom dashboard.", 74, "Request later", "/manager"]
  ];

  return cards.map(([cardType, title, summary, priority, actionLabel, actionUrl]) => ({
    id: crypto.randomUUID(),
    workspace_id: workspaceId,
    user_id: userId,
    persona_id: personaId,
    source_type: "signup_bootstrap",
    source_id: userId,
    card_type: cardType,
    title,
    summary,
    priority,
    status: "unread",
    owner_user_id: userId,
    owner_role: "client",
    action_label: actionLabel,
    action_url: actionUrl,
    metadata_json: JSON.stringify({ first_run: true }),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
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

  const displayName = clean(payload.display_name || payload.name, 120);
  const username = normalizeUsername(payload.username);
  const email = clean(payload.email, 180).toLowerCase();
  const phoneRaw = clean(payload.phone, 80);
  const phone = phoneRaw ? normalizePhone(phoneRaw) : "";
  const password = clean(payload.password, 500);
  const language = clean(payload.language, 8).toLowerCase() === "es" ? "es" : "en";
  const workspaceName = clean(payload.workspace_name || payload.business_name, 120);
  const businessType = clean(payload.business_type || "onboarding", 80).toLowerCase() || "onboarding";
  const source = clean(payload.source || "signup", 80);

  if (!displayName) return jsonError("display_name_required", "Display name is required.", 400, { fields: ["display_name"] });
  if (!validUsername(username)) return jsonError("invalid_username", "Use 3-32 lowercase letters, numbers, dash or underscore.", 400, { fields: ["username"] });
  if (!isValidEmail(email)) return jsonError("invalid_email", "Use a valid email address.", 400, { fields: ["email"] });
  if (phoneRaw && phone.replace(/\D/g, "").length < 7) return jsonError("invalid_phone", "Use a valid phone number.", 400, { fields: ["phone"] });
  if (password.length < 8) return jsonError("weak_password", "Password must be at least 8 characters.", 400, { fields: ["password"] });
  if (!workspaceName) return jsonError("workspace_name_required", "Workspace or business name is required.", 400, { fields: ["workspace_name"] });

  const existing = await env.DB.prepare(
    `SELECT id, email, username, normalized_phone
     FROM users
     WHERE lower(email) = ? OR username = ? OR (? != '' AND normalized_phone = ?)
     LIMIT 1`
  )
    .bind(email, username, phone, phone)
    .first();

  if (existing?.id) {
    if (existing.email?.toLowerCase() === email) return jsonError("email_taken", "Email is already registered.", 409, { fields: ["email"] });
    if (existing.username === username) return jsonError("username_taken", "Username is unavailable.", 409, { fields: ["username"] });
    return jsonError("phone_taken", "Phone is already registered.", 409, { fields: ["phone"] });
  }

  const invite = await findInviteCode(env, payload.secret_boostr_code);
  const personaType = safePersona(payload.default_persona || businessType, invite);
  const role = safeRole(personaType, invite);

  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  const personaId = crypto.randomUUID();
  const workspacePrefId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const slug = await uniqueWorkspaceSlug(env, workspaceName);
  const passwordHash = await hashPassword(password);
  const bootCards = defaultCards(workspaceId, userId, personaId, language);

  const statements = [
    env.DB.prepare(
      `INSERT INTO workspaces (id, type, name, slug, owner_email, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`
    ).bind(workspaceId, businessType, workspaceName, slug, email, timestamp, timestamp),
    env.DB.prepare(
      `INSERT INTO users (
         id, email, name, role, workspace_id, status, created_at, updated_at,
         password_hash, password_set_at, last_login_at, username, phone, normalized_phone,
         default_workspace_id, default_persona_id, language, timezone, theme,
         signup_source, invite_code_id, onboarding_status
       ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'first_run')`
    ).bind(
      userId,
      email,
      displayName,
      role,
      workspaceId,
      timestamp,
      timestamp,
      passwordHash,
      timestamp,
      timestamp,
      username,
      phoneRaw || null,
      phone || null,
      workspaceId,
      personaId,
      language,
      clean(payload.timezone || "", 80) || null,
      "platinum_dark",
      source,
      invite?.id || null
    ),
    env.DB.prepare(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?)`
    ).bind(crypto.randomUUID(), workspaceId, userId, role, timestamp, timestamp),
    env.DB.prepare(
      `INSERT INTO personas (id, user_id, workspace_id, persona_type, display_name, status, metadata_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`
    ).bind(
      personaId,
      userId,
      workspaceId,
      personaType,
      displayName,
      JSON.stringify({ source: "signup", invite_code_id: invite?.id || null }),
      timestamp,
      timestamp
    ),
    env.DB.prepare(
      `INSERT INTO workspace_preferences (
         id, workspace_id, default_mode, default_persona_id, default_language,
         card_density, show_demo_labels, reduce_motion, notification_preferences_json,
         created_at, updated_at
       ) VALUES (?, ?, 'cash', ?, ?, 'comfortable', 1, 0, ?, ?, ?)`
    ).bind(workspacePrefId, workspaceId, personaId, language, JSON.stringify({ in_app: true }), timestamp, timestamp),
    env.DB.prepare(
      `INSERT INTO activity_events (id, workspace_id, user_id, persona_id, event_type, title, body, metadata_json, created_at)
       VALUES (?, ?, ?, ?, 'signup.completed', 'Account created', 'Default BOOSTR workspace created from signup.', ?, ?)`
    ).bind(
      crypto.randomUUID(),
      workspaceId,
      userId,
      personaId,
      JSON.stringify({ source, invite_code_id: invite?.id || null, bypass_audit: Boolean(invite) }),
      timestamp
    )
  ];

  for (const card of bootCards) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO cards (
          id, workspace_id, user_id, persona_id, source_type, source_id, card_type,
          title, summary, priority, status, owner_user_id, owner_role,
          action_label, action_url, metadata_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        card.id,
        card.workspace_id,
        card.user_id,
        card.persona_id,
        card.source_type,
        card.source_id,
        card.card_type,
        card.title,
        card.summary,
        card.priority,
        card.status,
        card.owner_user_id,
        card.owner_role,
        card.action_label,
        card.action_url,
        card.metadata_json,
        card.created_at,
        card.updated_at
      )
    );
  }

  if (invite?.db_backed) {
    statements.push(
      env.DB.prepare(
        `UPDATE invite_codes
         SET used_count = used_count + 1,
             status = CASE WHEN used_count + 1 >= max_uses THEN 'used' ELSE status END,
             updated_at = ?
         WHERE id = ? AND used_count < max_uses`
      ).bind(timestamp, invite.id)
    );
    statements.push(
      env.DB.prepare(
        `INSERT INTO invite_code_events (id, invite_code_id, event_type, source, metadata_json, created_at)
         VALUES (?, ?, 'invite_code.used_for_signup', ?, ?, ?)`
      ).bind(
        crypto.randomUUID(),
        invite.id,
        source,
        JSON.stringify({ user_id: userId, workspace_id: workspaceId }),
        timestamp
      )
    );
  }

  try {
    await env.DB.batch(statements);
  } catch (error) {
    return jsonError("signup_failed", "Signup could not be completed.", 500);
  }

  const session = await createSession(env, request, userId, workspaceId);

  return json(
    {
      ok: true,
      token: session.token,
      expires_at: session.expires_at,
      user: {
        id: userId,
        email,
        username,
        name: displayName,
        role,
        status: "active",
        language,
        onboarding_status: "first_run"
      },
      workspace: {
        id: workspaceId,
        name: workspaceName,
        type: businessType,
        slug,
        status: "active"
      },
      persona: {
        id: personaId,
        persona_type: personaType,
        display_name: displayName,
        status: "active"
      },
      default_cards: bootCards.map((card) => ({
        id: card.id,
        card_type: card.card_type,
        title: card.title,
        status: card.status,
        priority: card.priority,
        action_url: card.action_url
      })),
      invite_unlocked: Boolean(invite),
      redirect: "/app"
    },
    201,
    { "Set-Cookie": sessionCookie(session.token, request) }
  );
}
