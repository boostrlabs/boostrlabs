import { clean, json, jsonError, readJson, requireDb, requireSession } from "../../../_lib/api.js";
import {
  ensureParkingSchema,
  lookupParkingSession,
  normalizePlate,
  parkingComputedStatus,
  recordParkingVerification
} from "../../../_lib/smart-parking.js";

async function authorize(request, env) {
  const auth = await requireSession(request, env);
  if (!auth.ok) return auth;
  const workspace = await env.DB.prepare("SELECT id, name, slug FROM workspaces WHERE slug = 'omni-jr-parking' AND status = 'active' LIMIT 1").first();
  if (!workspace?.id) return { ok: false, response: jsonError("omni_workspace_missing", "OMNI JR no está configurado.", 404) };
  const membership = (auth.memberships || []).find((item) => item.workspace_id === workspace.id && item.status === "active");
  const globalRole = clean(auth.user?.role, 40).toLowerCase();
  const allowed = membership && ["manager", "admin", "partner"].includes(clean(membership.role, 40).toLowerCase());
  const globalAdmin = ["admin"].includes(globalRole);
  if (!allowed && !globalAdmin) return { ok: false, response: jsonError("parking_manager_access_denied", "No tienes acceso al panel de OMNI JR.", 403) };
  return { ok: true, auth, workspace, membership };
}

function sessionPayload(row) {
  if (!row) return null;
  return {
    id: row.id,
    plate: row.plate,
    plate_normalized: row.plate_normalized,
    vehicle_class: row.vehicle_class,
    plan_type: row.plan_type,
    status: parkingComputedStatus(row),
    stored_status: row.status,
    starts_at: row.starts_at,
    expires_at: row.expires_at,
    customer_email: row.customer_email,
    verification_token: row.verification_token,
    payment_id: row.payment_id
  };
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const access = await authorize(request, env);
  if (!access.ok) return access.response;
  await ensureParkingSchema(env);

  const url = new URL(request.url);
  if (url.searchParams.get("recent") === "1") {
    const result = await env.DB.prepare(`
      SELECT * FROM parking_sessions
      WHERE workspace_id = ?
      ORDER BY created_at DESC LIMIT 30
    `).bind(access.workspace.id).all();
    return json({ ok: true, operator: "OMNI JR Parking", sessions: (result.results || []).map(sessionPayload) });
  }

  const token = clean(url.searchParams.get("token"), 160);
  const plate = clean(url.searchParams.get("plate"), 24);
  if (!token && !plate) return jsonError("verification_query_required", "Escanea un QR o escribe una placa.", 400);
  const row = await lookupParkingSession(env, access.workspace.id, { token, plate });
  const status = parkingComputedStatus(row);
  await recordParkingVerification(env, {
    workspaceId: access.workspace.id,
    sessionId: row?.id || null,
    userId: access.auth.user?.id || null,
    method: token ? "qr" : "plate",
    queryValue: token || normalizePlate(plate),
    resultStatus: status,
    metadata: { source: "manager_panel" }
  });
  return json({ ok: true, found: Boolean(row), result: status, session: sessionPayload(row) });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const access = await authorize(request, env);
  if (!access.ok) return access.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const token = clean(parsed.payload?.token, 160);
  const plate = clean(parsed.payload?.plate, 24);
  if (!token && !plate) return jsonError("verification_query_required", "Escanea un QR o escribe una placa.", 400);
  const row = await lookupParkingSession(env, access.workspace.id, { token, plate });
  const status = parkingComputedStatus(row);
  await recordParkingVerification(env, {
    workspaceId: access.workspace.id,
    sessionId: row?.id || null,
    userId: access.auth.user?.id || null,
    method: token ? "qr" : "plate",
    queryValue: token || normalizePlate(plate),
    resultStatus: status,
    metadata: { source: "manager_panel" }
  });
  return json({ ok: true, found: Boolean(row), result: status, session: sessionPayload(row) });
}
