import { clean, isValidEmail, isValidPhone, json, jsonError, normalizePhone, readJson } from "../../_lib/api.js";
import { notifyToyotaLeadOnTelegram } from "../../_lib/telegram-toyota-leads.js";
import { createToyotaPass } from "../../_lib/toyota-qr.js";

const CAMPAIGN = "TOYOTA OF HOLLYWOOD X LA CHIQUI";
const DEALER = "Toyota of Hollywood";
const SELLER = "Adriana Quintero (La Chiqui)";

const campaignIsActive = () => Date.now() <= Date.parse("2026-07-31T23:59:59-04:00");

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  if (!campaignIsActive()) return jsonError("campaign_ended", "This promotion has ended.", 410);

  const payload = parsed.payload || {};
  if (clean(payload.company, 200)) return json({ ok: true });

  const lead = {
    first_name: clean(payload.first_name || payload.first, 80),
    last_name: clean(payload.last_name || payload.last, 80),
    phone: normalizePhone(payload.phone),
    email: clean(payload.email, 180).toLowerCase(),
    score: clean(payload.score, 80),
    consent: payload.consent === true,
    campaign: CAMPAIGN,
    dealer: DEALER,
    seller: SELLER,
    created_at: new Date().toISOString(),
    source: clean(payload.source, 120),
    utm_source: clean(payload.utm_source, 180),
    utm_medium: clean(payload.utm_medium, 180),
    utm_campaign: clean(payload.utm_campaign, 180),
    utm_content: clean(payload.utm_content, 180),
    utm_term: clean(payload.utm_term, 180),
    page_url: clean(payload.page_url || request.headers.get("Referer"), 800)
  };

  const missing = ["first_name", "last_name", "score"].filter((field) => !lead[field]);
  if (missing.length) return jsonError("required_fields_missing", "Complete all required fields.", 400, { fields: missing });
  if (!lead.phone && !lead.email) return jsonError("contact_required", "Enter a phone number or email address.", 400, { fields: ["phone", "email"] });
  if (lead.phone && !isValidPhone(lead.phone)) return jsonError("invalid_phone", "Enter a valid phone number.", 400);
  if (lead.email && !isValidEmail(lead.email)) return jsonError("invalid_email", "Enter a valid email address.", 400);
  if (!lead.consent) return jsonError("consent_required", "Consent is required.", 400);

  let pass;
  try {
    pass = await createToyotaPass(env, lead);
  } catch (error) {
    console.error(JSON.stringify({ message: "toyota_pass_generation_failed", error: String(error) }));
    return jsonError("pass_unavailable", "The promotional pass is temporarily unavailable.", 503);
  }

  const notification = await notifyToyotaLeadOnTelegram(env, lead, pass);
  if (!notification.sent) {
    return jsonError("notification_failed", "We could not complete your request. Please try again.", 502);
  }

  const origin = new URL(request.url).origin;
  return json({
    ok: true,
    code: pass.code,
    issuedAt: pass.issuedAt,
    expiresAt: pass.expiresAt,
    token: pass.token,
    validationUrl: `${origin}/verify/?token=${encodeURIComponent(pass.token)}`,
    qrImageUrl: `${origin}/api/toyota/qr?token=${encodeURIComponent(pass.token)}`
  }, 201);
}
