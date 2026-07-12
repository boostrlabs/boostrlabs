import { clean, json, jsonError, readJson, requireDb, requireRole, requireWorkspaceAccess } from "../../../_lib/api.js";
import { customOsRoles } from "../../../_lib/custom-os.js";
import { appendSmartDocumentEvent, ensureSmartDocumentsSchema, parseDocumentJson } from "../../../_lib/documents.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

async function getDocument(env, id) {
  await ensureSmartDocumentsSchema(env);
  return env.DB.prepare("SELECT id, workspace_id FROM smart_documents WHERE id = ? LIMIT 1").bind(clean(id, 160)).first();
}

export async function onRequestGet({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const document = await getDocument(env, params.id);
  if (!document?.id) return jsonError("document_not_found", "Document not found.", 404);
  const access = requireWorkspaceAccess(auth, document.workspace_id);
  if (!access.ok) return access.response;
  const result = await env.DB.prepare(`
    SELECT * FROM smart_document_events
    WHERE document_id = ?
    ORDER BY occurred_at DESC
    LIMIT 100
  `).bind(document.id).all();
  return json({
    ok: true,
    events: (result.results || []).map((event) => ({ ...event, metadata: parseDocumentJson(event.metadata_json, {}) }))
  });
}

export async function onRequestPost({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const document = await getDocument(env, params.id);
  if (!document?.id) return jsonError("document_not_found", "Document not found.", 404);
  const access = requireWorkspaceAccess(auth, document.workspace_id);
  if (!access.ok) return access.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};
  if (!clean(payload.title, 220)) return jsonError("event_title_required", "Event title is required.", 400);

  const event = await appendSmartDocumentEvent(env, {
    documentId: document.id,
    workspaceId: document.workspace_id,
    eventType: clean(payload.event_type || "document.timeline", 120),
    title: clean(payload.title, 220),
    body: clean(payload.body || "", 1200) || null,
    visibility: payload.visibility === "internal" ? "internal" : "public",
    metadata: payload.metadata || {},
    occurredAt: clean(payload.occurred_at || "", 80) || null
  });
  return json({ ok: true, event }, 201);
}
