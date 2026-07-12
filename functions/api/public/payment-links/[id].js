import { clean, json, jsonError, requireDb } from "../../../_lib/api.js";
import { paymentLinkHealth } from "../../../_lib/payment-links.js";

function parseJson(value) {
  try { return value ? JSON.parse(value) : {}; } catch { return {}; }
}

function publicProductImageUrl(value, assetId = "") {
  const explicitId = clean(assetId, 120);
  if (/^[a-f0-9-]{20,120}$/i.test(explicitId)) return `/api/public/assets/${explicitId}`;

  const raw = clean(value, 2000);
  if (!raw) return null;
  if (/^[a-f0-9-]{20,120}$/i.test(raw)) return `/api/public/assets/${raw}`;

  try {
    const url = new URL(raw, "https://boostr.local");
    const parts = url.pathname.split("/").filter(Boolean);
    const last = parts.at(-1) || "";
    if (parts.length === 1 && /^[a-f0-9-]{20,120}$/i.test(last)) {
      return `/api/public/assets/${last}`;
    }
    if (url.pathname.startsWith("/api/public/assets/")) return `${url.pathname}${url.search}`;
  } catch {}

  return raw;
}

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
            products.asset_status, products.fulfillment_type, products.metadata_json AS product_metadata_json,
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
  const metadata = { ...parseJson(link.product_metadata_json), ...parseJson(link.metadata_json) };
  const disclosure = parseJson(link.disclosure_json);
  const imageUrl = publicProductImageUrl(
    metadata.image_url || metadata.hero_image_url || metadata.cover_url || metadata.image || "",
    metadata.image_asset_id || metadata.product_image_asset_id || metadata.asset_id || ""
  );
  return json({
    ok: true,
    payment_link: {
      ...link,
      metadata: { ...metadata, image_url: imageUrl },
      disclosure,
      image_url: imageUrl,
      sale_type: metadata.sale_type || link.checkout_mode || "purchase_now",
      subscription_interval: metadata.subscription_interval || null,
      auction_end: metadata.auction_end || null,
      min_increment_cents: metadata.min_increment_cents || null,
      health: paymentLinkHealth(link),
      no_real_payment: Boolean(disclosure.no_real_payment)
    }
  });
}
