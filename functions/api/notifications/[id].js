import { authCanSeeAll, clean, json, jsonError, now, readJson, requireDb, requireSession, requireWorkspaceAccess } from "../../_lib/api.js";
import { notificationStatuses } from "../../_lib/app-normal.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPatch({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const row = await env.DB.prepare("SELECT * FROM notifications WHERE id = ? LIMIT 1")
    .bind(clean(params.id, 120))
    .first();
  if (!row?.id) return jsonError("notification_not_found", "Notification not found.", 404);

  const access = requireWorkspaceAccess(auth, row.workspace_id);
  if (!access.ok) return access.response;
  if (!authCanSeeAll(auth) && row.user_id && row.user_id !== auth.user.id) {
    return jsonError("notification_access_denied", "Notification access denied.", 403);
  }

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const status = clean(parsed.payload?.status || "read", 40);
  if (!notificationStatuses.has(status)) return jsonError("invalid_notification_status", "Notification status is not supported.", 400);

  const timestamp = now();
  await env.DB.prepare(
    "UPDATE notifications SET status = ?, read_at = CASE WHEN ? = 'read' THEN ? ELSE read_at END WHERE id = ?"
  )
    .bind(status, status, timestamp, row.id)
    .run();

  const updated = await env.DB.prepare("SELECT * FROM notifications WHERE id = ? LIMIT 1").bind(row.id).first();
  return json({ ok: true, notification: updated });
}
