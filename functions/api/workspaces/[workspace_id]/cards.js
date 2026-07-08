import { clean, json, requireDb, requireRole, requireWorkspaceAccess } from "../../../_lib/api.js";
import { customOsRoles, scopedCardFilters } from "../../../_lib/custom-os.js";

const clampLimit = (value) => Math.min(Math.max(Number(value || 50) || 50, 1), 100);

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;

  const workspaceId = clean(params.workspace_id, 120);
  const access = requireWorkspaceAccess(auth, workspaceId);
  if (!access.ok) return access.response;

  const url = new URL(request.url);
  const { filters, binds } = scopedCardFilters(auth, workspaceId);
  const status = clean(url.searchParams.get("status"), 40);
  const cardType = clean(url.searchParams.get("card_type"), 60);
  const limit = clampLimit(url.searchParams.get("limit"));

  if (status) {
    filters.push("status = ?");
    binds.push(status);
  }
  if (cardType) {
    filters.push("card_type = ?");
    binds.push(cardType);
  }

  const result = await env.DB.prepare(
    `SELECT id, workspace_id, user_id, persona_id, source_type, source_id, card_type,
            title, summary, priority, status, owner_user_id, owner_role,
            action_label, action_url, metadata_json, created_at, updated_at
     FROM cards
     WHERE ${filters.join(" AND ")}
     ORDER BY priority DESC, created_at DESC
     LIMIT ?`
  )
    .bind(...binds, limit)
    .all();

  return json({ ok: true, workspace_id: workspaceId, cards: result.results || [] });
}
