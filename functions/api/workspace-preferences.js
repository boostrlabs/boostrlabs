import { clean, json, jsonError, now, readJson, requireDb, requireSession } from "../_lib/api.js";
import { boolToInt, cardDensities, preferenceShape, resolveRequiredWorkspace, safeJsonParse, validateLanguage } from "../_lib/app-normal.js";
import { humanNeedTypes } from "../_lib/custom-os.js";

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

  const row = await env.DB.prepare("SELECT * FROM workspace_preferences WHERE workspace_id = ? LIMIT 1")
    .bind(workspace.workspace_id)
    .first();

  return json({ ok: true, preferences: preferenceShape(row, workspace.workspace_id) });
}

export async function onRequestPatch({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};

  const workspace = resolveRequiredWorkspace(auth, payload.workspace_id);
  if (!workspace.ok) return workspace.response;

  const current = await env.DB.prepare("SELECT * FROM workspace_preferences WHERE workspace_id = ? LIMIT 1")
    .bind(workspace.workspace_id)
    .first();

  const defaultMode = payload.default_mode === undefined
    ? current?.default_mode || "manage"
    : clean(payload.default_mode, 80) || null;
  if (defaultMode && !humanNeedTypes.has(defaultMode)) return jsonError("invalid_default_mode", "Default mode is not supported.", 400);

  const density = clean(payload.card_density || current?.card_density || "comfortable", 40);
  if (!cardDensities.has(density)) return jsonError("invalid_card_density", "Card density is not supported.", 400);

  const notificationPrefs = payload.notification_preferences !== undefined
    ? payload.notification_preferences
    : payload.notification_preferences_json !== undefined
      ? payload.notification_preferences_json
      : current?.notification_preferences_json
        ? safeJsonParse(current.notification_preferences_json, {})
        : {};
  if (!notificationPrefs || typeof notificationPrefs !== "object" || Array.isArray(notificationPrefs)) {
    return jsonError("invalid_notification_preferences", "Notification preferences must be an object.", 400);
  }

  const timestamp = now();
  const values = {
    id: current?.id || crypto.randomUUID(),
    workspace_id: workspace.workspace_id,
    default_mode: defaultMode,
    default_persona_id: clean(payload.default_persona_id ?? current?.default_persona_id, 120) || null,
    default_language: validateLanguage(payload.default_language ?? current?.default_language ?? "en"),
    card_density: density,
    show_demo_labels: boolToInt(payload.show_demo_labels, current ? Boolean(current.show_demo_labels) : true),
    reduce_motion: boolToInt(payload.reduce_motion, current ? Boolean(current.reduce_motion) : false),
    notification_preferences_json: JSON.stringify(notificationPrefs),
    created_at: current?.created_at || timestamp,
    updated_at: timestamp
  };

  await env.DB.prepare(
    `INSERT INTO workspace_preferences (
      id, workspace_id, default_mode, default_persona_id, default_language,
      card_density, show_demo_labels, reduce_motion, notification_preferences_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(workspace_id) DO UPDATE SET
      default_mode = excluded.default_mode,
      default_persona_id = excluded.default_persona_id,
      default_language = excluded.default_language,
      card_density = excluded.card_density,
      show_demo_labels = excluded.show_demo_labels,
      reduce_motion = excluded.reduce_motion,
      notification_preferences_json = excluded.notification_preferences_json,
      updated_at = excluded.updated_at`
  )
    .bind(
      values.id,
      values.workspace_id,
      values.default_mode,
      values.default_persona_id,
      values.default_language,
      values.card_density,
      values.show_demo_labels,
      values.reduce_motion,
      values.notification_preferences_json,
      values.created_at,
      values.updated_at
    )
    .run();

  const row = await env.DB.prepare("SELECT * FROM workspace_preferences WHERE workspace_id = ? LIMIT 1")
    .bind(workspace.workspace_id)
    .first();
  return json({ ok: true, preferences: preferenceShape(row, workspace.workspace_id) });
}
