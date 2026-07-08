import { addLeadEvent, clean, json, now, readJson, requireDb, requireRole } from "../../../_lib/api.js";

const roleForWorkspace = (type) => {
  if (type === "artist") return "artist";
  if (type === "partner") return "partner";
  return "client";
};

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, ["admin", "manager"]);
  if (!auth.ok) return auth.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const id = clean(params.id, 120);
  const audit = await env.DB.prepare(
    "SELECT id, workspace_id, contact_email, contact_name, business_name FROM audit_submissions WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!audit?.id) return json({ ok: false, error: "Audit submission not found." }, 404);

  const payload = parsed.payload || {};
  const timestamp = now();
  let workspaceId = clean(payload.workspace_id || audit.workspace_id, 120);
  const ownerEmail = clean(payload.owner_email || audit.contact_email, 180).toLowerCase();
  const workspaceType = clean(payload.workspace_type || "client", 40);

  if (workspaceId) {
    const workspace = await env.DB.prepare("SELECT id FROM workspaces WHERE id = ?").bind(workspaceId).first();
    if (!workspace?.id) return json({ ok: false, error: "Workspace not found." }, 404);
  } else {
    workspaceId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO workspaces (
        id, type, name, slug, owner_email, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`
    )
      .bind(
        workspaceId,
        workspaceType,
        clean(payload.workspace_name || audit.business_name || "BOOSTR Workspace", 180),
        clean(payload.workspace_slug, 120) || null,
        ownerEmail || null,
        timestamp,
        timestamp
      )
      .run();
  }

  let userId = null;
  if (ownerEmail) {
    const existingUser = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(ownerEmail).first();
    userId = existingUser?.id || crypto.randomUUID();

    if (!existingUser?.id) {
      await env.DB.prepare(
        `INSERT INTO users (
          id, email, name, role, workspace_id, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'invited', ?, ?)`
      )
        .bind(userId, ownerEmail, clean(payload.owner_name || audit.contact_name, 160), roleForWorkspace(workspaceType), workspaceId, timestamp, timestamp)
        .run();
    }

    await env.DB.prepare(
      `INSERT OR IGNORE INTO workspace_members (
        id, workspace_id, user_id, role, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'active', ?, ?)`
    )
      .bind(crypto.randomUUID(), workspaceId, userId, roleForWorkspace(workspaceType), timestamp, timestamp)
      .run();
  }

  await env.DB.prepare("UPDATE audit_submissions SET workspace_id = ?, updated_at = ? WHERE id = ?")
    .bind(workspaceId, timestamp, id)
    .run();

  await env.DB.prepare("UPDATE leads SET workspace_id = ?, updated_at = ? WHERE id = ?")
    .bind(workspaceId, timestamp, id)
    .run();

  await addLeadEvent(env, {
    workspace_id: workspaceId,
    lead_id: id,
    audit_submission_id: id,
    event_type: "audit.claimed",
    payload: {
      workspace_id: workspaceId,
      user_id: userId,
      claimed_by: auth.user.id
    },
    created_at: timestamp
  });

  return json({ ok: true, audit_id: id, lead_id: id, workspace_id: workspaceId, user_id: userId });
}
