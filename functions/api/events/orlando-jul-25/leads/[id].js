import { addLeadEvent, clean, json, jsonError, now, readJson, requireDb, requireRole, requireWorkspaceAccess } from "../../../../_lib/api.js";

const SOURCE = "boostr-event-os-orlando-jul-25";
const WORKSPACE_SLUG = "event-orlando-jul-25";
const ALLOWED_STATUSES = new Set(["new", "contacted", "payment_sent", "paid", "confirmed", "cancelled"]);

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPatch({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, ["admin", "manager", "partner", "artist"]);
  if (!auth.ok) return auth.response;

  const eventWorkspace = await env.DB.prepare("SELECT id FROM workspaces WHERE slug = ? AND status = 'active' LIMIT 1")
    .bind(WORKSPACE_SLUG)
    .first();
  if (!eventWorkspace?.id) return jsonError("event_workspace_not_ready", "Event workspace is not ready.", 409);

  const access = requireWorkspaceAccess(auth, eventWorkspace.id);
  if (!access.ok) return access.response;

  const id = clean(params.id, 120);
  const existing = await env.DB.prepare(
    "SELECT id, workspace_id, source, status, assigned_to FROM leads WHERE id = ? LIMIT 1"
  ).bind(id).first();

  if (!existing || existing.workspace_id !== eventWorkspace.id || existing.source !== SOURCE) {
    return jsonError("event_lead_not_found", "Event lead not found.", 404);
  }

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};
  const status = clean(payload.status || existing.status, 40);
  if (!ALLOWED_STATUSES.has(status)) {
    return jsonError("invalid_event_lead_status", "Invalid event lead status.", 400);
  }

  const assignedTo = clean(payload.assigned_to ?? existing.assigned_to ?? "", 120);
  const note = clean(payload.note, 1200);
  const updatedAt = now();

  await env.DB.prepare(
    "UPDATE leads SET status = ?, assigned_to = ?, updated_at = ? WHERE id = ?"
  ).bind(status, assignedTo, updatedAt, id).run();

  await addLeadEvent(env, {
    workspace_id: eventWorkspace.id,
    lead_id: id,
    event_type: status !== existing.status ? "event.presale_status_changed" : "event.presale_lead_updated",
    payload: {
      status,
      previous_status: existing.status,
      assigned_to: assignedTo,
      previous_assigned_to: existing.assigned_to,
      note,
      updated_by_user_id: auth.user.id
    },
    created_at: updatedAt
  });

  return json({ ok: true, id, status, assigned_to: assignedTo, updated_at: updatedAt });
}
