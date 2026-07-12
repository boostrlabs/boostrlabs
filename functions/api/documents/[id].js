import { clean, json, jsonError, readJson, requireDb, requireRole, requireWorkspaceAccess } from "../../_lib/api.js";
import { customOsRoles } from "../../_lib/custom-os.js";
import { ensureSmartDocumentsSchema, hydrateSmartDocument, parseDocumentJson, updateSmartDocument } from "../../_lib/documents.js";

async function loadDocument(env, id) {
  await ensureSmartDocumentsSchema(env);
  return env.DB.prepare("SELECT * FROM smart_documents WHERE id = ? LIMIT 1").bind(clean(id, 160)).first();
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const document = await loadDocument(env, params.id);
  if (!document?.id) return jsonError("document_not_found", "Document not found.", 404);
  const access = requireWorkspaceAccess(auth, document.workspace_id);
  if (!access.ok) return access.response;

  const events = await env.DB.prepare(`
    SELECT id, document_id, workspace_id, event_type, title, body, visibility, metadata_json, occurred_at, created_at
    FROM smart_document_events
    WHERE document_id = ?
    ORDER BY occurred_at DESC
    LIMIT 100
  `).bind(document.id).all();

  return json({
    ok: true,
    document: hydrateSmartDocument(document),
    events: (events.results || []).map((event) => ({
      ...event,
      metadata: parseDocumentJson(event.metadata_json, {})
    }))
  });
}

export async function onRequestPatch({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const existing = await loadDocument(env, params.id);
  if (!existing?.id) return jsonError("document_not_found", "Document not found.", 404);
  const access = requireWorkspaceAccess(auth, existing.workspace_id);
  if (!access.ok) return access.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const document = await updateSmartDocument(env, existing.id, parsed.payload || {});
  return json({ ok: true, document });
}

export async function onRequestDelete({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const existing = await loadDocument(env, params.id);
  if (!existing?.id) return jsonError("document_not_found", "Document not found.", 404);
  const access = requireWorkspaceAccess(auth, existing.workspace_id);
  if (!access.ok) return access.response;
  const document = await updateSmartDocument(env, existing.id, { status: "archived" });
  return json({ ok: true, document });
}
