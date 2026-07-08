import { clean, jsonError } from "./api.js";
import { normalizeCurrency, normalizeMetadata, normalizePriceAmount } from "./products.js";

export const paymentLinkStatuses = new Set(["draft", "active", "paused", "archived"]);
export const checkoutModes = new Set(["reservation", "deposit_later", "manual_checkout", "stripe_later"]);

export const paymentLinkColumns = `
  id, workspace_id, product_id, title, status, amount_cents, currency,
  checkout_mode, requires_account, allow_guest_checkout, license_metadata_json,
  disclosure_json, metadata_json, created_at, updated_at
`;

export function safePaymentLinkStatus(value, fallback = "draft") {
  const status = clean(value || fallback, 40).toLowerCase();
  return paymentLinkStatuses.has(status) ? status : fallback;
}

export function safeCheckoutMode(value, fallback = "reservation") {
  const mode = clean(value || fallback, 60).toLowerCase();
  return checkoutModes.has(mode) ? mode : fallback;
}

export function normalizePaymentLinkPayload(payload = {}, product = null, current = {}) {
  const title = clean(payload.title ?? current.title ?? product?.title, 180);
  const status = safePaymentLinkStatus(payload.status ?? current.status, current.status || "draft");
  const amount = normalizePriceAmount(payload.amount_cents ?? current.amount_cents ?? product?.price_amount);
  const currency = normalizeCurrency(payload.currency ?? current.currency ?? product?.currency);
  const checkoutMode = safeCheckoutMode(payload.checkout_mode ?? current.checkout_mode, current.checkout_mode || "reservation");
  const productRequiresAccount = Number(product?.requires_account || 0) === 1;
  const requestedRequiresAccount = payload.requires_account ?? current.requires_account ?? product?.requires_account ?? 0;
  const requiresAccount = productRequiresAccount ? 1 : Number(Boolean(requestedRequiresAccount));
  const requestedGuest = payload.allow_guest_checkout ?? current.allow_guest_checkout ?? product?.allow_guest_checkout ?? 1;
  const allowGuestCheckout = requiresAccount ? 0 : Number(Boolean(requestedGuest));
  const disclosure = payload.disclosure ?? payload.disclosure_json ?? current.disclosure_json ?? {
    no_real_payment: true,
    payment_status: "not_charged",
    note: "This BOOSTR Smart Link creates a reservation/intention record. No card is charged."
  };

  return {
    product_id: clean(payload.product_id ?? current.product_id ?? product?.id, 120) || null,
    title,
    status,
    amount_cents: amount,
    currency,
    checkout_mode: checkoutMode,
    requires_account: requiresAccount,
    allow_guest_checkout: allowGuestCheckout,
    license_metadata_json: normalizeMetadata(payload.license_metadata ?? payload.license_metadata_json ?? current.license_metadata_json),
    disclosure_json: normalizeMetadata(disclosure),
    metadata_json: normalizeMetadata(payload.metadata ?? payload.metadata_json ?? current.metadata_json)
  };
}

export function validatePaymentLinkForWrite(link) {
  if (!link.title) return { ok: false, response: jsonError("payment_link_title_required", "Payment link title is required.", 400, { fields: ["title"] }) };
  if (!paymentLinkStatuses.has(link.status)) return { ok: false, response: jsonError("invalid_payment_link_status", "Payment link status is not supported.", 400, { fields: ["status"] }) };
  if (!checkoutModes.has(link.checkout_mode)) return { ok: false, response: jsonError("invalid_checkout_mode", "Checkout mode is not supported.", 400, { fields: ["checkout_mode"] }) };
  if (link.amount_cents !== null && link.amount_cents < 0) return { ok: false, response: jsonError("invalid_amount_cents", "Amount must be zero or higher.", 400, { fields: ["amount_cents"] }) };
  return { ok: true };
}

export function paymentLinkHealth(link) {
  const gaps = [];
  if (!clean(link.title)) gaps.push("missing_title");
  if (link.amount_cents === null || link.amount_cents === undefined) gaps.push("missing_amount");
  if (!clean(link.checkout_mode)) gaps.push("missing_checkout_mode");
  if (link.status === "draft") gaps.push("not_active");
  if (Number(link.requires_account || 0) === 1 && Number(link.allow_guest_checkout || 0) === 1) gaps.push("account_rule_conflict");
  const score = Math.max(0, 100 - gaps.length * 16);
  return { score, gaps };
}
