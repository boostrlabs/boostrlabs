import { clean, now } from "./api.js";

const documentTypes = new Set([
  "invoice",
  "receipt",
  "ticket",
  "quote",
  "contract",
  "license",
  "certificate",
  "delivery_note",
  "warranty_card",
  "custom"
]);

const documentStatuses = new Set([
  "draft",
  "live",
  "pending",
  "paid",
  "fulfilled",
  "refunded",
  "canceled",
  "void",
  "archived"
]);

const accessModes = new Set(["public_link", "customer_only", "workspace", "private"]);

const typePrefixes = {
  invoice: "INV",
  receipt: "RCT",
  ticket: "TKT",
  quote: "QTE",
  contract: "CTR",
  license: "LIC",
  certificate: "CRT",
  delivery_note: "DLV",
  warranty_card: "WAR",
  custom: "DOC"
};

export function parseDocumentJson(value, fallback) {
  try {
    if (value === null || value === undefined || value === "") return fallback;
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}

function normalizeArray(value) {
  const parsed = parseDocumentJson(value, []);
  return Array.isArray(parsed) ? parsed : [];
}

function normalizeObject(value) {
  const parsed = parseDocumentJson(value, {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function normalizeType(value) {
  const type = clean(value || "custom", 40).toLowerCase();
  return documentTypes.has(type) ? type : "custom";
}

function normalizeStatus(value) {
  const status = clean(value || "draft", 40).toLowerCase();
  return documentStatuses.has(status) ? status : "draft";
}

function normalizeAccessMode(value) {
  const mode = clean(value || "public_link", 40).toLowerCase();
  return accessModes.has(mode) ? mode : "public_link";
}

function normalizeCurrency(value) {
  return clean(value || "USD", 8).toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "USD";
}

function normalizeCents(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : 0;
}

function randomToken(length = 16) {
  return crypto.randomUUID().replace(/-/g, "").slice(0, length);
}

function publicSlug(type) {
  return `${typePrefixes[type] || "DOC"}-${randomToken(14)}`.toLowerCase();
}

function documentNumber(type) {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${typePrefixes[type] || "DOC"}-${year}${month}-${randomToken(6).toUpperCase()}`;
}

export async function ensureSmartDocumentsSchema(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS smart_documents (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      created_by_user_id TEXT,
      public_slug TEXT NOT NULL,
      document_number TEXT,
      document_type TEXT NOT NULL DEFAULT 'invoice',
      title TEXT NOT NULL,
      subtitle TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      customer_name TEXT,
      customer_email TEXT,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      related_type TEXT,
      related_id TEXT,
      template_key TEXT NOT NULL DEFAULT 'immersive',
      theme_json TEXT,
      blocks_json TEXT,
      timeline_json TEXT,
      actions_json TEXT,
      access_mode TEXT NOT NULL DEFAULT 'public_link',
      published_at TEXT,
      expires_at TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();
  await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_smart_documents_public_slug ON smart_documents(public_slug)").run();
  await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_smart_documents_workspace_number ON smart_documents(workspace_id, document_number) WHERE document_number IS NOT NULL").run();
  await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_smart_documents_related_unique ON smart_documents(workspace_id, related_type, related_id, document_type) WHERE related_id IS NOT NULL").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_smart_documents_workspace ON smart_documents(workspace_id, created_at DESC)").run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS smart_document_events (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      visibility TEXT NOT NULL DEFAULT 'public',
      metadata_json TEXT,
      occurred_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_smart_document_events_document ON smart_document_events(document_id, occurred_at DESC)").run();
}

export function hydrateSmartDocument(row) {
  if (!row) return null;
  return {
    ...row,
    theme: normalizeObject(row.theme_json),
    blocks: normalizeArray(row.blocks_json),
    timeline: normalizeArray(row.timeline_json),
    actions: normalizeArray(row.actions_json),
    public_url: row.public_slug ? `/d/${row.public_slug}` : null
  };
}

export async function appendSmartDocumentEvent(env, {
  documentId,
  workspaceId,
  eventType,
  title,
  body = null,
  visibility = "public",
  metadata = {},
  occurredAt = null
}) {
  await ensureSmartDocumentsSchema(env);
  const timestamp = occurredAt || now();
  const event = {
    id: crypto.randomUUID(),
    document_id: clean(documentId, 160),
    workspace_id: clean(workspaceId, 160),
    event_type: clean(eventType || "document.updated", 120),
    title: clean(title || "Documento actualizado", 220),
    body: clean(body || "", 1200) || null,
    visibility: visibility === "internal" ? "internal" : "public",
    metadata_json: JSON.stringify(metadata || {}),
    occurred_at: timestamp,
    created_at: now()
  };
  await env.DB.prepare(`
    INSERT INTO smart_document_events
      (id, document_id, workspace_id, event_type, title, body, visibility, metadata_json, occurred_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    event.id,
    event.document_id,
    event.workspace_id,
    event.event_type,
    event.title,
    event.body,
    event.visibility,
    event.metadata_json,
    event.occurred_at,
    event.created_at
  ).run();
  return event;
}

export async function createSmartDocument(env, payload = {}) {
  await ensureSmartDocumentsSchema(env);
  const type = normalizeType(payload.document_type || payload.type);
  const status = normalizeStatus(payload.status || "draft");
  const workspaceId = clean(payload.workspace_id, 160);
  if (!workspaceId) throw new Error("workspace_required");

  if (payload.related_type && payload.related_id) {
    const existing = await env.DB.prepare(`
      SELECT * FROM smart_documents
      WHERE workspace_id = ? AND related_type = ? AND related_id = ? AND document_type = ?
      LIMIT 1
    `).bind(
      workspaceId,
      clean(payload.related_type, 80),
      clean(payload.related_id, 160),
      type
    ).first();
    if (existing?.id) return { document: hydrateSmartDocument(existing), existing: true };
  }

  const id = crypto.randomUUID();
  const timestamp = now();
  const slug = clean(payload.public_slug, 180).toLowerCase().replace(/[^a-z0-9-]/g, "-") || publicSlug(type);
  const number = clean(payload.document_number, 100) || documentNumber(type);
  const publishedAt = status === "draft" ? null : clean(payload.published_at, 80) || timestamp;
  const title = clean(payload.title || `${typePrefixes[type]} document`, 240);
  const subtitle = clean(payload.subtitle || "", 500) || null;
  const customerEmail = clean(payload.customer_email || "", 240).toLowerCase() || null;
  const theme = normalizeObject(payload.theme);
  const blocks = normalizeArray(payload.blocks);
  const timeline = normalizeArray(payload.timeline);
  const actions = normalizeArray(payload.actions);

  await env.DB.prepare(`
    INSERT INTO smart_documents (
      id, workspace_id, created_by_user_id, public_slug, document_number, document_type,
      title, subtitle, status, customer_name, customer_email, amount_cents, currency,
      related_type, related_id, template_key, theme_json, blocks_json, timeline_json,
      actions_json, access_mode, published_at, expires_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    workspaceId,
    clean(payload.created_by_user_id, 160) || null,
    slug,
    number,
    type,
    title,
    subtitle,
    status,
    clean(payload.customer_name || "", 220) || null,
    customerEmail,
    normalizeCents(payload.amount_cents),
    normalizeCurrency(payload.currency),
    clean(payload.related_type || "", 80) || null,
    clean(payload.related_id || "", 160) || null,
    clean(payload.template_key || "immersive", 80) || "immersive",
    JSON.stringify(theme),
    JSON.stringify(blocks),
    JSON.stringify(timeline),
    JSON.stringify(actions),
    normalizeAccessMode(payload.access_mode),
    publishedAt,
    clean(payload.expires_at || "", 80) || null,
    timestamp,
    timestamp
  ).run();

  const row = await env.DB.prepare("SELECT * FROM smart_documents WHERE id = ? LIMIT 1").bind(id).first();
  await appendSmartDocumentEvent(env, {
    documentId: id,
    workspaceId,
    eventType: "document.created",
    title: status === "draft" ? "Documento creado" : "Documento publicado",
    body: title,
    metadata: { document_type: type, document_number: number, status }
  });
  return { document: hydrateSmartDocument(row), existing: false };
}

export async function updateSmartDocument(env, id, payload = {}) {
  await ensureSmartDocumentsSchema(env);
  const existing = await env.DB.prepare("SELECT * FROM smart_documents WHERE id = ? LIMIT 1").bind(clean(id, 160)).first();
  if (!existing?.id) return null;

  const type = normalizeType(payload.document_type || existing.document_type);
  const status = normalizeStatus(payload.status || existing.status);
  const timestamp = now();
  const wasStatus = existing.status;
  const publishedAt = status === "draft" ? existing.published_at : existing.published_at || timestamp;

  await env.DB.prepare(`
    UPDATE smart_documents SET
      document_type = ?, title = ?, subtitle = ?, status = ?, customer_name = ?,
      customer_email = ?, amount_cents = ?, currency = ?, template_key = ?, theme_json = ?,
      blocks_json = ?, timeline_json = ?, actions_json = ?, access_mode = ?, published_at = ?,
      expires_at = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    type,
    clean(payload.title ?? existing.title, 240),
    clean(payload.subtitle ?? existing.subtitle ?? "", 500) || null,
    status,
    clean(payload.customer_name ?? existing.customer_name ?? "", 220) || null,
    clean(payload.customer_email ?? existing.customer_email ?? "", 240).toLowerCase() || null,
    payload.amount_cents === undefined ? Number(existing.amount_cents || 0) : normalizeCents(payload.amount_cents),
    payload.currency === undefined ? existing.currency : normalizeCurrency(payload.currency),
    clean(payload.template_key ?? existing.template_key ?? "immersive", 80),
    JSON.stringify(payload.theme === undefined ? normalizeObject(existing.theme_json) : normalizeObject(payload.theme)),
    JSON.stringify(payload.blocks === undefined ? normalizeArray(existing.blocks_json) : normalizeArray(payload.blocks)),
    JSON.stringify(payload.timeline === undefined ? normalizeArray(existing.timeline_json) : normalizeArray(payload.timeline)),
    JSON.stringify(payload.actions === undefined ? normalizeArray(existing.actions_json) : normalizeArray(payload.actions)),
    payload.access_mode === undefined ? existing.access_mode : normalizeAccessMode(payload.access_mode),
    publishedAt,
    clean(payload.expires_at ?? existing.expires_at ?? "", 80) || null,
    timestamp,
    existing.id
  ).run();

  if (status !== wasStatus) {
    await appendSmartDocumentEvent(env, {
      documentId: existing.id,
      workspaceId: existing.workspace_id,
      eventType: `document.status.${status}`,
      title: status === "paid" ? "Pago confirmado" : status === "fulfilled" ? "Entrega completada" : `Estado: ${status}`,
      body: clean(payload.status_note || "", 1000) || null,
      metadata: { from: wasStatus, to: status }
    });
  }

  const updated = await env.DB.prepare("SELECT * FROM smart_documents WHERE id = ? LIMIT 1").bind(existing.id).first();
  return hydrateSmartDocument(updated);
}

export async function syncPaymentReceipt(env, paymentId, requestedStatus = "paid") {
  await ensureSmartDocumentsSchema(env);
  const payment = await env.DB.prepare(`
    SELECT stripe_payments.id, stripe_payments.workspace_id, stripe_payments.payment_link_id,
           stripe_payments.customer_email, stripe_payments.amount_cents, stripe_payments.currency,
           stripe_payments.status, payment_links.title AS payment_title,
           products.description AS product_description, workspaces.name AS workspace_name
    FROM stripe_payments
    LEFT JOIN payment_links ON payment_links.id = stripe_payments.payment_link_id
    LEFT JOIN products ON products.id = payment_links.product_id
    LEFT JOIN workspaces ON workspaces.id = stripe_payments.workspace_id
    WHERE stripe_payments.id = ? LIMIT 1
  `).bind(clean(paymentId, 160)).first();
  if (!payment?.id) return null;

  const status = requestedStatus === "refunded" ? "refunded" : requestedStatus === "paid" ? "paid" : "pending";
  const amountLabel = new Intl.NumberFormat("en-US", { style: "currency", currency: payment.currency || "USD" }).format(Number(payment.amount_cents || 0) / 100);
  const blocks = [
    {
      type: "summary",
      eyebrow: "COMPROBANTE",
      heading: payment.payment_title || "Pago BOOSTR",
      body: payment.product_description || "Transacción procesada mediante BOOSTR Smart Pay.",
      items: [
        { label: "Total", value: amountLabel },
        { label: "Estado", value: status === "refunded" ? "Reembolsado" : status === "paid" ? "Pagado" : "Procesando" },
        { label: "Correo", value: payment.customer_email || "Invitado" }
      ]
    },
    { type: "timeline", heading: "Historial en vivo" },
    { type: "qr", heading: "Comprobante verificable", value: `/d/payment-${payment.id}` }
  ];
  const theme = { effect: "aurora", accent: "#feedb9", background: "#020202" };
  const result = await createSmartDocument(env, {
    workspace_id: payment.workspace_id,
    document_type: "receipt",
    title: `Comprobante · ${payment.payment_title || "BOOSTR Smart Pay"}`,
    subtitle: payment.workspace_name || "BOOSTR",
    status,
    customer_email: payment.customer_email,
    amount_cents: payment.amount_cents,
    currency: payment.currency,
    related_type: "stripe_payment",
    related_id: payment.id,
    template_key: "immersive",
    theme,
    blocks,
    access_mode: "public_link"
  });

  let document = result.document;
  if (result.existing && document.status !== status) {
    document = await updateSmartDocument(env, document.id, { status, status_note: status === "refunded" ? "El pago fue reembolsado." : "El pago fue confirmado." });
  }
  if (!result.existing && status === "paid") {
    await appendSmartDocumentEvent(env, {
      documentId: document.id,
      workspaceId: document.workspace_id,
      eventType: "payment.confirmed",
      title: "Pago confirmado",
      body: amountLabel,
      metadata: { payment_id: payment.id, payment_link_id: payment.payment_link_id }
    });
  }
  return document;
}
