import { authCanSeeAll, clean, json, jsonError, now, readJson, requireDb, requireSession, requireWorkspaceAccess } from "../../_lib/api.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPatch({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const persona = await env.DB.prepare(
    `SELECT id, user_id, workspace_id, persona_type, display_name, status, metadata_json, created_at, updated_at
     FROM personas
     WHERE id = ?
     LIMIT 1`
  )
    .bind(clean(params.id, 120))
    .first();

  if (!persona?.id) return jsonError("persona_not_found", "Persona not found.", 404);
  const access = requireWorkspaceAccess(auth, persona.workspace_id);
  if (!access.ok) return access.response;
  if (!authCanSeeAll(auth) && persona.user_id !== auth.user.id) {
    return jsonError("persona_access_denied", "Persona access denied.", 403);
  }

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};

  const updates = [];
  const binds = [];
  const set = (column, value) => {
    updates.push(`${column} = ?`);
    binds.push(value);
  };

  if (payload.display_name !== undefined) set("display_name", clean(payload.display_name, 160) || null);
  if (payload.status !== undefined) {
    const status = clean(payload.status, 40);
    if (!["active", "invited", "paused", "disabled", "archived"].includes(status)) {
      return jsonError("invalid_persona_status", "Persona status is not supported.", 400);
    }
    set("status", status);
  }
  if (payload.metadata !== undefined) {
    if (!payload.metadata || typeof payload.metadata !== "object" || Array.isArray(payload.metadata)) {
      return jsonError("invalid_persona_metadata", "Persona metadata must be an object.", 400);
    }
    set("metadata_json", JSON.stringify(payload.metadata));
  }

  if (!updates.length) return jsonError("no_persona_updates", "No supported persona fields were provided.", 400);

  set("updated_at", now());
  binds.push(persona.id);
  await env.DB.prepare(`UPDATE personas SET ${updates.join(", ")} WHERE id = ?`).bind(...binds).run();

  const updated = await env.DB.prepare("SELECT * FROM personas WHERE id = ? LIMIT 1").bind(persona.id).first();
  return json({ ok: true, persona: updated });
}
