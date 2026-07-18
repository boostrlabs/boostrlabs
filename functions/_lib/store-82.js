import { clean, now } from "./api.js";
import { ensureOmniCoreSchema } from "./omni-parking.js";

export const STORE_82_PRODUCTS = Object.freeze({
  "trapsiah-oversized-tee": { title: "Trapsiah Oversized Tee", amount: 7000, image: "/assets/82store/82apparel1.webp", description: "Oversized black tee with washed 82 graphics, red punk marks and distressed finish." },
  "star-girl-distressed-denim": { title: "Star Girl Distressed Denim", amount: 12000, image: "/assets/82store/82apparel2.webp", description: "Destroyed wide-leg denim with chain details, star marks and oxidized black wash." },
  "chunky-platform-boots": { title: "Chunky Platform Boots", amount: 15000, image: "/assets/82store/82apparel3.webp", description: "Heavy black platform boots with spikes, chains and star hardware." },
  "star-girl-baggy-jeans": { title: "Star Girl Baggy Jeans", amount: 11000, image: "/assets/82store/82apparel4.webp", description: "Black baggy denim with red stitching, star girl artwork and chain styling." },
  "star-girl-zip-hoodie": { title: "Star Girl Zip Hoodie", amount: 9500, image: "/assets/82store/82apparel5.webp", description: "Black zip hoodie with 82 star emblem, red sleeve work and back artwork." },
  "spiked-chain-bracelet": { title: "Spiked Chain Bracelet", amount: 4000, image: "/assets/82store/82apparel6.webp", description: "Silver-tone spike chain bracelet with star detail and sharp 82 energy." },
  "spiked-star-choker": { title: "Spiked Star Choker", amount: 5000, image: "/assets/82store/82apparel7.webp", description: "Black choker with hanging stars, spikes and metallic punk hardware." }
});

const STORE = Object.freeze({ slug: "82-store", name: "82 Store / 82NGEL", type: "partner" });

export function get82StoreProduct(value) {
  return STORE_82_PRODUCTS[clean(value, 100).toLowerCase()] || null;
}

async function resolveWorkspace(env) {
  let row = await env.DB.prepare("SELECT id FROM workspaces WHERE slug = ? ORDER BY updated_at DESC LIMIT 1").bind(STORE.slug).first();
  const timestamp = now();
  if (row?.id) {
    await env.DB.prepare("UPDATE workspaces SET name = ?, type = ?, status = 'active', updated_at = ? WHERE id = ?")
      .bind(STORE.name, STORE.type, timestamp, row.id).run();
    return row.id;
  }
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO workspaces (id, type, name, slug, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?)")
    .bind(id, STORE.type, STORE.name, STORE.slug, timestamp, timestamp).run();
  return id;
}

export async function ensure82StoreProduct(env, slug) {
  const item = get82StoreProduct(slug);
  if (!item) throw new Error("82_store_product_not_found");
  await ensureOmniCoreSchema(env);
  const workspaceId = await resolveWorkspace(env);
  const code = `82_store_${slug}`;
  let link = null;
  try {
    link = await env.DB.prepare("SELECT id, product_id FROM payment_links WHERE workspace_id = ? AND json_extract(metadata_json, '$.store_product_code') = ? ORDER BY updated_at DESC LIMIT 1")
      .bind(workspaceId, code).first();
  } catch {}
  const timestamp = now();
  const metadata = JSON.stringify({ source: "82_store", module: "82 Store", brand_name: "82 STORE", brand_logo_url: "/assets/82store/piloto-final-logo-82ngel.webp", checkout_theme: "82_store", image_url: item.image, store_product_code: code, stable_url: `/82store/buy/${slug}` });
  const productId = link?.product_id || crypto.randomUUID();
  const existingProduct = await env.DB.prepare("SELECT id FROM products WHERE id = ? LIMIT 1").bind(productId).first();
  if (existingProduct?.id) {
    await env.DB.prepare("UPDATE products SET workspace_id=?, title=?, product_type='physical', status='active', price_amount=?, currency='USD', description=?, asset_status='ready', fulfillment_type='physical_shipping', requires_account=0, allow_guest_checkout=1, metadata_json=?, updated_at=? WHERE id=?")
      .bind(workspaceId, item.title, item.amount, item.description, metadata, timestamp, productId).run();
  } else {
    await env.DB.prepare("INSERT INTO products (id, workspace_id, title, product_type, status, price_amount, currency, description, asset_status, fulfillment_type, requires_account, allow_guest_checkout, metadata_json, created_at, updated_at) VALUES (?, ?, ?, 'physical', 'active', ?, 'USD', ?, 'ready', 'physical_shipping', 0, 1, ?, ?, ?)")
      .bind(productId, workspaceId, item.title, item.amount, item.description, metadata, timestamp, timestamp).run();
  }
  const disclosure = JSON.stringify({ no_real_payment: false, payment_status: "checkout_available", note: "Stripe procesa el pago; BOOSTR no guarda datos de tarjeta." });
  const linkId = link?.id || crypto.randomUUID();
  if (link?.id) {
    await env.DB.prepare("UPDATE payment_links SET product_id=?, title=?, status='active', amount_cents=?, currency='USD', checkout_mode='purchase_now', requires_account=0, allow_guest_checkout=1, disclosure_json=?, metadata_json=?, updated_at=? WHERE id=?")
      .bind(productId, item.title, item.amount, disclosure, metadata, timestamp, linkId).run();
  } else {
    await env.DB.prepare("INSERT INTO payment_links (id, workspace_id, product_id, title, status, amount_cents, currency, checkout_mode, requires_account, allow_guest_checkout, license_metadata_json, disclosure_json, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, 'USD', 'purchase_now', 0, 1, '{}', ?, ?, ?, ?)")
      .bind(linkId, workspaceId, productId, item.title, item.amount, disclosure, metadata, timestamp, timestamp).run();
  }
  return { item, linkId };
}
