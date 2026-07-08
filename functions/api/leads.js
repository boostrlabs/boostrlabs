import {
  addLeadEvent,
  authCanSeeAll,
  clean,
  defaultWorkspaceId,
  isValidEmail,
  isValidPhone,
  json,
  normalizePhone,
  normalizeStatus,
  now,
  readJson,
  requireDb,
  requireRole,
  requireWorkspaceAccess
} from "../_lib/api.js";

const leadColumns = `
  id, workspace_id, created_by_user_id, source, contact_name, contact_email, contact_phone, preferred_contact_method,
  business_name, industry, project_goal, budget_range, timeline, current_status,
  message, status, assigned_to, created_at, updated_at
`;

const auditColumns = `
  id, workspace_id, source, language, contact_name, contact_email, contact_phone, contact_raw,
  business_name, industry, stage, traffic, signals, recommended_modules, status, created_at
`;

const clampLimit = (value) => Math.min(Math.max(Number(value || 50) || 50, 1), 100);
const like = (value) => `%${clean(value, 160)}%`;
const readRoles = ["admin", "manager", "partner", "client", "artist"];

export async function onRequestOptions() {
  return json({ ok: true });
}

const resolveWorkspace = (auth, requested) => {
  const workspace = clean(requested, 120);
  if (workspace) return workspace;
  return authCanSeeAll(auth) ? null : defaultWorkspaceId(auth);
};

const applyWorkspaceFilter = (filters, binds, workspaceId) => {
  if (workspaceId) {
    filters.push("workspace_id = ?");
    binds.push(workspaceId);
  }
};

async function getSummary(env, workspaceId) {
  const leadWhere = workspaceId ? "WHERE workspace_id = ?" : "";
  const leadBinds = workspaceId ? [workspaceId] : [];
  const eventWhere = workspaceId ? "WHERE workspace_id = ?" : "";
  const eventBinds = workspaceId ? [workspaceId] : [];

  const [leadCounts, auditCounts, recentEvents] = await Promise.all([
    env.DB.prepare(`SELECT status, COUNT(*) AS total FROM leads ${leadWhere} GROUP BY status ORDER BY total DESC`).bind(...leadBinds).all(),
    env.DB.prepare(`SELECT status, COUNT(*) AS total FROM audit_submissions ${leadWhere} GROUP BY status ORDER BY total DESC`).bind(...leadBinds).all(),
    env.DB.prepare(`SELECT event_type, COUNT(*) AS total FROM lead_events ${eventWhere} GROUP BY event_type ORDER BY total DESC LIMIT 20`).bind(...eventBinds).all()
  ]);

  return json({
    ok: true,
    type: "summary",
    leads: leadCounts.results || [],
    audits: auditCounts.results || [],
    events: recentEvents.results || []
  });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, readRoles);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const type = clean(url.searchParams.get("type") || "audit", 40);
  const limit = clampLimit(url.searchParams.get("limit"));
  const status = clean(url.searchParams.get("status"), 40);
  const source = clean(url.searchParams.get("source"), 80);
  const q = clean(url.searchParams.get("q"), 160);
  const workspaceId = resolveWorkspace(auth, url.searchParams.get("workspace_id"));
  const workspaceAccess = requireWorkspaceAccess(auth, workspaceId);
  if (!workspaceAccess.ok) return workspaceAccess.response;

  if (type === "summary") return getSummary(env, workspaceId);

  if (type === "leads") {
    const filters = [];
    const binds = [];
    applyWorkspaceFilter(filters, binds, workspaceId);
    if (status) {
      filters.push("status = ?");
      binds.push(status);
    }
    if (source) {
      filters.push("source = ?");
      binds.push(source);
    }
    if (q) {
      filters.push("(business_name LIKE ? OR contact_name LIKE ? OR contact_email LIKE ? OR contact_phone LIKE ? OR industry LIKE ?)");
      binds.push(like(q), like(q), like(q), like(q), like(q));
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const result = await env.DB.prepare(
      `SELECT ${leadColumns}
       FROM leads
       ${where}
       ORDER BY created_at DESC
       LIMIT ?`
    )
      .bind(...binds, limit)
      .all();

    return json({ ok: true, type: "leads", rows: result.results || [] });
  }

  const filters = [];
  const binds = [];
  applyWorkspaceFilter(filters, binds, workspaceId);
  if (status) {
    filters.push("status = ?");
    binds.push(status);
  }
  if (source) {
    filters.push("source = ?");
    binds.push(source);
  }
  if (q) {
    filters.push("(business_name LIKE ? OR contact_name LIKE ? OR contact_email LIKE ? OR contact_phone LIKE ? OR contact_raw LIKE ? OR industry LIKE ?)");
    binds.push(like(q), like(q), like(q), like(q), like(q), like(q));
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const result = await env.DB.prepare(
    `SELECT ${auditColumns}
     FROM audit_submissions
     ${where}
     ORDER BY created_at DESC
     LIMIT ?`
  )
    .bind(...binds, limit)
    .all();

  return json({ ok: true, type: "audit", rows: result.results || [] });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, ["admin", "manager"]);
  if (!auth.ok) return auth.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const payload = parsed.payload || {};
  const createdAt = now();
  const id = crypto.randomUUID();
  const contactName = clean(payload.contact_name || payload.name, 160);
  const contactEmail = clean(payload.contact_email || payload.email, 180).toLowerCase();
  const contactPhone = normalizePhone(payload.contact_phone || payload.phone);
  const businessName = clean(payload.business_name || payload.business, 180);
  const projectGoal = clean(payload.project_goal || payload.goal || payload.message, 2000);
  const workspaceId = clean(payload.workspace_id, 120) || defaultWorkspaceId(auth);

  if (!contactEmail && !contactPhone) {
    return json({ ok: false, error: "Manual lead needs email or phone.", fields: ["contact_email", "contact_phone"] }, 400);
  }
  if (contactEmail && !isValidEmail(contactEmail)) {
    return json({ ok: false, error: "Invalid email format.", fields: ["contact_email"] }, 400);
  }
  if (contactPhone && !isValidPhone(contactPhone)) {
    return json({ ok: false, error: "Invalid phone format.", fields: ["contact_phone"] }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO leads (
      id, workspace_id, created_by_user_id, source, contact_name, contact_email, contact_phone, preferred_contact_method,
      business_name, industry, project_goal, budget_range, timeline, current_status,
      message, status, assigned_to, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      workspaceId,
      auth.user.id,
      clean(payload.source || "manager", 80),
      contactName,
      contactEmail,
      contactPhone,
      clean(payload.preferred_contact_method || "unknown", 40),
      businessName,
      clean(payload.industry, 160),
      projectGoal,
      clean(payload.budget_range, 80),
      clean(payload.timeline, 80),
      clean(payload.current_status || "Manual manager entry", 500),
      JSON.stringify(payload.metadata || {}),
      normalizeStatus(payload.status),
      clean(payload.assigned_to, 120),
      createdAt,
      createdAt
    )
    .run();

  await addLeadEvent(env, {
    workspace_id: workspaceId,
    lead_id: id,
    event_type: "lead.created",
    payload: { source: "manager", business_name: businessName, contact_email: contactEmail, contact_phone: contactPhone },
    created_at: createdAt
  });

  return json({ ok: true, id, stored: true }, 201);
}
