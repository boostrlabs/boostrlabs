import { clean, json, requireDb, requireSession, requireWorkspaceAccess } from "../../_lib/api.js";
import { tokenMetadataShape } from "../../_lib/app-normal.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const workspaceId = clean(url.searchParams.get("workspace_id"), 120);
  const filters = ["user_id = ?"];
  const binds = [auth.user.id];
  if (workspaceId) {
    const access = requireWorkspaceAccess(auth, workspaceId);
    if (!access.ok) return access.response;
    filters.push("(workspace_id = ? OR workspace_id IS NULL)");
    binds.push(workspaceId);
  }

  const rows = await env.DB.prepare(
    `SELECT id, label, prefix, status, scopes_json, created_at, last_used_at
     FROM api_tokens
     WHERE ${filters.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT 50`
  )
    .bind(...binds)
    .all();

  return json({ ok: true, api_tokens: (rows.results || []).map(tokenMetadataShape) });
}

export async function onRequestPost() {
  return json({
    ok: false,
    error: "api_token_creation_not_implemented",
    message: "API token creation requires hashed token storage and is not implemented yet."
  }, 501);
}
