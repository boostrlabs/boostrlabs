import { addLeadEvent, clean, json, jsonError, now, requireDb, requireRole, requireWorkspaceAccess } from "../../../../../_lib/api.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, ["admin", "manager"]);
  if (!auth.ok) return auth.response;

  const workspaceId = clean(params.workspace_id, 120);
  const moduleSlug = clean(params.module_slug, 120);
  if (!workspaceId || !moduleSlug) {
    return jsonError("workspace_module_params_required", "Missing workspace_id or module_slug.", 400);
  }
  const workspaceAccess = requireWorkspaceAccess(auth, workspaceId);
  if (!workspaceAccess.ok) return workspaceAccess.response;

  const module = await env.DB.prepare("SELECT id, slug FROM modules WHERE slug = ? LIMIT 1").bind(moduleSlug).first();
  if (!module?.id) return jsonError("module_not_found", "Module not found.", 404);

  const timestamp = now();
  const managerActor = auth.user?.email || auth.user?.id || "manager";
  const existing = await env.DB.prepare(
    "SELECT id FROM workspace_modules WHERE workspace_id = ? AND module_id = ? LIMIT 1"
  )
    .bind(workspaceId, module.id)
    .first();

  if (existing?.id) {
    await env.DB.prepare(
      `UPDATE workspace_modules
       SET status = 'active', activated_at = ?, activated_by = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(timestamp, managerActor, timestamp, existing.id)
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO workspace_modules (
        id, workspace_id, module_id, status, activated_at, activated_by, created_at, updated_at
      ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?)`
    )
      .bind(crypto.randomUUID(), workspaceId, module.id, timestamp, managerActor, timestamp, timestamp)
      .run();
  }

  await addLeadEvent(env, {
    event_type: "module.activated",
    payload: {
      workspace_id: workspaceId,
      module_id: module.id,
      module_slug: module.slug,
      status: "active",
      activated_by: managerActor
    },
    created_at: timestamp
  });

  return json({
    ok: true,
    workspace_id: workspaceId,
    module_id: module.id,
    module_slug: module.slug,
    status: "active",
    activated_at: timestamp,
    activated_by: managerActor
  });
}
