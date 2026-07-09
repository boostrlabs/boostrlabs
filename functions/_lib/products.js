import { clean, jsonError } from "./api.js";

export const productTypes = new Set([
  "digital",
  "physical",
  "service",
  "booking",
  "license",
  "membership",
  "auction_later"
]);

export const productStatuses = new Set(["draft", "active", "paused", "archived"]);

export const productColumns = `
  id, workspace_id, title, product_type, status, price_amount, currency,
  description, asset_status, fulfillment_type, requires_account,
  allow_guest_checkout, metadata_json, created_at, updated_at
`;

const defaultFulfillmentByType = {
  digital: "digital_access",
  physical: "manual_shipping_or_pickup",
  service: "manual_service_delivery",
  booking: "manual_booking",
  license: "license_delivery",
  membership: "account_access",
  auction_later: "future_auction"
};

export function safeProductType(value) {
  const type = clean(value || "service", 40).toLowerCase();
  return productTypes.has(type) ? type : "service";
}

export function safeProductStatus(value, fallback = "draft") {
  const status = clean(value || fallback, 40).toLowerCase();
  return productStatuses.has(status) ? status : fallback;
}

export function normalizeCurrency(value) {
  const currency = clean(value || "USD", 8).toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
  return currency.length === 3 ? currency : "USD";
}

export function normalizePriceAmount(value) {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return Math.round(numeric);
}

export function normalizeProductPayload(payload = {}, current = {}) {
  const productType = safeProductType(payload.product_type ?? current.product_type);
  const status = safeProductStatus(payload.status ?? current.status, current.status || "draft");
  const requiresAccountForced = ["license", "membership", "auction_later"].includes(productType);
  const requestedRequiresAccount = payload.requires_account ?? current.requires_account ?? 0;
  const requiresAccount = requiresAccountForced ? 1 : Number(Boolean(requestedRequiresAccount));
  const requestedGuest = payload.allow_guest_checkout ?? current.allow_guest_checkout ?? 1;
  const allowGuestCheckout = requiresAccount ? 0 : Number(Boolean(requestedGuest));

  const fulfillment = clean(
    payload.fulfillment_type ?? current.fulfillment_type ?? defaultFulfillmentByType[productType] ?? "manual",
    120
  );

  return {
    title: clean(payload.title ?? current.title, 180),
    product_type: productType,
    status,
    price_amount: normalizePriceAmount(payload.price_amount ?? current.price_amount),
    currency: normalizeCurrency(payload.currency ?? current.currency),
    description: clean(payload.description ?? current.description, 1200),
    asset_status: clean(payload.asset_status ?? current.asset_status ?? "not_started", 80),
    fulfillment_type: fulfillment,
    requires_account: requiresAccount,
    allow_guest_checkout: allowGuestCheckout,
    metadata_json: normalizeMetadata(payload.metadata ?? payload.metadata_json ?? current.metadata_json)
  };
}

export function normalizeMetadata(value) {
  if (!value) return JSON.stringify({});
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed && typeof parsed === "object" ? parsed : {});
    } catch {
      return JSON.stringify({ note: clean(value, 800) });
    }
  }
  if (typeof value === "object") return JSON.stringify(value);
  return JSON.stringify({});
}

export function validateProductForWrite(product) {
  if (!product.title) return { ok: false, response: jsonError("product_title_required", "Product title is required.", 400, { fields: ["title"] }) };
  if (!productTypes.has(product.product_type)) return { ok: false, response: jsonError("invalid_product_type", "Product type is not supported.", 400, { fields: ["product_type"] }) };
  if (!productStatuses.has(product.status)) return { ok: false, response: jsonError("invalid_product_status", "Product status is not supported.", 400, { fields: ["status"] }) };
  if (product.price_amount !== null && product.price_amount < 0) return { ok: false, response: jsonError("invalid_price_amount", "Price amount must be zero or higher.", 400, { fields: ["price_amount"] }) };
  return { ok: true };
}

export function productHealth(product) {
  const gaps = [];
  if (!clean(product.title)) gaps.push("missing_title");
  if (product.price_amount === null || product.price_amount === undefined) gaps.push("missing_price");
  if (!clean(product.description)) gaps.push("missing_description");
  if (!clean(product.fulfillment_type)) gaps.push("missing_fulfillment");
  if (product.product_type === "digital" && product.requires_account !== 1) gaps.push("digital_access_review");
  if (["license", "membership", "auction_later"].includes(product.product_type) && product.allow_guest_checkout === 1) gaps.push("account_rule_conflict");
  const score = Math.max(0, 100 - gaps.length * 14 - (product.status === "draft" ? 8 : 0));
  return { score, gaps };
}
