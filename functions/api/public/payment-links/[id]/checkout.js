import { clean, json, jsonError, now, requireDb } from "../../../../_lib/api.js";
import { normalizePlate } from "../../../../_lib/smart-parking.js";
import { ensureStripeSchema, getStripeCredentials, recordStripeActivity, stripeForm, stripeRequest } from "../../../../_lib/stripe.js";

function parseJson(value) {
  try { return value ? JSON.parse(value) : {}; } catch { return {}; }
}

function isOmniParking(link, metadata) {
  const operator = clean(metadata?.operator, 80).toLowerCase();
  const parkingCode = clean(metadata?.parking_code, 120).toLowerCase();
  const workspaceSlug = clean(link?.workspace_slug, 160).toLowerCase();
  const workspaceName = clean(link?.workspace_name, 200).toLowerCase();
  const title = clean(link?.title, 300).toLowerCase();
  return operator === "omni_jr"
    || parkingCode.startsWith("omni_jr_")
    || workspaceSlug === "omni-jr-parking"
    || workspaceName === "omni jr parking"
    || title.startsWith("omni jr parking");
}

function normalizeOmniMetadata(link, metadata) {
  if (!isOmniParking(link, metadata)) return metadata;
  const title = clean(link?.title, 300).toLowerCase();
  const monthly = clean(metadata?.plan_type, 40).toLowerCase() === "monthly"
    || clean(link?.checkout_mode, 40).toLowerCase() === "subscription"
    || title.includes("monthly")
    || title.includes("mensual");
  let vehicleClass = clean(metadata?.vehicle_class, 80).toLowerCase();
  if (!vehicleClass) {
    if (monthly) vehicleClass = "monthly";
    else if (title.includes("truck") || title.includes("big suv") || title.includes("pickup")) vehicleClass = "truck_big_suv";
    else vehicleClass = "sedan_sport_coupe";
  }
  return {
    ...metadata,
    operator: "omni_jr",
    operator_name: "OMNI JR Parking",
    brand_name: "OMNI JR PARKING",
    brand_logo_url: metadata?.brand_logo_url || "/assets/omni-jr/omni-jr-logo-black.svg",
    checkout_theme: "light",
    plan_type: monthly ? "monthly" : "single",
    vehicle_class: vehicleClass,
    max_hours: monthly ? null : Number(metadata?.max_hours || 8),
    subscription_interval: monthly ? clean(metadata?.subscription_interval, 40) || "month" : null
  };
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
            products.metadata_json AS product_metadata_json, workspaces.name AS workspace_name,
            workspaces.slug AS workspace_slug
     FROM payment_links
     LEFT JOIN products ON products.id = payment_links.product_id
     LEFT JOIN workspaces ON workspaces.id = payment_links.workspace_id
     WHERE payment_links.id = ? AND payment_links.status = 'active' LIMIT 1`
  ).bind(id).first();

  if (!link?.id) return jsonError("payment_link_not_found", "Smart Link not found or inactive.", 404);
  const rawMetadata = { ...parseJson(link.product_metadata_json), ...parseJson(link.metadata_json) };
  const metadata = normalizeOmniMetadata(link, rawMetadata);
  const saleType = clean(metadata.sale_type || link.checkout_mode || "purchase_now", 40).toLowerCase();
  if (saleType === "auction") {
    return jsonError("auction_requires_bid", "Esta oferta funciona por pujas. Envía una oferta desde la página de la subasta.", 409);
  }
  if (!Number.isInteger(Number(link.amount_cents)) || Number(link.amount_cents) < 50) {
    return jsonError("amount_required", "Este link necesita un monto válido antes de cobrar.", 400);
  }

  const isParking = clean(metadata.operator, 80).toLowerCase() === "omni_jr";
  const plateDisplay = clean(payload?.plate, 24).toUpperCase();
  const plate = normalizePlate(plateDisplay);
  if (isParking && (plate.length < 2 || plate.length > 12)) {
    return jsonError("parking_plate_required", "Escribe una placa válida antes de continuar.", 400, { fields: ["plate"] });
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
  const paymentMetadata = {
    source: "boostr_payment_link",
    workspace_name: link.workspace_name || null,
    sale_type: saleType,
    stripe_mode: stripeMode,
    ui_mode: "elements",
    operator: isParking ? "omni_jr" : null,
    parking_plate: isParking ? plateDisplay : null,
    parking_plate_normalized: isParking ? plate : null,
    parking_vehicle_class: isParking ? clean(metadata.vehicle_class, 80) || null : null,
    parking_plan_type: isParking ? clean(metadata.plan_type || (saleType === "subscription" ? "monthly" : "single"), 40) : null,
    parking_max_hours: isParking ? Number(metadata.max_hours || 8) : null
  };

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
    JSON.stringify(paymentMetadata),
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
    "metadata[sale_type]": saleType,
    "metadata[operator]": isParking ? "omni_jr" : undefined,
    "metadata[parking_plate]": isParking ? plate : undefined,
    "metadata[parking_vehicle_class]": isParking ? clean(metadata.vehicle_class, 80) || "monthly" : undefined
  };

  if (stripeMode === "subscription") {
    const interval = ["month", "year"].includes(metadata.subscription_interval) ? metadata.subscription_interval : "month";
    formPayload["line_items[0][price_data][recurring][interval]"] = interval;
    formPayload["subscription_data][metadata][boostr_payment_id]"] = paymentId;
    formPayload["subscription_data][metadata][payment_link_id]"] = link.id;
    if (isParking) {
      formPayload["subscription_data][metadata][operator]"] = "omni_jr";
      formPayload["subscription_data][metadata][parking_plate]"] = plate;
    }
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
        ui_mode: "elements",
        operator: isParking ? "omni_jr" : null,
        plate: isParking ? plate : null
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
