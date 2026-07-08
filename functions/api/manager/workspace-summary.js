import { clean, json, managerAuth, requireDb } from "../../_lib/api.js";

const countValue = (row) => Number(row?.total || 0);

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = managerAuth(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const workspaceId = clean(url.searchParams.get("workspace_id"), 120);
  if (!workspaceId) {
    return json({ ok: false, error: "workspace_id is required." }, 400);
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    modules,
    leadTotal,
    leadNewLast7d,
    leadsByStatus,
    audits,
    orderTotal,
    ordersByStatus,
    recentEvents
  ] = await Promise.all([
    env.DB.prepare(
      `SELECT modules.slug, modules.name, COALESCE(workspace_modules.status, 'locked') AS status
       FROM modules
       LEFT JOIN workspace_modules
         ON workspace_modules.module_id = modules.id
        AND workspace_modules.workspace_id = ?
       ORDER BY modules.category, modules.name`
    )
      .bind(workspaceId)
      .all(),
    env.DB.prepare("SELECT COUNT(*) AS total FROM leads WHERE workspace_id = ?")
      .bind(workspaceId)
      .first(),
    env.DB.prepare("SELECT COUNT(*) AS total FROM leads WHERE workspace_id = ? AND status = 'new' AND created_at >= ?")
      .bind(workspaceId, sevenDaysAgo)
      .first(),
    env.DB.prepare("SELECT status, COUNT(*) AS total FROM leads WHERE workspace_id = ? GROUP BY status ORDER BY total DESC")
      .bind(workspaceId)
      .all(),
    env.DB.prepare("SELECT COUNT(*) AS total, MAX(created_at) AS last_submitted_at FROM audit_submissions WHERE workspace_id = ?")
      .bind(workspaceId)
      .first(),
    env.DB.prepare("SELECT COUNT(*) AS total FROM orders WHERE workspace_id = ?")
      .bind(workspaceId)
      .first(),
    env.DB.prepare("SELECT payment_status AS status, COUNT(*) AS total FROM orders WHERE workspace_id = ? GROUP BY payment_status ORDER BY total DESC")
      .bind(workspaceId)
      .all(),
    env.DB.prepare(
      `SELECT id, lead_id, audit_submission_id, event_type, payload_json, created_at
       FROM lead_events
       WHERE workspace_id = ?
       ORDER BY created_at DESC
       LIMIT 10`
    )
      .bind(workspaceId)
      .all()
  ]);

  return json({
    ok: true,
    workspace_id: workspaceId,
    modules: modules.results || [],
    leads: {
      total: countValue(leadTotal),
      new_last_7d: countValue(leadNewLast7d),
      by_status: leadsByStatus.results || []
    },
    audits: {
      total: countValue(audits),
      last_submitted_at: audits?.last_submitted_at || null
    },
    orders: {
      total: countValue(orderTotal),
      by_status: ordersByStatus.results || []
    },
    recent_events: recentEvents.results || []
  });
}
