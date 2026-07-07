import { addLeadEvent, clean, json, managerAuth, normalizeStatus, now, readJson, requireDb } from "../../_lib/api.js";

const leadColumns = `
  id, source, contact_name, contact_email, contact_phone, preferred_contact_method,
  business_name, industry, project_goal, budget_range, timeline, current_status,
  message, status, assigned_to, created_at, updated_at
`;

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = managerAuth(request, env);
  if (!auth.ok) return auth.response;

  const id = clean(params.id, 120);
  const lead = await env.DB.prepare(`SELECT ${leadColumns} FROM leads WHERE id = ?`).bind(id).first();
  if (!lead) return json({ ok: false, error: "Lead not found." }, 404);

  const events = await env.DB.prepare(
    `SELECT id, event_type, payload_json, created_at
     FROM lead_events
     WHERE lead_id = ?
     ORDER BY created_at DESC
     LIMIT 50`
  )
    .bind(id)
    .all();

  return json({ ok: true, lead, events: events.results || [] });
}

export async function onRequestPatch({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = managerAuth(request, env);
  if (!auth.ok) return auth.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const id = clean(params.id, 120);
  const existing = await env.DB.prepare("SELECT id, status, assigned_to FROM leads WHERE id = ?").bind(id).first();
  if (!existing) return json({ ok: false, error: "Lead not found." }, 404);

  const payload = parsed.payload || {};
  const updatedAt = now();
  const status = normalizeStatus(payload.status, existing.status || "new");
  const assignedTo = clean(payload.assigned_to ?? existing.assigned_to ?? "", 120);
  const note = clean(payload.note || payload.message || "", 2000);

  await env.DB.prepare(
    `UPDATE leads
     SET status = ?, assigned_to = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(status, assignedTo, updatedAt, id)
    .run();

  const changed = status !== existing.status || assignedTo !== (existing.assigned_to || "");
  await addLeadEvent(env, {
    lead_id: id,
    event_type: changed ? "lead.updated" : "lead.note",
    payload: {
      status,
      assigned_to: assignedTo,
      previous_status: existing.status,
      previous_assigned_to: existing.assigned_to,
      note
    },
    created_at: updatedAt
  });

  return json({ ok: true, id, status, assigned_to: assignedTo, updated_at: updatedAt });
}
