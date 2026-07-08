export const json = (body, status = 200, extraHeaders = {}) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, X-Manager-Pin",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      ...extraHeaders
    }
  });

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
    return { ok: false, response: json({ ok: false, error: "Invalid JSON body." }, 400) };
  }
}

export const requireDb = (env) => {
  if (!env.DB) return { ok: false, response: json({ ok: false, error: "D1 DB binding missing." }, 503) };
  return { ok: true };
};

export const managerAuth = (request, env) => {
  const configured = clean(env.MANAGER_PIN || env.ADMIN_PIN || "", 120);
  if (!configured) return { ok: false, response: json({ ok: false, error: "MANAGER_PIN is not configured." }, 503) };

  const url = new URL(request.url);
  const supplied = clean(request.headers.get("X-Manager-Pin") || url.searchParams.get("pin") || "", 120);
  if (!supplied) return { ok: false, response: json({ ok: false, error: "Missing PIN." }, 401) };
  if (supplied !== configured) return { ok: false, response: json({ ok: false, error: "Invalid PIN." }, 401) };
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

export async function addLeadEvent(env, event) {
  if (!env.DB) return { stored: false, reason: "D1 DB binding missing." };

  const createdAt = event.created_at || now();
  await env.DB.prepare(
    `INSERT INTO lead_events (
      id, lead_id, audit_submission_id, event_type, payload_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      event.id || crypto.randomUUID(),
      event.lead_id || null,
      event.audit_submission_id || null,
      clean(event.event_type || "note", 80),
      JSON.stringify(event.payload || {}),
      createdAt
    )
    .run();

  return { stored: true };
}
