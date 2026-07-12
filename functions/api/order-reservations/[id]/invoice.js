import { clean, json, jsonError, now, requireDb, requireRole, requireWorkspaceAccess } from "../../../_lib/api.js";
import { customOsRoles } from "../../../_lib/custom-os.js";
import { createSmartDocument } from "../../../_lib/documents.js";

async function nextInvoiceNumber(env, workspaceId) {
  const row = await env.DB.prepare("SELECT COUNT(*) AS total FROM invoices WHERE workspace_id = ?").bind(workspaceId).first();
  return `INV-${String(Number(row?.total || 0) + 1).padStart(4, "0")}`;
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;
  const id = clean(params.id, 120);
  const reservation = await env.DB.prepare(`
    SELECT order_reservations.id, order_reservations.workspace_id, order_reservations.product_id,
           order_reservations.payment_link_id, order_reservations.guest_email, order_reservations.status,
           order_reservations.metadata_json, payment_links.title AS payment_link_title,
           payment_links.amount_cents, payment_links.currency, products.title AS product_title,
           products.description AS product_description, workspaces.name AS workspace_name
    FROM order_reservations
    LEFT JOIN payment_links ON payment_links.id = order_reservations.payment_link_id
    LEFT JOIN products ON products.id = order_reservations.product_id
    LEFT JOIN workspaces ON workspaces.id = order_reservations.workspace_id
    WHERE order_reservations.id = ? LIMIT 1
  `).bind(id).first();
  if (!reservation?.id) return jsonError("reservation_not_found", "Reservation not found.", 404);
  const access = requireWorkspaceAccess(auth, reservation.workspace_id);
  if (!access.ok) return access.response;

  const existing = await env.DB.prepare("SELECT id, invoice_number FROM invoices WHERE related_type = 'order_reservation' AND related_id = ? AND status != 'archived' LIMIT 1")
    .bind(reservation.id).first();
  if (existing?.id) {
    const document = await env.DB.prepare("SELECT id, public_slug, document_number, status FROM smart_documents WHERE related_type = 'invoice' AND related_id = ? LIMIT 1")
      .bind(existing.id).first().catch(() => null);
    return json({ ok: true, existing: true, invoice: existing, document: document ? { ...document, public_url: `/d/${document.public_slug}` } : null });
  }

  let metadata = {};
  try { metadata = JSON.parse(reservation.metadata_json || "{}"); } catch {}
  const invoiceId = crypto.randomUUID();
  const timestamp = now();
  const invoiceNumber = await nextInvoiceNumber(env, reservation.workspace_id);
  const amount = Number(reservation.amount_cents || 0);
  const currency = clean(reservation.currency || "USD", 8).toUpperCase().slice(0, 3) || "USD";
  const label = reservation.product_title || reservation.payment_link_title || "Smart Link reservation";
  const lineItems = [{ label, amount_cents: amount, source: "order_reservation" }];

  await env.DB.prepare(`
    INSERT INTO invoices (
      id, workspace_id, created_by_user_id, customer_name, customer_email, invoice_number,
      status, amount_cents, currency, related_type, related_id, line_items_json, metadata_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, 'order_reservation', ?, ?, ?, ?, ?)
  `).bind(
    invoiceId,
    reservation.workspace_id,
    auth.user?.id || null,
    clean(metadata.customer_name || "", 180),
    clean(reservation.guest_email, 180).toLowerCase(),
    invoiceNumber,
    amount,
    currency,
    reservation.id,
    JSON.stringify(lineItems),
    JSON.stringify({ payment_link_id: reservation.payment_link_id, product_id: reservation.product_id, generated_from: "reservation" }),
    timestamp,
    timestamp
  ).run();

  await env.DB.prepare("UPDATE order_reservations SET status = 'converted', updated_at = ? WHERE id = ?")
    .bind(timestamp, reservation.id).run().catch(() => null);

  let smartDocument = null;
  try {
    const formattedAmount = new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);
    const result = await createSmartDocument(env, {
      workspace_id: reservation.workspace_id,
      created_by_user_id: auth.user?.id || null,
      document_type: "invoice",
      document_number: invoiceNumber,
      title: `Factura · ${label}`,
      subtitle: reservation.workspace_name || "BOOSTR Invoice",
      status: "draft",
      customer_name: clean(metadata.customer_name || "", 180),
      customer_email: clean(reservation.guest_email, 180).toLowerCase(),
      amount_cents: amount,
      currency,
      related_type: "invoice",
      related_id: invoiceId,
      theme: { effect: "aurora", accent: "#feedb9", background: "#020202" },
      blocks: [
        {
          type: "summary",
          eyebrow: "FACTURA INTERACTIVA",
          heading: label,
          body: reservation.product_description || "Reserva convertida en factura por BOOSTR.",
          items: [
            { label: "Factura", value: invoiceNumber },
            { label: "Cliente", value: clean(metadata.customer_name || reservation.guest_email || "Invitado", 220) },
            { label: "Total", value: formattedAmount },
            { label: "Estado", value: "Borrador" }
          ]
        },
        { type: "timeline", heading: "Historial en vivo" },
        { type: "qr", heading: "Factura verificable", value: invoiceNumber }
      ],
      access_mode: "public_link"
    });
    smartDocument = result.document;
  } catch {}

  try {
    await env.DB.prepare(`
      INSERT INTO activity_events (id, workspace_id, user_id, event_type, title, body, metadata_json, created_at)
      VALUES (?, ?, ?, 'invoice.created_from_reservation', 'Invoice created from reservation', ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      reservation.workspace_id,
      auth.user?.id || null,
      invoiceNumber,
      JSON.stringify({ invoice_id: invoiceId, reservation_id: reservation.id, smart_document_id: smartDocument?.id || null }),
      timestamp
    ).run();
  } catch {}

  return json({
    ok: true,
    invoice: { id: invoiceId, invoice_number: invoiceNumber, status: "draft", amount_cents: amount, currency },
    document: smartDocument,
    reservation_status: "converted"
  }, 201);
}
