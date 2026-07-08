import {
  clean,
  createSession,
  hashPassword,
  isValidEmail,
  json,
  jsonError,
  normalizePhone,
  readJson,
  requireDb,
  sessionCookie
} from "../../_lib/api.js";

const reservedUsernames = new Set([
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

const normalizeUsername = (value) => clean(value, 40).toLowerCase().replace(/[^a-z0-9_-]/g, "");
const validUsername = (value) => /^[a-z0-9][a-z0-9_-]{2,31}$/.test(value) && !reservedUsernames.has(value);
const slugify = (value) =>
  clean(value, 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54) || "workspace";

async function adminExists(env) {
  const row = await env.DB.prepare("SELECT id FROM users WHERE role = 'admin' AND status = 'active' LIMIT 1").first();
  return Boolean(row?.id);
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

function adminCards(workspaceId, userId, personaId) {
  const timestamp = new Date().toISOString();
  const cards = [
    ["health", "Run production readiness", "Confirm migrations, env vars, admin access and signup endpoints before launch.", 98, "Open readiness", "/admin/readiness"],
    ["next_to_boost", "Test real signup", "Create the first non-admin client account through the Secret BOOSTR Code flow.", 94, "Open Audit", "/audit"],
    ["insight", "Verify dashboard data", "Confirm /api/dashboard returns workspace, persona, cards and activity.", 90, "Open app", "/app"],
    ["partner_action", "Prepare launch QA", "Run email, username and phone login checks before public distribution.", 88, "Open checklist", "/admin/readiness"],
    ["payment", "Keep payments disabled", "Stripe and paid-order logic stay pending until LLC/payment setup is ready.", 70, "Review later", "/smart-payment-link"]
  ];

  return cards.map(([cardType, title, summary, priority, actionLabel, actionUrl]) => ({
    id: crypto.randomUUID(),
    workspace_id: workspaceId,
    user_id: userId,
    persona_id: personaId,
    source_type: "admin_bootstrap",
    source_id: userId,
    card_type: cardType,
    title,
    summary,
    priority,
    status: "unread",
    owner_user_id: userId,
    owner_role: "admin",
    action_label: actionLabel,
    action_url: actionUrl,
    metadata_json: JSON.stringify({ admin_bootstrap: true }),
    created_at: timestamp,
    updated_at: timestamp
  }));
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const configuredKey = clean(env.BOOSTR_ADMIN_BOOTSTRAP_KEY || "", 500);
  if (!configuredKey) {
    return jsonError("admin_bootstrap_not_configured", "Admin bootstrap is not configured.", 503);
  }

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};

  const suppliedKey = clean(payload.bootstrap_key, 500);
  if (!suppliedKey || suppliedKey !== configuredKey) {
    return jsonError("unauthorized", "Unauthorized.", 401);
  }

  if (await adminExists(env)) {
    return jsonError("admin_already_exists", "An active admin already exists.", 409);
  }

  const displayName = clean(payload.display_name || "BOOSTR Founder", 120);
  const username = normalizeUsername(payload.username || "admin");
  const email = clean(payload.email, 180).toLowerCase();
  const phoneRaw = clean(payload.phone, 80);
  const phone = phoneRaw ? normalizePhone(phoneRaw) : "";
  const password = clean(payload.password, 500);
  const workspaceName = clean(payload.workspace_name || "BOOSTR Labs CORE", 120);

  if (!validUsername(username)) return jsonError("invalid_username", "Use 3-32 lowercase letters, numbers, dash or underscore.", 400, { fields: ["username"] });
  if (!isValidEmail(email)) return jsonError("invalid_email", "Use a valid email address.", 400, { fields: ["email"] });
  if (password.length < 12) return jsonError("weak_password", "Admin password must be at least 12 characters.", 400, { fields: ["password"] });

  const existing = await env.DB.prepare(
    `SELECT id, email, username, normalized_phone
     FROM users
     WHERE lower(email) = ? OR username = ? OR (? != '' AND normalized_phone = ?)
     LIMIT 1`
  )
    .bind(email, username, phone, phone)
    .first();

  if (existing?.id) {
    return jsonError("account_conflict", "Email, username or phone is already registered.", 409);
  }

  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  const personaId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const slug = await uniqueWorkspaceSlug(env, workspaceName);
  const passwordHash = await hashPassword(password);
  const cards = adminCards(workspaceId, userId, personaId);

  const statements = [
    env.DB.prepare(
      `INSERT INTO workspaces (id, type, name, slug, owner_email, status, created_at, updated_at)
       VALUES (?, 'core', ?, ?, ?, 'active', ?, ?)`
    ).bind(workspaceId, workspaceName, slug, email, timestamp, timestamp),
    env.DB.prepare(
      `INSERT INTO users (
         id, email, name, role, workspace_id, status, created_at, updated_at,
         password_hash, password_set_at, last_login_at, username, phone, normalized_phone,
         default_workspace_id, default_persona_id, language, timezone, theme,
         signup_source, invite_code_id, onboarding_status
       ) VALUES (?, ?, ?, 'admin', ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en', ?, 'platinum_dark', 'admin_bootstrap', NULL, 'admin_ready')`
    ).bind(
      userId,
      email,
      displayName,
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
      clean(payload.timezone || "", 80) || null
    ),
    env.DB.prepare(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role, status, created_at, updated_at)
       VALUES (?, ?, ?, 'admin', 'active', ?, ?)`
    ).bind(crypto.randomUUID(), workspaceId, userId, timestamp, timestamp),
    env.DB.prepare(
      `INSERT INTO personas (id, user_id, workspace_id, persona_type, display_name, status, metadata_json, created_at, updated_at)
       VALUES (?, ?, ?, 'admin', ?, 'active', ?, ?, ?)`
    ).bind(personaId, userId, workspaceId, displayName, JSON.stringify({ source: "admin_bootstrap" }), timestamp, timestamp),
    env.DB.prepare(
      `INSERT INTO workspace_preferences (
         id, workspace_id, default_mode, default_persona_id, default_language,
         card_density, show_demo_labels, reduce_motion, notification_preferences_json,
         created_at, updated_at
       ) VALUES (?, ?, 'manage', ?, 'en', 'comfortable', 0, 0, ?, ?, ?)`
    ).bind(crypto.randomUUID(), workspaceId, personaId, JSON.stringify({ in_app: true, admin: true }), timestamp, timestamp),
    env.DB.prepare(
      `INSERT INTO activity_events (id, workspace_id, user_id, persona_id, event_type, title, body, metadata_json, created_at)
       VALUES (?, ?, ?, ?, 'admin.bootstrap.completed', 'Admin bootstrapped', 'First BOOSTR admin and CORE workspace created safely.', ?, ?)`
    ).bind(crypto.randomUUID(), workspaceId, userId, personaId, JSON.stringify({ endpoint: "/api/admin/bootstrap" }), timestamp)
  ];

  for (const card of cards) {
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

  try {
    await env.DB.batch(statements);
  } catch {
    return jsonError("admin_bootstrap_failed", "Admin bootstrap could not be completed.", 500);
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
        role: "admin",
        status: "active",
        onboarding_status: "admin_ready"
      },
      workspace: {
        id: workspaceId,
        name: workspaceName,
        type: "core",
        slug,
        status: "active"
      },
      persona: {
        id: personaId,
        persona_type: "admin",
        display_name: displayName,
        status: "active"
      },
      redirect: "/admin/readiness"
    },
    201,
    { "Set-Cookie": sessionCookie(session.token, request) }
  );
}
