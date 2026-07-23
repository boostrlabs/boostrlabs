const COOKIE_NAME = "nne_session";
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const PASSWORD_ITERATIONS = 100000;
const encoder = new TextEncoder();

export const now = () => new Date().toISOString();
export const clean = (value, max = 2000) => String(value ?? "").trim().slice(0, max);
export const normalizeEmail = (value) => clean(value, 180).toLowerCase();
export const normalizeUsername = (value) =>
  clean(value, 40).toLowerCase().replace(/[^a-z0-9_-]/g, "");
export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(normalizeEmail(value));
export const isValidUsername = (value) => /^[a-z0-9][a-z0-9_-]{2,31}$/.test(value);
export const getIp = (request) =>
  clean(request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For"), 180);
export const getUa = (request) => clean(request.headers.get("User-Agent"), 500);

export const json = (body, status = 200, extraHeaders = {}) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders
    }
  });

export const jsonOk = (body = {}, status = 200, extraHeaders = {}) =>
  json({ ok: true, ...body }, status, extraHeaders);

export const jsonError = (error, message, status = 400, extra = {}, extraHeaders = {}) =>
  json({ ok: false, error, message, ...extra }, status, extraHeaders);

export async function readJson(request) {
  try {
    return { ok: true, payload: await request.json() };
  } catch {
    return { ok: false, response: jsonError("invalid_json", "El cuerpo de la solicitud no es válido.", 400) };
  }
}

export function requireNneDb(env) {
  if (!env.DB) {
    return {
      ok: false,
      response: jsonError("nne_database_unavailable", "La base de datos de NNE no está disponible.", 503)
    };
  }
  return { ok: true };
}

const toHex = (buffer) =>
  [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, "0")).join("");

const fromHex = (value) => {
  const hex = clean(value, 1000);
  if (!/^[a-f0-9]+$/i.test(hex) || hex.length % 2 !== 0) return new Uint8Array();
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
};

const constantTimeEqual = (left, right) => {
  const a = fromHex(left);
  const b = fromHex(right);
  if (a.length === 0 || a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
};

export const randomHex = (bytes = 32) => {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return toHex(values);
};

export async function sha256(value) {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function derivePasswordHash(password, salt, iterations) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: encoder.encode(salt),
      iterations
    },
    key,
    256
  );
  return toHex(bits);
}

export async function hashNnePassword(password) {
  const salt = randomHex(16);
  const digest = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS);
  return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${salt}$${digest}`;
}

export async function verifyNnePassword(password, storedHash) {
  const [algorithm, iterationsText, salt, digest] = clean(storedHash, 1000).split("$");
  const iterations = Number(iterationsText);
  if (
    algorithm !== "pbkdf2_sha256" ||
    !Number.isInteger(iterations) ||
    iterations < 1 ||
    iterations > PASSWORD_ITERATIONS ||
    !salt ||
    !digest
  ) {
    return false;
  }
  const candidate = await derivePasswordHash(password, salt, iterations);
  return constantTimeEqual(candidate, digest);
}

const parseCookies = (request) => {
  const result = {};
  for (const part of (request.headers.get("Cookie") || "").split(";")) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator);
    try {
      result[key] = decodeURIComponent(trimmed.slice(separator + 1));
    } catch {
      result[key] = "";
    }
  }
  return result;
};

export const nneSessionCookie = (token, request) => {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure}`;
};

export const clearNneSessionCookie = (request) => {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
};

export const getNneSessionToken = (request) => {
  const authorization = clean(request.headers.get("Authorization"), 1000);
  if (authorization.toLowerCase().startsWith("bearer ")) {
    return clean(authorization.slice(7), 1000);
  }
  return clean(request.headers.get("X-NNE-Session") || parseCookies(request)[COOKIE_NAME], 1000);
};

export async function createNneSession(env, request, userId) {
  const token = randomHex(32);
  const timestamp = now();
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  await env.DB.prepare(
    `INSERT INTO nne_sessions (
      id, user_id, token_hash, status, expires_at, created_at, last_seen_at, ip, user_agent
    ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?)`
  )
    .bind(
      crypto.randomUUID(),
      userId,
      await sha256(token),
      expiresAt,
      timestamp,
      timestamp,
      getIp(request),
      getUa(request)
    )
    .run();
  return { token, expires_at: expiresAt };
}

export async function requireNneSession(request, env) {
  const db = requireNneDb(env);
  if (!db.ok) return db;

  const token = getNneSessionToken(request);
  if (!token) {
    return { ok: false, response: jsonError("nne_session_required", "Inicia sesión para continuar.", 401) };
  }

  const timestamp = now();
  const row = await env.DB.prepare(
    `SELECT
       s.id AS session_id,
       s.expires_at,
       u.id,
       u.email,
       u.username,
       u.display_name,
       u.role,
       u.status,
       u.avatar_url,
       p.level,
       p.xp,
       p.streak_days,
       p.nne_score,
       p.title,
       p.completed_quest_count,
       COALESCE((
         SELECT SUM(t.amount)
         FROM nne_credit_transactions t
         WHERE t.user_id = u.id
       ), 0) AS credits
     FROM nne_sessions s
     JOIN nne_users u ON u.id = s.user_id
     JOIN nne_profiles p ON p.user_id = u.id
     WHERE s.token_hash = ?
       AND s.status = 'active'
       AND s.expires_at > ?
     LIMIT 1`
  )
    .bind(await sha256(token), timestamp)
    .first();

  if (!row?.id) {
    return { ok: false, response: jsonError("nne_session_invalid", "La sesión expiró. Vuelve a iniciar sesión.", 401) };
  }
  if (row.status !== "active") {
    return { ok: false, response: jsonError("nne_user_inactive", "Esta cuenta no está activa.", 403) };
  }

  await env.DB.prepare("UPDATE nne_sessions SET last_seen_at = ? WHERE id = ?")
    .bind(timestamp, row.session_id)
    .run();

  return {
    ok: true,
    session: { id: row.session_id, expires_at: row.expires_at },
    user: {
      id: row.id,
      email: row.email,
      username: row.username,
      handle: `@${row.username}`,
      name: row.display_name,
      role: row.role,
      avatar_url: row.avatar_url || null,
      level: Number(row.level || 1),
      xp: Number(row.xp || 0),
      streak_days: Number(row.streak_days || 0),
      nne_score: Number(row.nne_score || 0),
      title: row.title,
      completed_quest_count: Number(row.completed_quest_count || 0),
      credits: Number(row.credits || 0)
    }
  };
}

export async function requireNneAdmin(request, env) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth;
  if (auth.user.role !== "admin") {
    return { ok: false, response: jsonError("nne_admin_required", "Se requiere acceso de administrador.", 403) };
  }
  return auth;
}

export async function enforceNneRateLimit(env, key, limit, windowSeconds) {
  const currentMs = Date.now();
  const windowStartMs = Math.floor(currentMs / (windowSeconds * 1000)) * windowSeconds * 1000;
  const windowStart = new Date(windowStartMs).toISOString();
  const expiresAt = new Date(windowStartMs + windowSeconds * 1000).toISOString();

  await env.DB.prepare(
    `INSERT INTO nne_rate_limits (key, window_start, hit_count, expires_at)
     VALUES (?, ?, 1, ?)
     ON CONFLICT(key, window_start)
     DO UPDATE SET hit_count = hit_count + 1`
  )
    .bind(clean(key, 240), windowStart, expiresAt)
    .run();

  const row = await env.DB.prepare(
    "SELECT hit_count FROM nne_rate_limits WHERE key = ? AND window_start = ?"
  )
    .bind(clean(key, 240), windowStart)
    .first();

  return Number(row?.hit_count || 0) <= limit;
}

export async function writeNneAudit(env, request, actorUserId, action, entityType, entityId, metadata = {}) {
  await env.DB.prepare(
    `INSERT INTO nne_audit_events (
      id, actor_user_id, action, entity_type, entity_id, metadata_json, ip, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      crypto.randomUUID(),
      actorUserId || null,
      clean(action, 100),
      clean(entityType, 80),
      clean(entityId, 120) || null,
      JSON.stringify(metadata || {}),
      getIp(request),
      now()
    )
    .run();
}

export const onOptions = () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-NNE-Session",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS"
    }
  });
