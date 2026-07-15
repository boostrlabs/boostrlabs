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
    if (/^[a-f0-9-]{20,120}$/i.test(last) && !url.pathname.startsWith("/api/cloud")) {
      return `/api/public/assets/${last}`;
    }
    if (url.pathname.startsWith("/api/public/assets/")) return `${url.pathname}${url.search}`;
  } catch {}
  return raw;
}

function publicProductModelUrl(value, assetId = "") {
  const explicitId = clean(assetId, 120);
  if (/^[a-f0-9-]{20,120}$/i.test(explicitId)) return `/api/public/models/${explicitId}`;
  const raw = clean(value, 2000);
  if (!raw) return null;
  if (/^[a-f0-9-]{20,120}$/i.test(raw)) return `/api/public/models/${raw}`;
  try {
    const url = new URL(raw, "https://boostr.local");
    if (url.pathname.startsWith("/api/public/models/")) return `${url.pathname}${url.search}`;
  } catch {}
  return raw;
}

async function recoverProductImage(env, link, metadata) {
  const direct = publicProductImageUrl(
    metadata.image_url || metadata.hero_image_url || metadata.cover_url || metadata.image || "",
    metadata.image_asset_id || metadata.product_image_asset_id || metadata.asset_id || ""
  );
  if (direct) return direct;

  const title = clean(link?.product_title || link?.title, 220);
  const candidates = await env.DB.prepare(`
    SELECT id, title, metadata_json, created_at
    FROM workspace_files
    WHERE workspace_id = ?
      AND related_type = 'cloud_asset'
      AND status = 'active'
      AND file_type = 'image'
    ORDER BY created_at DESC
    LIMIT 50
  `).bind(link.workspace_id).all();

  const rows = candidates.results || [];
  const normalizedTitle = title.toLowerCase();
  const match = rows.find((row) => {
    const meta = parseJson(row.metadata_json);
    const category = clean(meta.category, 80);
    const source = clean(meta.source, 80);
    if (category !== "product-media" && source !== "quick_publish_v4") return false;
    const rowTitle = clean(row.title, 220).toLowerCase();
    return normalizedTitle && rowTitle === normalizedTitle;
  }) || rows.find((row) => {
    const meta = parseJson(row.metadata_json);
    return clean(meta.category, 80) === "product-media" || clean(meta.source, 80) === "quick_publish_v4";
  });

  return match?.id ? `/api/public/assets/${match.id}` : null;
}

function isOmniParking(link, metadata) {
  const operator = clean(metadata?.operator, 80).toLowerCase();
  const parkingCode = clean(metadata?.parking_code, 120).toLowerCase();
  const workspaceSlug = clean(link?.workspace_slug, 160).toLowerCase();
  const workspaceName = clean(link?.workspace_name, 200).toLowerCase();
  const title = clean(link?.title || link?.product_title, 300).toLowerCase();
  return operator === "omni_jr"
    || parkingCode.startsWith("omni_jr_")
    || workspaceSlug === "omni-jr-parking"
    || workspaceName === "omni jr parking"
    || title.startsWith("omni jr parking");
}

function normalizeOmniMetadata(link, metadata) {
  if (!isOmniParking(link, metadata)) return metadata;
  const title = clean(link?.title || link?.product_title, 300).toLowerCase();
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
  const planType = monthly ? "monthly" : "single";
  const parkingCode = clean(metadata?.parking_code, 120)
    || (monthly ? "omni_jr_monthly" : vehicleClass === "truck_big_suv" ? "omni_jr_large_8h" : "omni_jr_standard_8h");
  const stableKey = monthly ? "monthly" : vehicleClass === "truck_big_suv" ? "large" : "standard";
  return {
    ...metadata,
    source: metadata?.source || "boostr_smart_parking_v3",
    module: metadata?.module || "BOOSTR Smart Parking",
    operator: "omni_jr",
    operator_name: "OMNI JR Parking",
    brand_name: "OMNI JR PARKING",
    brand_logo_url: metadata?.brand_logo_url || "/assets/omni-jr/omni-jr-logo-black.svg",
    checkout_theme: "light",
    parking_code: parkingCode,
    plan_type: planType,
    vehicle_class: vehicleClass,
    max_hours: monthly ? null : Number(metadata?.max_hours || 8),
    subscription_interval: monthly ? clean(metadata?.subscription_interval, 40) || "month" : null,
    stable_url: metadata?.stable_url || `/parking/omni-jr/${stableKey}`
  };
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
     WHERE payment_links.id = ? AND payment_links.status = 'active'
     LIMIT 1`
  ).bind(id).first();
  if (!link?.id) return jsonError("payment_link_not_found", "Smart Link not found or inactive.", 404);

  const rawMetadata = { ...parseJson(link.product_metadata_json), ...parseJson(link.metadata_json) };
  const metadata = normalizeOmniMetadata(link, rawMetadata);
  const disclosure = parseJson(link.disclosure_json);
  const imageUrl = await recoverProductImage(env, link, metadata);
  const modelUrl = publicProductModelUrl(
    metadata.model_3d_url || metadata.model_url || "",
    metadata.model_3d_asset_id || metadata.model_asset_id || ""
  );

  return json({
    ok: true,
    payment_link: {
      ...link,
      metadata: { ...metadata, image_url: imageUrl, model_3d_url: modelUrl },
      disclosure,
      image_url: imageUrl,
      model_3d_url: modelUrl,
      model_3d_format: metadata.model_3d_format || null,
      model_3d_poster: metadata.model_3d_poster || imageUrl,
      sale_type: metadata.sale_type || link.checkout_mode || "purchase_now",
      subscription_interval: metadata.subscription_interval || null,
      auction_end: metadata.auction_end || null,
      min_increment_cents: metadata.min_increment_cents || null,
      health: paymentLinkHealth(link),
      no_real_payment: Boolean(disclosure.no_real_payment)
    }
  });
}
