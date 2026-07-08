import { clean, json, jsonError, now, readJson, requireDb, requireSession, requireWorkspaceAccess } from "../_lib/api.js";
import { getProfile, profileShape, validateLanguage } from "../_lib/app-normal.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const profile = await getProfile(env, auth.user.id);
  if (!profile?.id) return jsonError("profile_not_found", "Profile not found.", 404);

  return json({ ok: true, profile: profileShape(profile) });
}

export async function onRequestPatch({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};

  const updates = [];
  const binds = [];
  const set = (column, value) => {
    updates.push(`${column} = ?`);
    binds.push(value);
  };

  if (payload.display_name !== undefined || payload.name !== undefined) set("name", clean(payload.display_name ?? payload.name, 160));
  if (payload.avatar_url !== undefined) set("avatar_url", clean(payload.avatar_url, 800) || null);
  if (payload.language !== undefined) set("language", validateLanguage(payload.language));
  if (payload.timezone !== undefined) set("timezone", clean(payload.timezone, 80) || null);
  if (payload.theme !== undefined) set("theme", clean(payload.theme, 80) || "platinum_dark");

  if (payload.default_workspace_id !== undefined) {
    const workspaceId = clean(payload.default_workspace_id, 120) || null;
    if (workspaceId) {
      const access = requireWorkspaceAccess(auth, workspaceId);
      if (!access.ok) return access.response;
    }
    set("default_workspace_id", workspaceId);
  }

  if (payload.default_persona_id !== undefined) {
    const personaId = clean(payload.default_persona_id, 120) || null;
    if (personaId) {
      const persona = await env.DB.prepare("SELECT id FROM personas WHERE id = ? AND user_id = ? LIMIT 1")
        .bind(personaId, auth.user.id)
        .first();
      if (!persona?.id) return jsonError("persona_not_found", "Persona not found.", 404);
    }
    set("default_persona_id", personaId);
  }

  if (!updates.length) return jsonError("no_profile_updates", "No supported profile fields were provided.", 400);

  set("updated_at", now());
  binds.push(auth.user.id);
  await env.DB.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).bind(...binds).run();

  const profile = await getProfile(env, auth.user.id);
  return json({ ok: true, profile: profileShape(profile) });
}
