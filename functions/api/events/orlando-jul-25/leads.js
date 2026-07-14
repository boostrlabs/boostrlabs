import { clean, json, jsonError, requireDb, requireRole, requireWorkspaceAccess } from "../../../_lib/api.js";

const SOURCE = "boostr-event-os-orlando-jul-25";
const WORKSPACE_SLUG = "event-orlando-jul-25";

export async function onRequestOptions() {
  return json({ ok: true });
}

async function workspace(env) {
  return env.DB.prepare("SELECT id, name, slug FROM workspaces WHERE slug = ? AND status = 'active' LIMIT 1")
    .bind(WORKSPACE_SLUG)
    .first();
}

const parseJson = (value) => {
  try { return JSON.parse(value || "{}"); } catch { return {}; }
};

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, ["admin", "manager", "partner", "artist"]);
  if (!auth.ok) return auth.response;

  const eventWorkspace = await workspace(env);
  if (!eventWorkspace?.id) return jsonError("event_workspace_not_ready", "Event workspace is not ready.", 409);

  const access = requireWorkspaceAccess(auth, eventWorkspace.id);
  if (!access.ok) return access.response;

  const url = new URL(request.url);
  const q = clean(url.searchParams.get("q"), 120);
  const status = clean(url.searchParams.get("status"), 40);
  const binds = [eventWorkspace.id, SOURCE];
  const filters = ["workspace_id = ?", "source = ?"];

  if (status) {
    filters.push("status = ?");
    binds.push(status);
  }
  if (q) {
    filters.push("(contact_name LIKE ? OR contact_phone LIKE ? OR contact_email LIKE ? OR budget_range LIKE ?)");
    const like = `%${q}%`;
    binds.push(like, like, like, like);
  }

  const result = await env.DB.prepare(
    `SELECT id, contact_name, contact_email, contact_phone, preferred_contact_method,
            budget_range, current_status, message, status, assigned_to, created_at, updated_at
     FROM leads
     WHERE ${filters.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT 250`
  ).bind(...binds).all();

  const rows = (result.results || []).map((row) => {
    const metadata = parseJson(row.message);
    const eventData = parseJson(metadata.extra_message);
    return {
      ...row,
      metadata,
      quantity: Number(eventData.quantity || 0) || null,
      reference: metadata.referral_code || eventData.presale_reference || null
    };
  });

  const summary = rows.reduce((acc, row) => {
    acc.total += 1;
    acc[row.status || "new"] = (acc[row.status || "new"] || 0) + 1;
    return acc;
  }, { total: 0 });

  return json({ ok: true, workspace: eventWorkspace, rows, summary, role: auth.roles });
}
