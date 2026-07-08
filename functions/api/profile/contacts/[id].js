import { clean, json, jsonError, now, readJson, requireDb, requireSession, requireWorkspaceAccess } from "../../../_lib/api.js";
import { contactShape, contactTypes, contactVisibility, requireAllowed } from "../../../_lib/app-normal.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

async function loadContact(env, auth, id) {
  const row = await env.DB.prepare("SELECT * FROM user_contact_methods WHERE id = ? LIMIT 1")
    .bind(clean(id, 120))
    .first();
  if (!row?.id) return { ok: false, response: jsonError("contact_not_found", "Contact method not found.", 404) };
  if (row.user_id !== auth.user.id) return { ok: false, response: jsonError("contact_access_denied", "Contact access denied.", 403) };
  if (row.workspace_id) {
    const access = requireWorkspaceAccess(auth, row.workspace_id);
    if (!access.ok) return { ok: false, response: access.response };
  }
  return { ok: true, contact: row };
}

export async function onRequestPatch({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const loaded = await loadContact(env, auth, params.id);
  if (!loaded.ok) return loaded.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};

  const updates = [];
  const binds = [];
  const set = (column, value) => {
    updates.push(`${column} = ?`);
    binds.push(value);
  };

  if (payload.contact_type !== undefined) {
    const type = requireAllowed(payload.contact_type, contactTypes, "invalid_contact_type", "Contact type is not supported.");
    if (!type.ok) return type.response;
    set("contact_type", type.value);
  }
  if (payload.visibility !== undefined) {
    const visibility = requireAllowed(payload.visibility, contactVisibility, "invalid_contact_visibility", "Contact visibility is not supported.");
    if (!visibility.ok) return visibility.response;
    set("visibility", visibility.value);
  }
  if (payload.workspace_id !== undefined) {
    const workspaceId = clean(payload.workspace_id, 120) || null;
    if (workspaceId) {
      const access = requireWorkspaceAccess(auth, workspaceId);
      if (!access.ok) return access.response;
    }
    set("workspace_id", workspaceId);
  }
  if (payload.label !== undefined) set("label", clean(payload.label, 120) || null);
  if (payload.value !== undefined) {
    const value = clean(payload.value, 500);
    if (!value) return jsonError("contact_value_required", "Contact value is required.", 400);
    set("value", value);
  }
  if (payload.is_primary !== undefined) set("is_primary", payload.is_primary ? 1 : 0);

  if (!updates.length) return jsonError("no_contact_updates", "No supported contact fields were provided.", 400);

  set("updated_at", now());
  binds.push(loaded.contact.id);
  await env.DB.prepare(`UPDATE user_contact_methods SET ${updates.join(", ")} WHERE id = ?`).bind(...binds).run();

  const row = await env.DB.prepare("SELECT * FROM user_contact_methods WHERE id = ? LIMIT 1").bind(loaded.contact.id).first();
  return json({ ok: true, contact: contactShape(row) });
}

export async function onRequestDelete({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const loaded = await loadContact(env, auth, params.id);
  if (!loaded.ok) return loaded.response;

  await env.DB.prepare("DELETE FROM user_contact_methods WHERE id = ?").bind(loaded.contact.id).run();
  return json({ ok: true, id: loaded.contact.id });
}
