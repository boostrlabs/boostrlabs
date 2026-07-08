import { clean, json, jsonError, requireDb } from "../../../_lib/api.js";
import { paymentLinkHealth } from "../../../_lib/payment-links.js";

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestGet({ env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const id = clean(params.id, 160);
  const link = await env.DB.prepare(
    `SELECT payment_links.id, payment_links.workspace_id, payment_links.product_id,
            payment_links.title, payment_links.status, payment_links.amount_cents,
            payment_links.currency, payment_links.checkout_mode,
            payment_links.requires_account, payment_links.allow_guest_checkout,
            payment_links.license_metadata_json, payment_links.disclosure_json,
            payment_links.metadata_json, payment_links.created_at, payment_links.updated_at,
            products.title AS product_title, products.product_type, products.description AS product_description,
            products.asset_status, products.fulfillment_type,
            workspaces.name AS workspace_name, workspaces.slug AS workspace_slug
     FROM payment_links
     LEFT JOIN products ON products.id = payment_links.product_id
     LEFT JOIN workspaces ON workspaces.id = payment_links.workspace_id
     WHERE payment_links.id = ?
       AND payment_links.status = 'active'
     LIMIT 1`
  )
    .bind(id)
    .first();
  if (!link?.id) return jsonError("payment_link_not_found", "Smart Link not found or inactive.", 404);
  return json({ ok: true, payment_link: { ...link, health: paymentLinkHealth(link), no_real_payment: true } });
}
