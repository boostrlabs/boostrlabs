import { addLeadEvent, clean, json, jsonError, now, readJson, requireDb, requireRole, requireWorkspaceAccess } from "../../../_lib/api.js";
import { customOsRoles, updateCard } from "../../../_lib/custom-os.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;

  const id = clean(params.id, 120);
  const card = await env.DB.prepare("SELECT id, workspace_id, user_id, owner_user_id, owner_role, status FROM cards WHERE id = ? LIMIT 1")
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
  const action = clean(payload.action || "complete", 80);
  const status = clean(payload.status || (action === "archive" ? "archived" : "done"), 40);
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

  return json({ ok: true, id, action, status });
}
