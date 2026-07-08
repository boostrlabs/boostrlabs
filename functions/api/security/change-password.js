import { clean, hashPassword, json, jsonError, now, readJson, requireDb, requireSession, verifyPassword } from "../../_lib/api.js";

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

  const currentPassword = clean(payload.current_password, 500);
  const newPassword = clean(payload.new_password, 500);
  if (!currentPassword || !newPassword) {
    return jsonError("password_fields_required", "Current password and new password are required.", 400);
  }
  if (newPassword.length < 10) return jsonError("password_too_short", "New password must be at least 10 characters.", 400);

  const user = await env.DB.prepare("SELECT id, password_hash FROM users WHERE id = ? LIMIT 1")
    .bind(auth.user.id)
    .first();
  if (!user?.password_hash || !(await verifyPassword(currentPassword, user.password_hash))) {
    return jsonError("invalid_current_password", "Current password is invalid.", 401);
  }

  const timestamp = now();
  await env.DB.prepare("UPDATE users SET password_hash = ?, password_set_at = ?, updated_at = ? WHERE id = ?")
    .bind(await hashPassword(newPassword), timestamp, timestamp, auth.user.id)
    .run();

  return json({ ok: true, password_changed: true });
}
