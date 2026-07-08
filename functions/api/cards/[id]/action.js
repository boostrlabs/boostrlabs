import { addLeadEvent, clean, json, jsonError, now, readJson, requireDb, requireRole, requireWorkspaceAccess } from "../../../_lib/api.js";
import { recordActivity } from "../../../_lib/app-normal.js";
import { actionTypes, cardStatuses, customOsRoles, statusForAction, updateCard } from "../../../_lib/custom-os.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;

  const id = clean(params.id, 120);
  const card = await env.DB.prepare("SELECT id, workspace_id, user_id, persona_id, owner_user_id, owner_role, status, title FROM cards WHERE id = ? LIMIT 1")
    .bind(id)
    .first();
  if (!card?.id) return jsonError("card_not_found", "Card not found.", 404);

  const access = requireWorkspaceAccess(auth, card.workspace_id);
  if (!access.ok) return access.response;

  const roles = auth.roles || [];
  const visible = roles.includes("admin") || roles.includes("manager") || card.user_id === auth.user.id || card.owner_user_id === auth.user.id || roles.includes(card.owner_role);
  if (!visible) return jsonError("card_access_denied", "Card access denied.", 403);

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const payload = parsed.payload || {};
  const action = clean(payload.action_type || payload.action || "done", 80);
  if (!actionTypes.has(action)) return jsonError("invalid_card_action", "Card action is not supported.", 400);

  const status = statusForAction(action, payload.status);
  if (!cardStatuses.has(status)) return jsonError("invalid_card_status", "Card status is not supported.", 400);

  const updated = await updateCard(env, id, { status });
  if (!updated.ok) return updated.response;

  await addLeadEvent(env, {
    workspace_id: card.workspace_id,
    event_type: "card.action",
    payload: {
      card_id: id,
      action,
      status,
      actor_user_id: auth.user.id,
      note: clean(payload.note, 1000)
    },
    created_at: now()
  });

  const activity = await recordActivity(env, {
    workspace_id: card.workspace_id,
    user_id: auth.user.id,
    persona_id: card.persona_id || null,
    card_id: id,
    event_type: "card.action",
    title: `Card ${action}`,
    body: clean(payload.note, 1000) || card.title || null,
    metadata: {
      action_type: action,
      status,
      previous_status: card.status,
      actor_user_id: auth.user.id
    }
  });

  let notification = null;
  if (["follow_up", "request_asset"].includes(action) && (card.owner_user_id || card.user_id)) {
    const notificationId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO notifications (
        id, user_id, workspace_id, card_id, type, title, body, status, priority, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'unread', ?, ?)`
    )
      .bind(
        notificationId,
        card.owner_user_id || card.user_id,
        card.workspace_id,
        id,
        action,
        action === "request_asset" ? "Asset requested" : "Follow up needed",
        clean(payload.note, 1000) || card.title || null,
        action === "request_asset" ? 75 : 65,
        now()
      )
      .run();
    notification = { id: notificationId };
  }

  const next = await env.DB.prepare(
    `SELECT id, workspace_id, user_id, persona_id, source_type, source_id, card_type,
            title, summary, priority, status, owner_user_id, owner_role,
            action_label, action_url, metadata_json, created_at, updated_at
     FROM cards
     WHERE id = ?
     LIMIT 1`
  )
    .bind(id)
    .first();

  return json({ ok: true, action_type: action, card: next, event: activity, notification });
}
