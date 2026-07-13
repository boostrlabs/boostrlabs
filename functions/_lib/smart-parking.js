import { clean, now } from "./api.js";

export function parseParkingJson(value) {
  try { return value ? JSON.parse(value) : {}; } catch { return {}; }
}

export function normalizePlate(value) {
  return clean(value, 24).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function ensureParkingSchema(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS parking_sessions (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      payment_id TEXT NOT NULL UNIQUE,
      payment_link_id TEXT,
      operator_slug TEXT NOT NULL,
      plate TEXT NOT NULL,
      plate_normalized TEXT NOT NULL,
      vehicle_class TEXT,
      plan_type TEXT NOT NULL DEFAULT 'single',
      status TEXT NOT NULL DEFAULT 'active',
      starts_at TEXT NOT NULL,
      expires_at TEXT,
      verification_token TEXT NOT NULL UNIQUE,
      customer_email TEXT,
      metadata_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_parking_sessions_plate ON parking_sessions(workspace_id, plate_normalized, created_at DESC)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_parking_sessions_token ON parking_sessions(verification_token)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_parking_sessions_status ON parking_sessions(workspace_id, status, expires_at)").run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS parking_verifications (
      id TEXT PRIMARY KEY,
      parking_session_id TEXT,
      workspace_id TEXT NOT NULL,
      verified_by_user_id TEXT,
      method TEXT NOT NULL,
      query_value TEXT,
      result_status TEXT NOT NULL,
      metadata_json TEXT,
      created_at TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_parking_verifications_created ON parking_verifications(workspace_id, created_at DESC)").run();
}

function addHours(iso, hours) {
  return new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000).toISOString();
}

function addMonth(iso) {
  const date = new Date(iso);
  date.setUTCMonth(date.getUTCMonth() + 1);
  return date.toISOString();
}

export async function syncParkingSession(env, paymentId, paymentStatus = "paid") {
  await ensureParkingSchema(env);
  const row = await env.DB.prepare(`
    SELECT stripe_payments.id, stripe_payments.workspace_id, stripe_payments.payment_link_id,
           stripe_payments.customer_email, stripe_payments.metadata_json AS payment_metadata_json,
           stripe_payments.created_at AS payment_created_at,
           payment_links.metadata_json AS link_metadata_json,
           workspaces.slug AS workspace_slug
    FROM stripe_payments
    JOIN payment_links ON payment_links.id = stripe_payments.payment_link_id
    LEFT JOIN workspaces ON workspaces.id = stripe_payments.workspace_id
    WHERE stripe_payments.id = ? LIMIT 1
  `).bind(paymentId).first();
  if (!row?.id) return null;

  const paymentMeta = parseParkingJson(row.payment_metadata_json);
  const linkMeta = parseParkingJson(row.link_metadata_json);
  const operator = clean(linkMeta.operator || paymentMeta.operator, 80).toLowerCase();
  if (operator !== "omni_jr") return null;

  const plate = clean(paymentMeta.parking_plate || paymentMeta.plate, 24).toUpperCase();
  const plateNormalized = normalizePlate(plate);
  if (!plateNormalized) return null;

  const existing = await env.DB.prepare("SELECT * FROM parking_sessions WHERE payment_id = ? LIMIT 1").bind(paymentId).first();
  const timestamp = now();
  const planType = clean(linkMeta.plan_type || paymentMeta.parking_plan_type || "single", 40).toLowerCase();
  const startsAt = existing?.starts_at || timestamp;
  const maxHours = Math.min(24, Math.max(1, Number(linkMeta.max_hours || paymentMeta.parking_max_hours || 8)));
  const expiresAt = existing?.expires_at || (planType === "monthly" ? addMonth(startsAt) : addHours(startsAt, maxHours));
  const mappedStatus = paymentStatus === "paid"
    ? "active"
    : paymentStatus === "refunded"
      ? "revoked"
      : ["failed", "canceled", "expired"].includes(paymentStatus)
        ? "invalid"
        : existing?.status || "pending";
  const token = existing?.verification_token || crypto.randomUUID().replace(/-/g, "");
  const metadata = JSON.stringify({
    source: "boostr_smart_parking",
    payment_status: paymentStatus,
    parking_code: linkMeta.parking_code || null,
    amount_class: linkMeta.vehicle_class || paymentMeta.parking_vehicle_class || null,
    max_hours: maxHours
  });

  if (existing?.id) {
    await env.DB.prepare(`
      UPDATE parking_sessions
      SET plate = ?, plate_normalized = ?, vehicle_class = ?, plan_type = ?, status = ?,
          expires_at = ?, customer_email = COALESCE(?, customer_email), metadata_json = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      plate,
      plateNormalized,
      clean(linkMeta.vehicle_class || paymentMeta.parking_vehicle_class, 80) || null,
      planType,
      mappedStatus,
      expiresAt,
      row.customer_email || null,
      metadata,
      timestamp,
      existing.id
    ).run();
    return await env.DB.prepare("SELECT * FROM parking_sessions WHERE id = ? LIMIT 1").bind(existing.id).first();
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO parking_sessions (
      id, workspace_id, payment_id, payment_link_id, operator_slug, plate, plate_normalized,
      vehicle_class, plan_type, status, starts_at, expires_at, verification_token,
      customer_email, metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'omni-jr-parking', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    row.workspace_id,
    row.id,
    row.payment_link_id,
    plate,
    plateNormalized,
    clean(linkMeta.vehicle_class || paymentMeta.parking_vehicle_class, 80) || null,
    planType,
    mappedStatus,
    startsAt,
    expiresAt,
    token,
    row.customer_email || null,
    metadata,
    timestamp,
    timestamp
  ).run();
  return await env.DB.prepare("SELECT * FROM parking_sessions WHERE id = ? LIMIT 1").bind(id).first();
}

export function parkingComputedStatus(session) {
  if (!session) return "not_found";
  if (["revoked", "invalid"].includes(session.status)) return session.status;
  if (session.expires_at && new Date(session.expires_at).getTime() <= Date.now()) return "expired";
  return session.status === "active" ? "valid" : session.status;
}

export async function lookupParkingSession(env, workspaceId, { token = "", plate = "" } = {}) {
  await ensureParkingSchema(env);
  const cleanToken = clean(token, 160);
  const normalizedPlate = normalizePlate(plate);
  let row = null;
  if (cleanToken) {
    row = await env.DB.prepare(`
      SELECT * FROM parking_sessions
      WHERE workspace_id = ? AND verification_token = ?
      LIMIT 1
    `).bind(workspaceId, cleanToken).first();
  } else if (normalizedPlate) {
    row = await env.DB.prepare(`
      SELECT * FROM parking_sessions
      WHERE workspace_id = ? AND plate_normalized = ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(workspaceId, normalizedPlate).first();
  }
  if (row && parkingComputedStatus(row) === "expired" && row.status === "active") {
    await env.DB.prepare("UPDATE parking_sessions SET status = 'expired', updated_at = ? WHERE id = ?").bind(now(), row.id).run();
    row.status = "expired";
  }
  return row;
}

export async function recordParkingVerification(env, {
  workspaceId,
  sessionId = null,
  userId = null,
  method,
  queryValue,
  resultStatus,
  metadata = {}
}) {
  await ensureParkingSchema(env);
  await env.DB.prepare(`
    INSERT INTO parking_verifications (
      id, parking_session_id, workspace_id, verified_by_user_id, method,
      query_value, result_status, metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    sessionId,
    workspaceId,
    userId,
    clean(method, 40),
    clean(queryValue, 180),
    clean(resultStatus, 40),
    JSON.stringify(metadata || {}),
    now()
  ).run();
}

export function publicParkingTicket(session, origin = "") {
  if (!session) return null;
  const base = origin ? origin.replace(/\/$/, "") : "";
  const token = session.verification_token;
  return {
    id: session.id,
    plate: session.plate,
    vehicle_class: session.vehicle_class,
    plan_type: session.plan_type,
    status: parkingComputedStatus(session),
    starts_at: session.starts_at,
    expires_at: session.expires_at,
    token,
    public_url: `${base}/parking/omni-jr/ticket/${encodeURIComponent(token)}`,
    manager_verify_url: `${base}/app/parking/omni-jr/manager/?token=${encodeURIComponent(token)}`
  };
}
