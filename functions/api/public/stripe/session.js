import { clean, json, jsonError, now, requireDb } from "../../../_lib/api.js";
import { syncInteractiveReceipt } from "../../../_lib/payment-receipts.js";
import { publicParkingTicket, syncParkingSession } from "../../../_lib/smart-parking.js";
import { ensureStripeSchema, getStripeCredentials, recordStripeActivity, stripeRequest } from "../../../_lib/stripe.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const sessionId = clean(new URL(request.url).searchParams.get("session_id"), 240);
  if (!sessionId || !sessionId.startsWith("cs_")) return jsonError("session_required", "Stripe session required.", 400);

  let credentials;
  try {
    credentials = await getStripeCredentials(env);
  } catch {
    return jsonError("stripe_not_configured", "Stripe no está configurado.", 503);
  }

  await ensureStripeSchema(env);
  try {
    const session = await stripeRequest(credentials.secretKey, `/checkout/sessions/${encodeURIComponent(sessionId)}`);
    const paymentId = clean(session.client_reference_id || session.metadata?.boostr_payment_id, 160);
    const status = session.payment_status === "paid" ? "paid" : session.status === "expired" ? "expired" : "open";
    const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null;
    const email = session.customer_details?.email || session.customer_email || null;

    const existing = await env.DB.prepare("SELECT id, workspace_id, payment_link_id, status FROM stripe_payments WHERE stripe_checkout_session_id = ? OR id = ? LIMIT 1")
      .bind(sessionId, paymentId || "").first();
    if (!existing?.id) return jsonError("payment_not_found", "BOOSTR payment record not found.", 404);

    await env.DB.prepare(`
      UPDATE stripe_payments
      SET stripe_payment_intent_id = ?, customer_email = COALESCE(?, customer_email), status = ?, updated_at = ?
      WHERE id = ?
    `).bind(paymentIntent, email, status, now(), existing.id).run();

    if (status === "paid" && existing.status !== "paid") {
      await recordStripeActivity(env, {
        workspaceId: existing.workspace_id,
        eventType: "stripe.payment.succeeded",
        title: "Pago recibido por Stripe",
        body: `Payment ${existing.id}`,
        metadata: { payment_id: existing.id, payment_link_id: existing.payment_link_id, session_id: sessionId, payment_intent_id: paymentIntent, mode: credentials.mode }
      });
    }

    let document = null;
    let parkingSession = null;
    if (status === "paid") {
      try { document = await syncInteractiveReceipt(env, existing.id, "paid"); } catch {}
      try { parkingSession = await syncParkingSession(env, existing.id, "paid"); } catch (error) { console.error("Smart Parking session failed", error); }
    }

    const origin = new URL(request.url).origin;
    return json({
      ok: true,
      payment: {
        id: existing.id,
        status,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: email,
        mode: credentials.mode
      },
      document: document ? {
        id: document.id,
        document_number: document.document_number,
        public_url: document.public_url,
        status: document.status
      } : null,
      parking_ticket: parkingSession ? publicParkingTicket(parkingSession, origin) : null
    });
  } catch (error) {
    return jsonError(error.code || "stripe_session_failed", clean(error.message, 500) || "No se pudo verificar el pago.", error.status || 502);
  }
}
