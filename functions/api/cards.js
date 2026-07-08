import { authCanSeeAll, clean, json, jsonError, readJson, requireDb, requireRole } from "../_lib/api.js";
import {
  cardStatuses,
  cardTypes,
  customOsRoles,
  getPersona,
  insertCard,
  requireWritableWorkspace,
  resolveWorkspaceForRequest,
  scopedCardFilters
} from "../_lib/custom-os.js";

const clampLimit = (value) => Math.min(Math.max(Number(value || 50) || 50, 1), 100);

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

  const { filters, binds } = scopedCardFilters(auth, workspace.workspace_id);
  const cardType = clean(url.searchParams.get("card_type"), 60);
  const status = clean(url.searchParams.get("status"), 40);
  const sourceType = clean(url.searchParams.get("source_type"), 80);
  const limit = clampLimit(url.searchParams.get("limit"));

  if (cardType) {
    filters.push("card_type = ?");
    binds.push(cardType);
  }
  if (status) {
    filters.push("status = ?");
    binds.push(status);
  }
  if (sourceType) {
    filters.push("source_type = ?");
    binds.push(sourceType);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const result = await env.DB.prepare(
    `SELECT id, workspace_id, user_id, persona_id, source_type, source_id, card_type,
            title, summary, priority, status, owner_user_id, owner_role,
            action_label, action_url, metadata_json, created_at, updated_at
     FROM cards
     ${where}
     ORDER BY priority DESC, created_at DESC
     LIMIT ?`
  )
    .bind(...binds, limit)
    .all();

  return json({ ok: true, cards: result.results || [] });
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

  const cardType = clean(payload.card_type, 60);
  const status = clean(payload.status || "unread", 40);
  if (!cardTypes.has(cardType)) return jsonError("invalid_card_type", "Card type is not supported.", 400);
  if (!cardStatuses.has(status)) return jsonError("invalid_card_status", "Card status is not supported.", 400);

  if (!authCanSeeAll(auth)) {
    const roles = auth.roles || [];
    const ownerRole = clean(payload.owner_role, 40);
    if (ownerRole && !roles.includes(ownerRole)) {
      return jsonError("owner_role_denied", "Cannot create a card for another role.", 403);
    }
  }

  const title = clean(payload.title, 240);
  if (!title) return jsonError("card_title_required", "Card title is required.", 400, { fields: ["title"] });

  let personaId = clean(payload.persona_id, 120) || null;
  if (personaId) {
    const persona = await getPersona(env, personaId, workspace.workspace_id);
    if (!persona?.id) return jsonError("persona_not_found", "Persona not found in this workspace.", 404);
    if (!authCanSeeAll(auth) && persona.user_id !== auth.user.id) {
      return jsonError("persona_access_denied", "Persona access denied.", 403);
    }
  }

  const created = await insertCard(env, {
    workspace_id: workspace.workspace_id,
    user_id: clean(payload.user_id, 120) || (!authCanSeeAll(auth) ? auth.user.id : null),
    persona_id: personaId,
    source_type: clean(payload.source_type || "manual", 80),
    source_id: clean(payload.source_id, 120),
    card_type: cardType,
    title,
    summary: clean(payload.summary, 1200),
    priority: payload.priority,
    status,
    owner_user_id: clean(payload.owner_user_id, 120) || null,
    owner_role: clean(payload.owner_role, 40) || auth.roles?.[0] || null,
    action_label: clean(payload.action_label, 120),
    action_url: clean(payload.action_url, 800),
    metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {}
  });

  return json({ ok: true, id: created.id, card_type: created.card_type, status: created.status, priority: created.priority }, 201);
}
