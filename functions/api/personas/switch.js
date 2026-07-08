import { authCanSeeAll, clean, json, jsonError, now, readJson, requireDb, requireSession, requireWorkspaceAccess } from "../../_lib/api.js";
import { applyCardQueryFilters, scopedCardFilters } from "../../_lib/custom-os.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};

  const personaId = clean(payload.persona_id, 120);
  if (!personaId) return jsonError("persona_id_required", "persona_id is required.", 400);

  const persona = await env.DB.prepare(
    `SELECT id, user_id, workspace_id, persona_type, display_name, status, metadata_json, created_at, updated_at
     FROM personas
     WHERE id = ?
     LIMIT 1`
  )
    .bind(personaId)
    .first();
  if (!persona?.id) return jsonError("persona_not_found", "Persona not found.", 404);

  const access = requireWorkspaceAccess(auth, persona.workspace_id);
  if (!access.ok) return access.response;
  if (!authCanSeeAll(auth) && persona.user_id !== auth.user.id) {
    return jsonError("persona_access_denied", "Persona access denied.", 403);
  }

  await env.DB.prepare("UPDATE users SET default_persona_id = ?, default_workspace_id = ?, updated_at = ? WHERE id = ?")
    .bind(persona.id, persona.workspace_id, now(), auth.user.id)
    .run();

  const modules = await env.DB.prepare(
    `SELECT modules.slug, modules.name, modules.category,
            COALESCE(workspace_modules.status, 'locked') AS status
     FROM modules
     LEFT JOIN workspace_modules
       ON workspace_modules.module_id = modules.id
      AND workspace_modules.workspace_id = ?
     ORDER BY modules.category, modules.name`
  )
    .bind(persona.workspace_id)
    .all();

  const { filters, binds } = scopedCardFilters(auth, persona.workspace_id);
  filters.push("(persona_id = ? OR owner_role = ?)");
  binds.push(persona.id, persona.persona_type);
  const queryFilters = applyCardQueryFilters(filters, binds, new URL(request.url).searchParams);
  if (!queryFilters.ok) return queryFilters.response;

  const cards = await env.DB.prepare(
    `SELECT id, workspace_id, user_id, persona_id, source_type, source_id, card_type,
            title, summary, priority, status, owner_user_id, owner_role,
            action_label, action_url, metadata_json, created_at, updated_at
     FROM cards
     WHERE ${filters.join(" AND ")}
     ORDER BY priority DESC, created_at DESC
     LIMIT 50`
  )
    .bind(...binds)
    .all();

  return json({
    ok: true,
    active_persona: persona,
    visible_modules: modules.results || [],
    cards: cards.results || []
  });
}
