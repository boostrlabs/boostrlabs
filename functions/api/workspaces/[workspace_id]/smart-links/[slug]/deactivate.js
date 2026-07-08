import { addLeadEvent, canAccessModule, clean, json, managerAuth, now, requireDb } from "../../../../../_lib/api.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = managerAuth(request, env);
  if (!auth.ok) return auth.response;

  const workspaceId = clean(params.workspace_id, 120);
  if (!workspaceId) {
    return json({ ok: false, error: "workspace_id is required." }, 400);
  }

  if (!(await canAccessModule(env, workspaceId, "smart-links"))) {
    return json({ error: "module_locked", module: "smart-links" }, 403);
  }

  const slug = clean(params.slug, 120);
  if (!slug) {
    return json({ ok: false, error: "slug is required." }, 400);
  }

  const existing = await env.DB.prepare(
    "SELECT id, slug FROM smart_links WHERE workspace_id = ? AND slug = ? LIMIT 1"
  )
    .bind(workspaceId, slug)
    .first();

  if (!existing?.id) {
    return json({ ok: false, error: "Smart link not found." }, 404);
  }

  const timestamp = now();
  await env.DB.prepare(
    `UPDATE smart_links
     SET status = 'locked', updated_at = ?
     WHERE id = ?`
  )
    .bind(timestamp, existing.id)
    .run();

  await addLeadEvent(env, {
    event_type: "smart_link.deactivated",
    payload: {
      workspace_id: workspaceId,
      smart_link_id: existing.id,
      slug: existing.slug
    },
    created_at: timestamp
  });

  return json({ ok: true, id: existing.id, workspace_id: workspaceId, slug: existing.slug, status: "locked" });
}
