import { clean, now } from "./nne-api.js";
import { ensureNneMarketplace } from "./nne-marketplace.js";

export async function settleNneMarketplaceCheckout(env, session) {
  if (session?.payment_status !== "paid") return null;
  const orderId = clean(session?.metadata?.nne_market_order_id, 120);
  if (!orderId) return null;
  await ensureNneMarketplace(env);
  const order = await env.DB.prepare(`SELECT * FROM nne_marketplace_orders WHERE id=? LIMIT 1`).bind(orderId).first();
  if (!order?.id) return null;
  if (["paid","completed"].includes(order.status)) return { id: order.id, status: order.status, duplicate: true };

  let item = null;
  if (order.item_type === "beat") item = await env.DB.prepare(`SELECT title FROM nne_beats WHERE id=? LIMIT 1`).bind(order.item_id).first();
  if (order.item_type === "service") item = await env.DB.prepare(`SELECT title FROM nne_service_listings WHERE id=? LIMIT 1`).bind(order.item_id).first();
  if (!item?.title) return null;
  const [seller,buyer] = await Promise.all([
    env.DB.prepare(`SELECT username FROM nne_users WHERE id=? LIMIT 1`).bind(order.seller_user_id).first(),
    env.DB.prepare(`SELECT username FROM nne_users WHERE id=? LIMIT 1`).bind(order.buyer_user_id).first()
  ]);
  const timestamp = now();
  const purchaseKind = clean(session?.metadata?.nne_market_purchase_kind, 40) || (order.item_type === "beat" ? "lease" : "service");
  const rendered = [
    `NNE Marketplace Transaction ${order.id}`,
    `Seller: @${seller?.username || "seller"}`,
    `Buyer: @${buyer?.username || "buyer"}`,
    `Item: ${item.title}`,
    `Transaction: ${purchaseKind}`,
    `Amount: $${(Number(order.amount_cents || 0)/100).toFixed(2)} USD`,
    "",
    "This record documents the marketplace transaction and the listing terms accepted at checkout.",
    "Specific usage, publishing, exclusivity, delivery and revision terms remain governed by the seller listing and attached terms.",
    "This automated record should be reviewed by the parties when legal terms matter."
  ].join("\n");

  await env.DB.batch([
    env.DB.prepare(`UPDATE nne_marketplace_orders SET status='paid',stripe_checkout_session_id=COALESCE(?,stripe_checkout_session_id),stripe_payment_intent_id=COALESCE(?,stripe_payment_intent_id),paid_at=COALESCE(paid_at,?),updated_at=? WHERE id=?`).bind(clean(session.id,240)||null,clean(typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,240)||null,timestamp,timestamp,order.id),
    env.DB.prepare(`INSERT OR IGNORE INTO nne_seller_ledger (id,user_id,amount_cents,kind,source_type,source_id,description,created_at) VALUES (?,?,?,'sale','marketplace_order',?,?,?)`).bind(crypto.randomUUID(),order.seller_user_id,Number(order.seller_net_cents),order.id,`Venta: ${item.title}`,timestamp),
    env.DB.prepare(`INSERT OR IGNORE INTO nne_contract_documents (id,order_id,document_type,version,terms_json,rendered_text,created_at) VALUES (?,?,'marketplace_transaction','v1',?,?,?)`).bind(crypto.randomUUID(),order.id,JSON.stringify({item_type:order.item_type,purchase_kind:purchaseKind,amount_cents:Number(order.amount_cents)}),rendered,timestamp)
  ]);
  return { id: order.id, status: "paid", seller_net_cents: Number(order.seller_net_cents) };
}
