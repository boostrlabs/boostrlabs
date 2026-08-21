import { clean, jsonError, jsonOk, now, requireNneSession } from "../../../_lib/nne-api.js";
import { ensureNneMarketplace } from "../../../_lib/nne-marketplace.js";
import { getStripeCredentials, stripeForm, stripeRequest } from "../../../_lib/stripe.js";

export async function onRequestPost({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneMarketplace(env);
  const body = await request.json().catch(() => ({}));
  const itemType = ["beat","service"].includes(String(body.item_type)) ? String(body.item_type) : "";
  const itemId = clean(body.item_id, 120);
  const purchaseKind = clean(body.purchase_kind, 40) || "standard";
  if (!itemType || !itemId) return jsonError("nne_market_item_invalid", "Producto inválido.", 400);

  let item;
  let amountCents = 0;
  let sellerUserId = "";
  if (itemType === "beat") {
    item = await env.DB.prepare(`SELECT id,owner_user_id,title,lease_price_cents,exclusive_price_cents,status FROM nne_beats WHERE id=? AND status='published' LIMIT 1`).bind(itemId).first();
    if (!item?.id) return jsonError("nne_beat_not_available", "Este beat no está disponible.", 404);
    amountCents = purchaseKind === "exclusive" ? Number(item.exclusive_price_cents || 0) : Number(item.lease_price_cents || 0);
    sellerUserId = item.owner_user_id;
  } else {
    item = await env.DB.prepare(`SELECT id,seller_user_id,title,price_cents,status FROM nne_service_listings WHERE id=? AND status='published' LIMIT 1`).bind(itemId).first();
    if (!item?.id) return jsonError("nne_service_not_available", "Este servicio no está disponible.", 404);
    amountCents = Number(item.price_cents || 0);
    sellerUserId = item.seller_user_id;
  }
  if (sellerUserId === auth.user.id) return jsonError("nne_self_purchase", "No puedes comprar tu propia publicación.", 400);
  if (amountCents <= 0) return jsonError("nne_price_invalid", "Este producto no tiene un precio válido.", 400);

  const feeBps = Math.max(0, Math.min(5000, Number(env.NNE_MARKETPLACE_FEE_BPS || 0)));
  const feeCents = Math.round(amountCents * feeBps / 10000);
  const sellerNetCents = amountCents - feeCents;
  const orderId = crypto.randomUUID();
  const timestamp = now();
  await env.DB.prepare(`INSERT INTO nne_marketplace_orders (id,buyer_user_id,seller_user_id,item_type,item_id,amount_cents,platform_fee_cents,seller_net_cents,currency,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?, 'usd','pending_payment',?,?)`).bind(orderId,auth.user.id,sellerUserId,itemType,itemId,amountCents,feeCents,sellerNetCents,timestamp,timestamp).run();

  try {
    const { secretKey } = await getStripeCredentials(env);
    const origin = new URL(request.url).origin;
    const form = stripeForm({
      mode: "payment",
      success_url: `${origin}/economy?checkout=success&order=${encodeURIComponent(orderId)}`,
      cancel_url: `${origin}/economy?checkout=cancelled`,
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": amountCents,
      "line_items[0][price_data][product_data][name]": item.title,
      "line_items[0][quantity]": 1,
      "metadata[nne_market_order_id]": orderId,
      "metadata[nne_market_item_type]": itemType,
      "metadata[nne_market_item_id]": itemId,
      "metadata[nne_market_purchase_kind]": purchaseKind,
      client_reference_id: auth.user.id
    });
    const session = await stripeRequest(secretKey, "/checkout/sessions", { method: "POST", body: form, idempotencyKey: `nne-market-${orderId}` });
    await env.DB.prepare(`UPDATE nne_marketplace_orders SET stripe_checkout_session_id=?,updated_at=? WHERE id=?`).bind(clean(session.id,240),timestamp,orderId).run();
    return jsonOk({ order_id: orderId, checkout_url: session.url });
  } catch (error) {
    await env.DB.prepare(`UPDATE nne_marketplace_orders SET status='cancelled',updated_at=? WHERE id=?`).bind(now(),orderId).run();
    return jsonError("nne_checkout_failed", error instanceof Error ? error.message : "No pudimos iniciar el pago.", 503);
  }
}
