import { clean, json, jsonError, now, requireDb } from "../../../_lib/api.js";
import { ensureStripeSchema, recordStripeActivity } from "../../../_lib/stripe.js";

function parseSignature(header = "") {
  const result = { timestamp: null, signatures: [] };
  for (const part of String(header).split(",")) {
    const [key, value] = part.split("=", 2);
    if (key === "t") result.timestamp = Number(value);
    if (key === "v1" && value) result.signatures.push(value);
  }
  return result;
}

function hex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a = "", b = "") {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return mismatch === 0;
}

async function verifyStripeSignature(rawBody, header, secret, toleranceSeconds = 300) {
  const parsed = parseSignature(header);
  if (!parsed.timestamp || !parsed.signatures.length) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - parsed.timestamp) > toleranceSeconds) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expected = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${parsed.timestamp}.${rawBody}`)));
  return parsed.signatures.some((signature) => constantTimeEqual(signature, expected));
}

async function updatePayment(env, event) {
  const object = event?.data?.object || {};
  const timestamp = now();
  let paymentId = clean(object?.metadata?.boostr_payment_id, 160);
  let stripeSessionId = null;
  let stripePaymentIntentId = null;
  let status = null;
  let customerEmail = null;

  switch (event.type) {
    case "checkout.session.completed":
      stripeSessionId = clean(object.id, 240);
      stripePaymentIntentId = clean(typeof object.payment_intent === "string" ? object.payment_intent : object.payment_intent?.id, 240);
      customerEmail = clean(object.customer_details?.email || object.customer_email, 240).toLowerCase() || null;
      status = object.payment_status === "paid" ? "paid" : "processing";
      break;
    case "checkout.session.expired":
      stripeSessionId = clean(object.id, 240);
      status = "expired";
      break;
    case "payment_intent.succeeded":
      stripePaymentIntentId = clean(object.id, 240);
      status = "paid";
      break;
    case "payment_intent.processing":
      stripePaymentIntentId = clean(object.id, 240);
      status = "processing";
      break;
    case "payment_intent.payment_failed":
      stripePaymentIntentId = clean(object.id, 240);
      status = "failed";
      break;
    case "payment_intent.canceled":
      stripePaymentIntentId = clean(object.id, 240);
      status = "canceled";
      break;
    case "charge.refunded":
      stripePaymentIntentId = clean(typeof object.payment_intent === "string" ? object.payment_intent : object.payment_intent?.id, 240);
      status = "refunded";
      break;
    default:
      return null;
  }

  let payment = null;
  if (paymentId) {
    payment = await env.DB.prepare("SELECT id, workspace_id, payment_link_id, status FROM stripe_payments WHERE id = ? LIMIT 1").bind(paymentId).first();
  }
  if (!payment && stripeSessionId) {
    payment = await env.DB.prepare("SELECT id, workspace_id, payment_link_id, status FROM stripe_payments WHERE stripe_checkout_session_id = ? LIMIT 1").bind(stripeSessionId).first();
  }
  if (!payment && stripePaymentIntentId) {
    payment = await env.DB.prepare("SELECT id, workspace_id, payment_link_id, status FROM stripe_payments WHERE stripe_payment_intent_id = ? LIMIT 1").bind(stripePaymentIntentId).first();
  }
  if (!payment?.id) return null;

  await env.DB.prepare(
    `UPDATE stripe_payments
     SET stripe_checkout_session_id = COALESCE(?, stripe_checkout_session_id),
         stripe_payment_intent_id = COALESCE(?, stripe_payment_intent_id),
         customer_email = COALESCE(?, customer_email),
         status = COALESCE(?, status),
         updated_at = ?
     WHERE id = ?`
  ).bind(stripeSessionId || null, stripePaymentIntentId || null, customerEmail, status, timestamp, payment.id).run();

  if (status && status !== payment.status) {
    await recordStripeActivity(env, {
      workspaceId: payment.workspace_id,
      eventType: `stripe.${event.type}`,
      title: status === "paid" ? "Pago confirmado" : `Pago actualizado: ${status}`,
      body: `Payment ${payment.id}`,
      metadata: {
        payment_id: payment.id,
        payment_link_id: payment.payment_link_id,
        stripe_event_id: event.id,
        stripe_session_id: stripeSessionId,
        stripe_payment_intent_id: stripePaymentIntentId,
        status
      }
    });
  }

  return { id: payment.id, status };
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const webhookSecret = String(env.STRIPE_WEBHOOK_SECRET || "").trim();
  if (!webhookSecret) return jsonError("stripe_webhook_not_configured", "Stripe webhook secret is not configured.", 503);

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  if (!(await verifyStripeSignature(rawBody, signature, webhookSecret))) {
    return jsonError("invalid_stripe_signature", "Invalid Stripe signature.", 400);
  }

  const event = JSON.parse(rawBody);
  await ensureStripeSchema(env);
  const payment = await updatePayment(env, event);
  return json({ ok: true, received: true, event_id: event.id, event_type: event.type, payment });
}
