import { clean, json, jsonError, now, readJson, requireDb, requireSession, requireWorkspaceAccess } from "../../_lib/api.js";
import { contactShape, contactTypes, contactVisibility, requireAllowed } from "../../_lib/app-normal.js";

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
  const workspaceId = clean(url.searchParams.get("workspace_id"), 120);
  const filters = ["user_id = ?"];
  const binds = [auth.user.id];

  if (workspaceId) {
    const access = requireWorkspaceAccess(auth, workspaceId);
    if (!access.ok) return access.response;
    filters.push("(workspace_id = ? OR workspace_id IS NULL)");
    binds.push(workspaceId);
  }

  const result = await env.DB.prepare(
    `SELECT id, user_id, workspace_id, contact_type, label, value, is_primary,
            visibility, verified_at, created_at, updated_at
     FROM user_contact_methods
     WHERE ${filters.join(" AND ")}
     ORDER BY is_primary DESC, created_at DESC
     LIMIT ?`
  )
    .bind(...binds, clampLimit(url.searchParams.get("limit")))
    .all();

  return json({ ok: true, contacts: (result.results || []).map(contactShape) });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const auth = await requireSession(request, env);
  if (!auth.ok) return auth.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};

  const type = requireAllowed(payload.contact_type, contactTypes, "invalid_contact_type", "Contact type is not supported.");
  if (!type.ok) return type.response;
  const visibility = requireAllowed(payload.visibility || "private", contactVisibility, "invalid_contact_visibility", "Contact visibility is not supported.");
  if (!visibility.ok) return visibility.response;

  const workspaceId = clean(payload.workspace_id, 120) || null;
  if (workspaceId) {
    const access = requireWorkspaceAccess(auth, workspaceId);
    if (!access.ok) return access.response;
  }

  const value = clean(payload.value, 500);
  if (!value) return jsonError("contact_value_required", "Contact value is required.", 400, { fields: ["value"] });

  const timestamp = now();
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO user_contact_methods (
      id, user_id, workspace_id, contact_type, label, value, is_primary,
      visibility, verified_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`
  )
    .bind(
      id,
      auth.user.id,
      workspaceId,
      type.value,
      clean(payload.label, 120) || null,
      value,
      payload.is_primary ? 1 : 0,
      visibility.value,
      timestamp,
      timestamp
    )
    .run();

  const row = await env.DB.prepare("SELECT * FROM user_contact_methods WHERE id = ? LIMIT 1").bind(id).first();
  return json({ ok: true, contact: contactShape(row) }, 201);
}
