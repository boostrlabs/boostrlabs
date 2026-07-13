import { clean, defaultWorkspaceId, isValidEmail, json, jsonError, readJson, requireDb, requireRole, requireWorkspaceAccess } from "../_lib/api.js";
import { customOsRoles } from "../_lib/custom-os.js";
import { createSmartDocument, ensureSmartDocumentsSchema, hydrateSmartDocument } from "../_lib/documents.js";

const limit = (value) => Math.min(Math.max(Number(value || 50) || 50, 1), 100);

function resolveWorkspace(auth, requestedWorkspaceId) {
  const workspaceId = clean(requestedWorkspaceId, 160) || defaultWorkspaceId(auth);
  const access = requireWorkspaceAccess(auth, workspaceId);
  if (!access.ok) return { ok: false, response: access.response };
  return { ok: true, workspace_id: workspaceId };
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  await ensureSmartDocumentsSchema(env);

  const url = new URL(request.url);
  const workspace = resolveWorkspace(auth, url.searchParams.get("workspace_id"));
  if (!workspace.ok) return workspace.response;

  const filters = ["workspace_id = ?", "status != 'archived'"];
  const binds = [workspace.workspace_id];
  const type = clean(url.searchParams.get("type"), 40).toLowerCase();
  const status = clean(url.searchParams.get("status"), 40).toLowerCase();
  const q = clean(url.searchParams.get("q"), 160).toLowerCase();
  if (type) {
    filters.push("document_type = ?");
    binds.push(type);
  }
  if (status) {
    filters.push("status = ?");
    binds.push(status);
  }
  if (q) {
    filters.push("(lower(title) LIKE ? OR lower(document_number) LIKE ? OR lower(customer_name) LIKE ? OR lower(customer_email) LIKE ?)");
    binds.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  const result = await env.DB.prepare(`
    SELECT * FROM smart_documents
    WHERE ${filters.join(" AND ")}
    ORDER BY updated_at DESC, created_at DESC
    LIMIT ?
  `).bind(...binds, limit(url.searchParams.get("limit"))).all();

  return json({
    ok: true,
    workspace_id: workspace.workspace_id,
    documents: (result.results || []).map(hydrateSmartDocument)
  });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};
  const workspace = resolveWorkspace(auth, payload.workspace_id);
  if (!workspace.ok) return workspace.response;

  const email = clean(payload.customer_email || "", 240).toLowerCase();
  if (email && !isValidEmail(email)) {
    return jsonError("invalid_customer_email", "Invalid customer email.", 400, { fields: ["customer_email"] });
  }
  if (!clean(payload.title, 240)) {
    return jsonError("document_title_required", "Document title is required.", 400, { fields: ["title"] });
  }

  try {
    const result = await createSmartDocument(env, {
      ...payload,
      workspace_id: workspace.workspace_id,
      created_by_user_id: auth.user?.id || null,
      customer_email: email || null
    });
    return json({ ok: true, ...result }, result.existing ? 200 : 201);
  } catch (error) {
    return jsonError("document_create_failed", clean(error?.message, 500) || "Document could not be created.", 500);
  }
}
