import { authCanSeeAll, clean, json, jsonError, readJson, requireDb, requireRole, requireWorkspaceAccess } from "../../_lib/api.js";
import { customOsRoles, scopedCardFilters, updateCard } from "../../_lib/custom-os.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

async function loadScopedCard(env, auth, id) {
  const card = await env.DB.prepare(
    `SELECT id, workspace_id, user_id, persona_id, source_type, source_id, card_type,
            title, summary, priority, status, owner_user_id, owner_role,
            action_label, action_url, metadata_json, created_at, updated_at
     FROM cards
     WHERE id = ?
     LIMIT 1`
  )
    .bind(id)
    .first();

  if (!card?.id) return { ok: false, response: jsonError("card_not_found", "Card not found.", 404) };

  const access = requireWorkspaceAccess(auth, card.workspace_id);
  if (!access.ok) return { ok: false, response: access.response };

  if (!authCanSeeAll(auth)) {
    const roles = auth.roles || [];
    const visible = card.user_id === auth.user.id || card.owner_user_id === auth.user.id || roles.includes(card.owner_role);
    if (!visible) return { ok: false, response: jsonError("card_access_denied", "Card access denied.", 403) };
  }

  return { ok: true, card };
}

export async function onRequestGet({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;

  const loaded = await loadScopedCard(env, auth, clean(params.id, 120));
  if (!loaded.ok) return loaded.response;

  return json({ ok: true, card: loaded.card });
}

export async function onRequestPatch({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;

  const id = clean(params.id, 120);
  const loaded = await loadScopedCard(env, auth, id);
  if (!loaded.ok) return loaded.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const payload = parsed.payload || {};
  if (!authCanSeeAll(auth) && payload.owner_user_id && payload.owner_user_id !== auth.user.id) {
    return jsonError("owner_access_denied", "Cannot assign card to another owner.", 403);
  }

  const updated = await updateCard(env, id, payload);
  if (!updated.ok) return updated.response;

  const { filters, binds } = scopedCardFilters(auth, loaded.card.workspace_id);
  filters.push("id = ?");
  binds.push(id);

  const card = await env.DB.prepare(
    `SELECT id, workspace_id, user_id, persona_id, source_type, source_id, card_type,
            title, summary, priority, status, owner_user_id, owner_role,
            action_label, action_url, metadata_json, created_at, updated_at
     FROM cards
     WHERE ${filters.join(" AND ")}
     LIMIT 1`
  )
    .bind(...binds)
    .first();

  return json({ ok: true, card });
}
