import { clean, json, jsonError, now, requireDb } from "../../../../_lib/api.js";
import { ensureStripeSchema, getStripeCredentials, recordStripeActivity, stripeForm, stripeRequest } from "../../../../_lib/stripe.js";

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestPost({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const id = clean(params.id, 160);
  const payload = await request.json().catch(() => ({}));
  const email = clean(payload?.email, 240).toLowerCase();

  const link = await env.DB.prepare(
    `SELECT payment_links.id, payment_links.workspace_id, payment_links.title, payment_links.amount_cents,
            payment_links.currency, payment_links.status, payment_links.checkout_mode,
            products.description AS product_description, workspaces.name AS workspace_name
     FROM payment_links
     LEFT JOIN products ON products.id = payment_links.product_id
     LEFT JOIN workspaces ON workspaces.id = payment_links.workspace_id
     WHERE payment_links.id = ? AND payment_links.status = 'active' LIMIT 1`
  ).bind(id).first();

  if (!link?.id) return jsonError("payment_link_not_found", "Smart Link not found or inactive.", 404);
  if (!Number.isInteger(Number(link.amount_cents)) || Number(link.amount_cents) < 50) {
    return jsonError("amount_required", "Este link necesita un monto válido antes de cobrar.", 400);
  }

  let credentials;
  try {
    credentials = await getStripeCredentials(env);
  } catch {
    return jsonError("stripe_not_configured", "Stripe todavía no está configurado para BOOSTR.", 503);
  }

  await ensureStripeSchema(env);
  const paymentId = crypto.randomUUID();
  const timestamp = now();
  const currency = clean(link.currency || "USD", 12).toLowerCase();
  const origin = new URL(request.url).origin;

  await env.DB.prepare(
    `INSERT INTO stripe_payments
      (id, workspace_id, payment_link_id, customer_email, amount_cents, currency, mode, status, metadata_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
  ).bind(paymentId, link.workspace_id, link.id, email || null, Number(link.amount_cents), currency, credentials.mode,
    JSON.stringify({ source: "boostr_payment_link", workspace_name: link.workspace_name || null }), timestamp, timestamp).run();

  const form = stripeForm({
    mode: "payment",
    success_url: `${origin}/pay/success/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pay/${encodeURIComponent(link.id)}?canceled=1`,
    customer_email: email || undefined,
    client_reference_id: paymentId,
    "line_items[0][price_data][currency]": currency,
    "line_items[0][price_data][unit_amount]": Number(link.amount_cents),
    "line_items[0][price_data][product_data][name]": link.title,
    "line_items[0][price_data][product_data][description]": clean(link.product_description, 500) || undefined,
    "line_items[0][quantity]": 1,
    "metadata[boostr_payment_id]": paymentId,
    "metadata[payment_link_id]": link.id,
    "metadata[workspace_id]": link.workspace_id
  });

  try {
    const session = await stripeRequest(credentials.secretKey, "/checkout/sessions", {
      method: "POST",
      body: form,
      idempotencyKey: `boostr-checkout-${paymentId}`
    });

    await env.DB.prepare(
      `UPDATE stripe_payments
       SET stripe_checkout_session_id = ?, checkout_url = ?, status = 'checkout_created', updated_at = ?
       WHERE id = ?`
    ).bind(session.id, session.url || null, now(), paymentId).run();

    await recordStripeActivity(env, {
      workspaceId: link.workspace_id,
      eventType: "stripe.checkout.created",
      title: "Stripe Checkout creado",
      body: link.title,
      metadata: { payment_id: paymentId, payment_link_id: link.id, session_id: session.id, mode: credentials.mode }
    });

    return json({ ok: true, checkout: { payment_id: paymentId, session_id: session.id, url: session.url, mode: credentials.mode } }, 201);
  } catch (error) {
    await env.DB.prepare("UPDATE stripe_payments SET status = 'failed', updated_at = ? WHERE id = ?").bind(now(), paymentId).run();
    return jsonError(error.code || "stripe_checkout_failed", clean(error.message, 500) || "No se pudo abrir Stripe Checkout.", error.status || 502);
  }
}
