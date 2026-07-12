import { clean, json, jsonError, now, requireDb } from "../../../../_lib/api.js";
import { ensureStripeSchema, getStripeCredentials, recordStripeActivity, stripeForm, stripeRequest } from "../../../../_lib/stripe.js";

function parseJson(value) {
  try { return value ? JSON.parse(value) : {}; } catch { return {}; }
}

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
            payment_links.metadata_json, products.description AS product_description,
            products.metadata_json AS product_metadata_json, workspaces.name AS workspace_name
     FROM payment_links
     LEFT JOIN products ON products.id = payment_links.product_id
     LEFT JOIN workspaces ON workspaces.id = payment_links.workspace_id
     WHERE payment_links.id = ? AND payment_links.status = 'active' LIMIT 1`
  ).bind(id).first();

  if (!link?.id) return jsonError("payment_link_not_found", "Smart Link not found or inactive.", 404);
  const metadata = { ...parseJson(link.product_metadata_json), ...parseJson(link.metadata_json) };
  const saleType = clean(metadata.sale_type || link.checkout_mode || "purchase_now", 40).toLowerCase();
  if (saleType === "auction") {
    return jsonError("auction_requires_bid", "Esta oferta funciona por pujas. Envía una oferta desde la página de la subasta.", 409);
  }
  if (!Number.isInteger(Number(link.amount_cents)) || Number(link.amount_cents) < 50) {
    return jsonError("amount_required", "Este link necesita un monto válido antes de cobrar.", 400);
  }

  let credentials;
  try {
    credentials = await getStripeCredentials(env);
  } catch {
    return jsonError("payment_provider_not_configured", "El proveedor de pagos todavía no está configurado.", 503);
  }
  if (!credentials.publishableKey) {
    return jsonError("payment_public_key_missing", "Falta la clave pública del proveedor de pagos.", 503);
  }

  await ensureStripeSchema(env);
  const paymentId = crypto.randomUUID();
  const timestamp = now();
  const currency = clean(link.currency || "USD", 12).toLowerCase();
  const origin = new URL(request.url).origin;
  const stripeMode = saleType === "subscription" ? "subscription" : "payment";

  await env.DB.prepare(
    `INSERT INTO stripe_payments
      (id, workspace_id, payment_link_id, customer_email, amount_cents, currency, mode, status, metadata_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
  ).bind(
    paymentId,
    link.workspace_id,
    link.id,
    email || null,
    Number(link.amount_cents),
    currency,
    credentials.mode,
    JSON.stringify({
      source: "boostr_payment_link",
      workspace_name: link.workspace_name || null,
      sale_type: saleType,
      stripe_mode: stripeMode,
      ui_mode: "elements"
    }),
    timestamp,
    timestamp
  ).run();

  const formPayload = {
    mode: stripeMode,
    ui_mode: "elements",
    return_url: `${origin}/pay/${encodeURIComponent(link.id)}?session_id={CHECKOUT_SESSION_ID}`,
    customer_email: email || undefined,
    client_reference_id: paymentId,
    "line_items[0][price_data][currency]": currency,
    "line_items[0][price_data][unit_amount]": Number(link.amount_cents),
    "line_items[0][price_data][product_data][name]": link.title,
    "line_items[0][price_data][product_data][description]": clean(link.product_description, 500) || undefined,
    "line_items[0][quantity]": 1,
    "metadata[boostr_payment_id]": paymentId,
    "metadata[payment_link_id]": link.id,
    "metadata[workspace_id]": link.workspace_id,
    "metadata[sale_type]": saleType
  };

  if (stripeMode === "subscription") {
    const interval = ["month", "year"].includes(metadata.subscription_interval) ? metadata.subscription_interval : "month";
    formPayload["line_items[0][price_data][recurring][interval]"] = interval;
    formPayload["subscription_data][metadata][boostr_payment_id]"] = paymentId;
    formPayload["subscription_data][metadata][payment_link_id]"] = link.id;
  }

  try {
    const session = await stripeRequest(credentials.secretKey, "/checkout/sessions", {
      method: "POST",
      body: stripeForm(formPayload),
      idempotencyKey: `boostr-elements-checkout-${paymentId}`
    });

    if (!session?.client_secret) throw new Error("payment_client_secret_missing");

    await env.DB.prepare(
      `UPDATE stripe_payments
       SET stripe_checkout_session_id = ?, checkout_url = NULL, status = 'checkout_created', updated_at = ?
       WHERE id = ?`
    ).bind(session.id, now(), paymentId).run();

    await recordStripeActivity(env, {
      workspaceId: link.workspace_id,
      eventType: stripeMode === "subscription" ? "payments.subscription.elements.created" : "payments.elements.created",
      title: stripeMode === "subscription" ? "Suscripción preparada" : "Pago preparado",
      body: link.title,
      metadata: {
        payment_id: paymentId,
        payment_link_id: link.id,
        session_id: session.id,
        mode: credentials.mode,
        sale_type: saleType,
        ui_mode: "elements"
      }
    });

    return json({
      ok: true,
      checkout: {
        payment_id: paymentId,
        session_id: session.id,
        client_secret: session.client_secret,
        publishable_key: credentials.publishableKey,
        mode: credentials.mode,
        sale_type: saleType,
        ui_mode: "elements"
      }
    }, 201);
  } catch (error) {
    await env.DB.prepare("UPDATE stripe_payments SET status = 'failed', updated_at = ? WHERE id = ?").bind(now(), paymentId).run();
    return jsonError(
      error.code || "payment_checkout_failed",
      clean(error.message, 500) || "No se pudo preparar el formulario de pago.",
      error.status || 502
    );
  }
}
