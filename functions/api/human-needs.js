import { clean, json, jsonError, now, readJson, requireDb, requireRole } from "../_lib/api.js";
import {
  createHumanNeedCards,
  customOsRoles,
  getPersona,
  humanNeedTypes,
  requireWritableWorkspace,
  resolveWorkspaceForRequest
} from "../_lib/custom-os.js";

const clampLimit = (value) => Math.min(Math.max(Number(value || 20) || 20, 1), 50);

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const workspace = resolveWorkspaceForRequest(auth, url.searchParams.get("workspace_id"));
  if (!workspace.ok) return workspace.response;

  const filters = [];
  const binds = [];
  if (workspace.workspace_id) {
    filters.push("workspace_id = ?");
    binds.push(workspace.workspace_id);
  }
  if (!["admin", "manager"].some((role) => auth.roles.includes(role))) {
    filters.push("user_id = ?");
    binds.push(auth.user.id);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const result = await env.DB.prepare(
    `SELECT id, workspace_id, user_id, persona_id, need_type, note, created_at
     FROM human_needs
     ${where}
     ORDER BY created_at DESC
     LIMIT ?`
  )
    .bind(...binds, clampLimit(url.searchParams.get("limit")))
    .all();

  return json({ ok: true, human_needs: result.results || [] });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const payload = parsed.payload || {};
  const workspace = requireWritableWorkspace(auth, payload.workspace_id);
  if (!workspace.ok) return workspace.response;

  const needType = clean(payload.need_type, 80);
  if (!humanNeedTypes.has(needType)) return jsonError("invalid_need_type", "Need type is not supported.", 400);

  const personaId = clean(payload.persona_id, 120) || null;
  let personaType = auth.roles?.[0] || auth.user.role || "client";
  if (personaId) {
    const persona = await getPersona(env, personaId, workspace.workspace_id);
    if (!persona?.id) return jsonError("persona_not_found", "Persona not found in this workspace.", 404);
    if (!["admin", "manager"].some((role) => auth.roles.includes(role)) && persona.user_id !== auth.user.id) {
      return jsonError("persona_access_denied", "Persona access denied.", 403);
    }
    personaType = persona.persona_type;
  }

  const timestamp = now();
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO human_needs (
      id, workspace_id, user_id, persona_id, need_type, note, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, workspace.workspace_id, auth.user.id, personaId, needType, clean(payload.note, 2000), timestamp)
    .run();

  const cards = await createHumanNeedCards(env, {
    id,
    workspace_id: workspace.workspace_id,
    user_id: auth.user.id,
    persona_id: personaId,
    need_type: needType,
    note: clean(payload.note, 2000),
    created_at: timestamp
  }, personaType);

  return json({ ok: true, id, workspace_id: workspace.workspace_id, need_type: needType, cards_created: cards.length }, 201);
}
