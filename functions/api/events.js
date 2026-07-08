import { clean, json, managerAuth, requireDb } from "../_lib/api.js";

const clampLimit = (value) => Math.min(Math.max(Number(value || 50) || 50, 1), 100);
const like = (value) => `%${clean(value, 160)}%`;

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = managerAuth(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = clampLimit(url.searchParams.get("limit"));
  const leadId = clean(url.searchParams.get("lead_id"), 120);
  const auditId = clean(url.searchParams.get("audit_submission_id"), 120);
  const eventType = clean(url.searchParams.get("event_type"), 80);
  const q = clean(url.searchParams.get("q"), 160);
  const filters = [];
  const binds = [];

  if (leadId) {
    filters.push("lead_id = ?");
    binds.push(leadId);
  }
  if (auditId) {
    filters.push("audit_submission_id = ?");
    binds.push(auditId);
  }
  if (eventType) {
    filters.push("event_type = ?");
    binds.push(eventType);
  }
  if (q) {
    filters.push("(event_type LIKE ? OR payload_json LIKE ?)");
    binds.push(like(q), like(q));
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const result = await env.DB.prepare(
    `SELECT id, lead_id, audit_submission_id, event_type, payload_json, created_at
     FROM lead_events
     ${where}
     ORDER BY created_at DESC
     LIMIT ?`
  )
    .bind(...binds, limit)
    .all();

  return json({ ok: true, events: result.results || [] });
}
