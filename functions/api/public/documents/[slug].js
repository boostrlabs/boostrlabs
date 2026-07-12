import { clean, json, jsonError, requireDb } from "../../../_lib/api.js";
import { ensureSmartDocumentsSchema, hydrateSmartDocument, parseDocumentJson } from "../../../_lib/documents.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  await ensureSmartDocumentsSchema(env);
  const slug = clean(params.slug, 180).toLowerCase();
  const document = await env.DB.prepare(`
    SELECT smart_documents.*, workspaces.name AS workspace_name, workspaces.slug AS workspace_slug
    FROM smart_documents
    LEFT JOIN workspaces ON workspaces.id = smart_documents.workspace_id
    WHERE smart_documents.public_slug = ?
      AND smart_documents.status NOT IN ('draft', 'archived', 'void')
      AND smart_documents.access_mode = 'public_link'
    LIMIT 1
  `).bind(slug).first();
  if (!document?.id) return jsonError("document_not_found", "Document not found or not public.", 404);
  if (document.expires_at && Date.parse(document.expires_at) < Date.now()) {
    return jsonError("document_expired", "This document has expired.", 410);
  }

  const events = await env.DB.prepare(`
    SELECT id, event_type, title, body, metadata_json, occurred_at
    FROM smart_document_events
    WHERE document_id = ? AND visibility = 'public'
    ORDER BY occurred_at DESC
    LIMIT 100
  `).bind(document.id).all();

  return json({
    ok: true,
    document: hydrateSmartDocument(document),
    events: (events.results || []).map((event) => ({ ...event, metadata: parseDocumentJson(event.metadata_json, {}) }))
  });
}
