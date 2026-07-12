import { clean, json, jsonError, requireDb } from "../../../_lib/api.js";
import { ensureSmartDocumentsSchema, hydrateSmartDocument, parseDocumentJson } from "../../../_lib/documents.js";

function maskEmail(value) {
  const email = clean(value, 240).toLowerCase();
  const [name, domain] = email.split("@");
  if (!name || !domain) return null;
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"•".repeat(Math.max(3, Math.min(8, name.length - visible.length)))}@${domain}`;
}

function publicDocument(row) {
  const document = hydrateSmartDocument(row);
  return {
    id: document.id,
    public_slug: document.public_slug,
    public_url: document.public_url,
    document_number: document.document_number,
    document_type: document.document_type,
    title: document.title,
    subtitle: document.subtitle,
    status: document.status,
    customer_name: document.customer_name,
    customer_email: maskEmail(document.customer_email),
    amount_cents: document.amount_cents,
    currency: document.currency,
    template_key: document.template_key,
    theme: document.theme,
    blocks: document.blocks,
    timeline: document.timeline,
    actions: document.actions,
    published_at: document.published_at,
    expires_at: document.expires_at,
    workspace_name: row.workspace_name || null,
    workspace_slug: row.workspace_slug || null
  };
}

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
    document: publicDocument(document),
    events: (events.results || []).map((event) => ({
      id: event.id,
      event_type: event.event_type,
      title: event.title,
      body: event.body,
      occurred_at: event.occurred_at,
      metadata: parseDocumentJson(event.metadata_json, {})
    }))
  });
}
