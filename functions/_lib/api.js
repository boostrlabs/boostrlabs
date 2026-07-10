export const json = (body, status = 200, extraHeaders = {}) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-BOOSTR-Session, X-Manager-Pin",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      ...extraHeaders
    }
  });

export const jsonOk = (body = {}, status = 200, extraHeaders = {}) =>
  json({ ok: true, ...body }, status, extraHeaders);

export const jsonError = (error, message, status = 400, extra = {}, extraHeaders = {}) =>
  json({ ok: false, error, message, ...extra }, status, extraHeaders);

export const clean = (value, max = 2000) => String(value ?? "").trim().slice(0, max);

export const now = () => new Date().toISOString();

export const getIp = (request) =>
  request.headers.get("CF-Connecting-IP") ||
  request.headers.get("X-Forwarded-For") ||
  "";

export const getUa = (request) => clean(request.headers.get("User-Agent"), 500);

export const normalizeArray = (value, maxItem = 180) => {
  if (Array.isArray(value)) return value.map((item) => clean(item, maxItem)).filter(Boolean);
  if (!value) return [];
  return [clean(value, maxItem)].filter(Boolean);
};

export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(clean(value, 180));

export const normalizePhone = (value) => clean(value, 80).replace(/[^\d+]/g, "");

export const isValidPhone = (value) => {
  const phone = normalizePhone(value);
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
};

export async function readJson(request) {
  try {
    return { ok: true, payload: await request.json() };
  } catch {
    return { ok: false, response: jsonError("invalid_json", "Invalid JSON body.", 400) };
  }
}

export const requireDb = (env) => {
  if (!env.DB) return { ok: false, response: jsonError("d1_binding_missing", "D1 DB binding missing.", 503) };
  return { ok: true };
};

export const authRoles = new Set([
  "admin",
  "manager",
  "partner",
  "client",
  "artist",
  "producer",
  "creator",
  "seller",
  "agent_later"
]);

const parseCookies = (request) => {
  const header = request.headers.get("Cookie") || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const index = item.indexOf("=");
        if (index === -1) return [item, ""];
        return [item.slice(0, index), decodeURIComponent(item.slice(index + 1))];
      })
  );
};

const toHex = (buffer) =>
  [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, "0")).join("");

const fromHex = (value) => {
  const cleanHex = clean(value, 1000);
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(cleanHex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
};

export const randomHex = (bytes = 32) => {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return [...values].map((value) => value.toString(16).padStart(2, "0")).join("");
};

export async function hashSessionToken(token) {
  const bytes = new TextEncoder().encode(token);
  return toHex(await crypto.subtle.digest("SHA-256", bytes));
}

const passwordAlgorithm = "pbkdf2_sha256";
// Cloudflare Workers Web Crypto currently rejects PBKDF2 counts above 100,000.
const passwordIterations = 100000;
const maxSupportedPasswordIterations = 100000;

const constantTimeEqual = (left, right) => {
  const a = fromHex(left);
  const b = fromHex(right);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a[index] ^ b[index];
  return diff === 0;
};

async function derivePasswordHash(password, salt, iterations) {
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > maxSupportedPasswordIterations) {
    throw new Error(`Unsupported PBKDF2 iteration count: ${iterations}`);
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new TextEncoder().encode(salt),
      iterations
    },
    key,
    256
  );
  return toHex(bits);
}

export async function hashPassword(password) {
  const salt = randomHex(16);
  const digest = await derivePasswordHash(password, salt, passwordIterations);
  return `${passwordAlgorithm}$${passwordIterations}$${salt}$${digest}`;
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, iterationsText, salt, digest] = clean(storedHash, 1000).split("$");
  const iterations = Number(iterationsText);
  if (algorithm !== passwordAlgorithm || !iterations || !salt || !digest) return false;
  if (iterations > maxSupportedPasswordIterations) return false;
  const candidate = await derivePasswordHash(password, salt, iterations);
  return constantTimeEqual(candidate, digest);
}

export async function createSession(env, request, userId, activeWorkspaceId = null) {
  const token = randomHex(32);
  const timestamp = now();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(
    `INSERT INTO sessions (
      id, user_id, session_token_hash, active_workspace_id, status, expires_at,
      created_at, updated_at, last_seen_at, ip, user_agent
    ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      crypto.randomUUID(),
      userId,
      await hashSessionToken(token),
      activeWorkspaceId || null,
      expiresAt,
      timestamp,
      timestamp,
      timestamp,
      getIp(request),
      getUa(request)
    )
    .run();

  return { token, expires_at: expiresAt };
}

export const sessionCookie = (token, request) => {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `boostr_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`;
};

export const clearSessionCookie = (request) => {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `boostr_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
};

export const getSessionToken = (request) => {
  const authorization = clean(request.headers.get("Authorization"), 1000);
  if (authorization.toLowerCase().startsWith("bearer ")) return clean(authorization.slice(7), 1000);
  return clean(request.headers.get("X-BOOSTR-Session") || parseCookies(request).boostr_session || "", 1000);
};

const managerPinFallback = (request, env) => {
  const allowed = env.ENVIRONMENT === "development" || env.ALLOW_MANAGER_PIN_FALLBACK === "true";
  if (!allowed) return null;

  const configured = clean(env.MANAGER_PIN || env.ADMIN_PIN || "", 120);
  const supplied = clean(request.headers.get("X-Manager-Pin") || "", 120);
  if (!configured || supplied !== configured) return null;

  return {
    ok: true,
    dev_fallback: true,
    user: {
      id: "dev-manager",
      email: "dev-manager@boostr.local",
      name: "Development Manager",
      role: "manager",
      status: "active"
    },
    session: null,
    memberships: [],
    roles: ["manager"],
    active_workspace_id: null
  };
};

export async function requireSession(request, env) {
  if (!env.DB) return { ok: false, response: jsonError("d1_binding_missing", "D1 DB binding missing.", 503) };

  const fallback = managerPinFallback(request, env);
  if (fallback) return fallback;

  const token = getSessionToken(request);
  if (!token) return { ok: false, response: jsonError("missing_session", "Missing session.", 401) };

  const tokenHash = await hashSessionToken(token);
  const current = now();
  const row = await env.DB.prepare(
    `SELECT
       sessions.id AS session_id,
       sessions.active_workspace_id,
       sessions.expires_at,
       users.id AS user_id,
       users.email,
       users.name,
       users.role,
       users.workspace_id,
       users.status
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.session_token_hash = ?
       AND sessions.status = 'active'
       AND sessions.revoked_at IS NULL
       AND sessions.expires_at > ?
     LIMIT 1`
  )
    .bind(tokenHash, current)
    .first();

  if (!row?.user_id) return { ok: false, response: jsonError("invalid_session", "Invalid session.", 401) };
  if (row.status && !["active", "invited"].includes(row.status)) {
    return { ok: false, response: jsonError("user_inactive", "User is not active.", 403) };
  }

  await env.DB.prepare("UPDATE sessions SET last_seen_at = ?, updated_at = ? WHERE id = ?")
    .bind(current, current, row.session_id)
    .run();

  const membershipResult = await env.DB.prepare(
    `SELECT workspace_members.workspace_id, workspace_members.role, workspace_members.status,
            workspaces.name AS workspace_name, workspaces.type AS workspace_type, workspaces.slug AS workspace_slug
     FROM workspace_members
     LEFT JOIN workspaces ON workspaces.id = workspace_members.workspace_id
     WHERE workspace_members.user_id = ?
       AND workspace_members.status = 'active'
     ORDER BY workspace_members.created_at ASC`
  )
    .bind(row.user_id)
    .all();

  const memberships = membershipResult.results || [];
  const roles = [...new Set([row.role, ...memberships.map((item) => item.role)].filter((role) => authRoles.has(role)))];
  const activeWorkspace = clean(row.active_workspace_id || row.workspace_id || memberships[0]?.workspace_id || "", 120) || null;

  return {
    ok: true,
    user: {
      id: row.user_id,
      email: row.email,
      name: row.name,
      role: row.role,
      status: row.status
    },
    session: {
      id: row.session_id,
      expires_at: row.expires_at
    },
    memberships,
    roles,
    active_workspace_id: activeWorkspace
  };
}

export async function requireRole(request, env, roles) {
  const auth = await requireSession(request, env);
  if (!auth.ok) return auth;

  const allowed = new Set(Array.isArray(roles) ? roles : [roles]);
  if (!auth.roles.some((role) => allowed.has(role))) {
    return { ok: false, response: jsonError("forbidden", "Forbidden.", 403) };
  }

  return auth;
}

export const authCanSeeAll = (auth) =>
  Boolean(auth?.dev_fallback || auth?.roles?.includes("admin") || auth?.roles?.includes("manager"));

export function requireWorkspaceAccess(auth, workspaceId) {
  const workspace = clean(workspaceId, 120);
  if (authCanSeeAll(auth)) return { ok: true };
  if (!workspace) return { ok: false, response: jsonError("workspace_id_required", "workspace_id is required.", 400) };
  if (auth.memberships?.some((member) => member.workspace_id === workspace && member.status === "active")) {
    return { ok: true };
  }
  return { ok: false, response: jsonError("workspace_access_denied", "Workspace access denied.", 403) };
}

export const defaultWorkspaceId = (auth) =>
  clean(auth?.active_workspace_id || auth?.memberships?.[0]?.workspace_id || "", 120) || null;

export const managerAuth = (request, env) => {
  const configured = clean(env.MANAGER_PIN || env.ADMIN_PIN || "", 120);
  if (!configured) return { ok: false, response: jsonError("manager_pin_not_configured", "MANAGER_PIN is not configured.", 503) };

  const supplied = clean(request.headers.get("X-Manager-Pin") || "", 120);
  if (!supplied) return { ok: false, response: jsonError("missing_pin", "Missing PIN.", 401) };
  if (supplied !== configured) return { ok: false, response: jsonError("invalid_pin", "Invalid PIN.", 401) };
  return { ok: true };
};

export const allowedStatus = new Set([
  "new",
  "reviewing",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
  "archived"
]);

export function normalizeStatus(value, fallback = "new") {
  const status = clean(value, 40).toLowerCase();
  return allowedStatus.has(status) ? status : fallback;
}

export async function canAccessModule(env, workspaceId, moduleSlug) {
  const workspace = clean(workspaceId, 120);
  const slug = clean(moduleSlug, 120);
  if (!env.DB || !workspace || !slug) return false;

  const module = await env.DB.prepare("SELECT id FROM modules WHERE slug = ? LIMIT 1").bind(slug).first();
  if (!module?.id) return false;

  const access = await env.DB.prepare(
    "SELECT status FROM workspace_modules WHERE workspace_id = ? AND module_id = ? LIMIT 1"
  )
    .bind(workspace, module.id)
    .first();

  return access?.status === "active";
}

export async function addLeadEvent(env, event) {
  if (!env.DB) return { stored: false, reason: "D1 DB binding missing." };

  const createdAt = event.created_at || now();
  await env.DB.prepare(
    `INSERT INTO lead_events (
      id, workspace_id, lead_id, audit_submission_id, event_type, payload_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      event.id || crypto.randomUUID(),
      event.workspace_id || null,
      event.lead_id || null,
      event.audit_submission_id || null,
      clean(event.event_type || "note", 80),
      JSON.stringify(event.payload || {}),
      createdAt
    )
    .run();

  return { stored: true };
}