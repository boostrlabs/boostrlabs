import { clean } from "./api.js";
import { parseDocumentJson, syncPaymentReceipt, updateSmartDocument } from "./documents.js";

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

async function resolvePaymentImage(env, paymentId) {
  const row = await env.DB.prepare(`
    SELECT payment_links.metadata_json AS payment_link_metadata_json,
           products.metadata_json AS product_metadata_json
    FROM stripe_payments
    LEFT JOIN payment_links ON payment_links.id = stripe_payments.payment_link_id
    LEFT JOIN products ON products.id = payment_links.product_id
    WHERE stripe_payments.id = ?
    LIMIT 1
  `).bind(clean(paymentId, 160)).first();

  const metadata = {
    ...parseDocumentJson(row?.product_metadata_json, {}),
    ...parseDocumentJson(row?.payment_link_metadata_json, {})
  };

  return publicProductImageUrl(
    metadata.image_url || metadata.hero_image_url || metadata.cover_url || metadata.image || "",
    metadata.image_asset_id || metadata.product_image_asset_id || metadata.asset_id || ""
  );
}

export async function syncInteractiveReceipt(env, paymentId, status = "paid") {
  let document = await syncPaymentReceipt(env, paymentId, status);
  if (!document?.id || !document.public_url) return document;

  let corrected = Array.isArray(document.blocks) ? [...document.blocks] : [];
  let changed = false;

  const imageUrl = await resolvePaymentImage(env, paymentId).catch(() => null);
  if (imageUrl) {
    const imageIndex = corrected.findIndex((block) => block?.type === "image" && (!block.role || block.role === "product_image"));
    const productImageBlock = {
      type: "image",
      role: "product_image",
      heading: "Producto",
      url: imageUrl
    };

    if (imageIndex === -1) {
      const summaryIndex = corrected.findIndex((block) => block?.type === "summary");
      corrected.splice(summaryIndex >= 0 ? summaryIndex + 1 : 0, 0, productImageBlock);
      changed = true;
    } else if (corrected[imageIndex]?.url !== imageUrl || corrected[imageIndex]?.role !== "product_image") {
      corrected[imageIndex] = { ...corrected[imageIndex], ...productImageBlock };
      changed = true;
    }
  }

  corrected = corrected.map((block) => {
    if (block?.type !== "qr" || block.value === document.public_url) return block;
    changed = true;
    return { ...block, value: document.public_url };
  });

  if (changed) {
    document = await updateSmartDocument(env, document.id, { blocks: corrected });
  }

  return document;
}
