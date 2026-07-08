import { authCanSeeAll, clean, json, jsonError, readJson, requireDb, requireSession } from "../_lib/api.js";
import { recordActivity, resolveRequiredWorkspace, safeJsonParse } from "../_lib/app-normal.js";

const clampLimit = (value) => Math.min(Math.max(Number(value || 50) || 50, 1), 100);

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const workspace = resolveRequiredWorkspace(auth, url.searchParams.get("workspace_id"));
  if (!workspace.ok) return workspace.response;

  const filters = ["workspace_id = ?"];
  const binds = [workspace.workspace_id];
  const cardId = clean(url.searchParams.get("card_id"), 120);
  if (cardId) {
    filters.push("card_id = ?");
    binds.push(cardId);
  }
  if (!authCanSeeAll(auth)) {
    filters.push("(user_id = ? OR user_id IS NULL)");
    binds.push(auth.user.id);
  }

  const result = await env.DB.prepare(
    `SELECT id, workspace_id, user_id, persona_id, card_id, event_type,
            title, body, metadata_json, created_at
     FROM activity_events
     WHERE ${filters.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT ?`
  )
    .bind(...binds, clampLimit(url.searchParams.get("limit")))
    .all();

  return json({
    ok: true,
    workspace_id: workspace.workspace_id,
    activity: (result.results || []).map((row) => ({ ...row, metadata: safeJsonParse(row.metadata_json, {}) }))
  });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};

  const workspace = resolveRequiredWorkspace(auth, payload.workspace_id);
  if (!workspace.ok) return workspace.response;

  const title = clean(payload.title, 240);
  if (!title) return jsonError("activity_title_required", "Activity title is required.", 400);

  const event = await recordActivity(env, {
    workspace_id: workspace.workspace_id,
    user_id: auth.user.id,
    persona_id: clean(payload.persona_id, 120) || null,
    card_id: clean(payload.card_id, 120) || null,
    event_type: clean(payload.event_type || "manual.activity", 80),
    title,
    body: clean(payload.body, 1200) || null,
    metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {}
  });

  return json({ ok: true, event }, 201);
}
