import { clean, json, jsonError, requireDb, requireSession, now } from "../../_lib/api.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const payload = await request.json().catch(() => null);
  if (!payload) return jsonError("invalid_json", "Invalid JSON payload.", 400);

  const workspaceId = clean(payload.workspace_id, 120);
  if (!workspaceId) return jsonError("workspace_required", "workspace_id is required.", 400);

  const membership = auth.memberships.find((item) => item.workspace_id === workspaceId && item.status === "active") || null;
  const canSeeAll = (auth.roles || []).some((role) => ["admin", "manager"].includes(role));

  if (!membership && !canSeeAll) {
    return jsonError("workspace_access_denied", "Workspace access denied.", 403);
  }

  const workspace = await env.DB.prepare(
    "SELECT id, name, slug, type FROM workspaces WHERE id = ? LIMIT 1"
  ).bind(workspaceId).first();

  if (!workspace?.id) return jsonError("workspace_not_found", "Workspace not found.", 404);

  if (!auth.session?.id) return jsonError("session_missing", "Active session not found.", 401);

  const timestamp = now();
  await env.DB.prepare(
    "UPDATE sessions SET active_workspace_id = ?, last_seen_at = ?, updated_at = ? WHERE id = ?"
  ).bind(workspaceId, timestamp, timestamp, auth.session.id).run();

  return json({
    ok: true,
    active_workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      type: workspace.type,
      role: membership?.role || auth.user?.role || null
    }
  });
}
