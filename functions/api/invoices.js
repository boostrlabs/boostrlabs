import { clean, defaultWorkspaceId, isValidEmail, json, jsonError, now, readJson, requireDb, requireRole, requireWorkspaceAccess } from "../_lib/api.js";
import { customOsRoles } from "../_lib/custom-os.js";
import { createSmartDocument } from "../_lib/documents.js";

const statuses = new Set(["draft", "sent", "paid_later", "void", "archived"]);
const cols = "id, workspace_id, created_by_user_id, customer_name, customer_email, invoice_number, status, amount_cents, currency, due_at, related_type, related_id, line_items_json, metadata_json, created_at, updated_at";
const limit = (value) => Math.min(Math.max(Number(value || 50) || 50, 1), 100);
const normalizeCurrency = (value) => clean(value || "USD", 8).toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "USD";
const cents = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : 0;
};
const metadataJson = (value) => {
  try {
    return JSON.stringify(typeof value === "string" ? JSON.parse(value) : (value || {}));
  } catch {
    return JSON.stringify({ note: clean(value, 800) });
  }
};

function resolveWorkspace(auth, requestedWorkspaceId) {
  const workspaceId = clean(requestedWorkspaceId, 120) || defaultWorkspaceId(auth);
  const access = requireWorkspaceAccess(auth, workspaceId);
  if (!access.ok) return { ok: false, response: access.response };
  return { ok: true, workspace_id: workspaceId };
}

async function nextNumber(env, workspaceId) {
  const row = await env.DB.prepare("SELECT COUNT(*) AS total FROM invoices WHERE workspace_id = ?").bind(workspaceId).first();
  return `INV-${String(Number(row?.total || 0) + 1).padStart(4, "0")}`;
}

function smartStatus(invoiceStatus) {
  if (invoiceStatus === "draft") return "draft";
  if (invoiceStatus === "void") return "void";
  if (invoiceStatus === "paid_later") return "paid";
  return "live";
}

function invoiceBlocks({ invoiceNumber, customerName, customerEmail, amount, currency, dueAt, lineItems }) {
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount || 0) / 100);
  const items = [
    { label: "Factura", value: invoiceNumber },
    { label: "Cliente", value: customerName || customerEmail || "Invitado" },
    { label: "Total", value: money }
  ];
  if (dueAt) items.push({ label: "Vence", value: dueAt });
  return [
    { type: "summary", eyebrow: "FACTURA INTERACTIVA", heading: invoiceNumber, body: "Documento vivo generado por BOOSTR.", items },
    ...(lineItems.length ? [{ type: "files", heading: "Conceptos", files: lineItems.map((item, index) => ({ label: item.label || `Concepto ${index + 1}`, url: item.url || "" })) }] : []),
    { type: "timeline", heading: "Historial en vivo" },
    { type: "qr", heading: "Factura verificable", value: invoiceNumber }
  ];
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const workspace = resolveWorkspace(auth, url.searchParams.get("workspace_id"));
  if (!workspace.ok) return workspace.response;
  const filters = ["workspace_id = ?", "status != 'archived'"];
  const binds = [workspace.workspace_id];
  const status = clean(url.searchParams.get("status"), 40);
  const q = clean(url.searchParams.get("q"), 120).toLowerCase();
  if (status) {
    filters.push("status = ?");
    binds.push(status);
  }
  if (q) {
    filters.push("(lower(customer_name) LIKE ? OR lower(customer_email) LIKE ? OR lower(invoice_number) LIKE ?)");
    binds.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const result = await env.DB.prepare(`SELECT ${cols} FROM invoices WHERE ${filters.join(" AND ")} ORDER BY created_at DESC LIMIT ?`)
    .bind(...binds, limit(url.searchParams.get("limit"))).all();
  return json({ ok: true, workspace_id: workspace.workspace_id, invoices: result.results || [] });
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
  const email = clean(payload.customer_email || payload.email, 180).toLowerCase();
  if (email && !isValidEmail(email)) {
    return jsonError("invalid_customer_email", "Invalid customer email.", 400, { fields: ["customer_email"] });
  }
  const status = statuses.has(clean(payload.status, 40)) ? clean(payload.status, 40) : "draft";
  const id = crypto.randomUUID();
  const timestamp = now();
  const invoiceNumber = clean(payload.invoice_number, 80) || await nextNumber(env, workspace.workspace_id);
  const lineItems = Array.isArray(payload.line_items) ? payload.line_items : [];
  const amount = lineItems.length ? lineItems.reduce((sum, item) => sum + cents(item.amount_cents || item.amount || 0), 0) : cents(payload.amount_cents || payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const customerName = clean(payload.customer_name || payload.name, 180);
  const dueAt = clean(payload.due_at, 80) || null;

  await env.DB.prepare(`
    INSERT INTO invoices (
      id, workspace_id, created_by_user_id, customer_name, customer_email, invoice_number,
      status, amount_cents, currency, due_at, related_type, related_id, line_items_json,
      metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    workspace.workspace_id,
    auth.user?.id || null,
    customerName,
    email || null,
    invoiceNumber,
    status,
    amount,
    currency,
    dueAt,
    clean(payload.related_type, 80) || null,
    clean(payload.related_id, 120) || null,
    JSON.stringify(lineItems),
    metadataJson(payload.metadata),
    timestamp,
    timestamp
  ).run();

  let smartDocument = null;
  try {
    const result = await createSmartDocument(env, {
      workspace_id: workspace.workspace_id,
      created_by_user_id: auth.user?.id || null,
      document_type: "invoice",
      document_number: invoiceNumber,
      title: clean(payload.title || `Factura ${invoiceNumber}`, 240),
      subtitle: clean(payload.subtitle || customerName || email || "BOOSTR Invoice", 500),
      status: smartStatus(status),
      customer_name: customerName,
      customer_email: email || null,
      amount_cents: amount,
      currency,
      related_type: "invoice",
      related_id: id,
      theme: payload.theme || { effect: "aurora", accent: "#feedb9", background: "#020202" },
      blocks: Array.isArray(payload.blocks) ? payload.blocks : invoiceBlocks({ invoiceNumber, customerName, customerEmail: email, amount, currency, dueAt, lineItems }),
      actions: Array.isArray(payload.actions) ? payload.actions : [],
      access_mode: "public_link"
    });
    smartDocument = result.document;
  } catch {}

  return json({
    ok: true,
    invoice: { id, workspace_id: workspace.workspace_id, invoice_number: invoiceNumber, status, amount_cents: amount, currency },
    document: smartDocument
  }, 201);
}
