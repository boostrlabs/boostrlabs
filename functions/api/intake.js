import { addLeadEvent, clean, isValidEmail, isValidPhone, json, jsonError, normalizeArray, normalizePhone, readJson } from "../_lib/api.js";
import { notifyLeadOnTelegram } from "../_lib/telegram-leads.js";

const requiredFields = ["contact_name", "business_name", "industry", "project_goal", "current_status"];
const ORLANDO_SOURCE = "boostr-event-os-orlando-jul-25";

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

async function ensureEventWorkspace(env, source, createdAt) {
  if (!env.DB || source !== ORLANDO_SOURCE) return null;
  const slug = "event-orlando-jul-25";
  const existing = await env.DB.prepare("SELECT id FROM workspaces WHERE slug = ? LIMIT 1").bind(slug).first();
  if (existing?.id) return existing.id;

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO workspaces (id, type, name, slug, owner_email, status, created_at, updated_at)
     VALUES (?, 'event', 'Fuerte Promotions · Orlando Jul 25', ?, NULL, 'active', ?, ?)`
  ).bind(id, slug, createdAt, createdAt).run();
  return id;
}

const parseObject = (value) => {
  if (value && typeof value === "object") return value;
  try { return JSON.parse(value || "{}"); } catch { return {}; }
};

const leadFromPayload = (payload, request) => {
  const id = crypto.randomUUID();
  const source = clean(payload.source || payload.formKind || payload.form_kind || "website", 80);
  const legacyMessage = parseObject(payload.message);
  const referralCode = clean(
    payload.referralCode || payload.referral_code || legacyMessage.referral_code ||
      (source === ORLANDO_SOURCE ? `ROW-${id.slice(0, 6).toUpperCase()}` : ""),
    80
  );

  return {
    id,
    source,
    contact_name: clean(payload.contact_name || payload.name, 140),
    contact_email: clean(payload.contact_email || payload.email, 180).toLowerCase(),
    contact_phone: normalizePhone(payload.contact_phone || payload.phone),
    preferred_contact_method: clean(payload.preferred_contact_method || "email", 40),
    business_name: clean(payload.business_name || payload.business || payload.businessProject || "Website lead", 180),
    industry: clean(payload.industry || "not_collected", 120),
    current_website_url: clean(payload.current_website_url, 300),
    social_links: clean(payload.social_links, 1000),
    project_goal: clean(payload.project_goal || payload.mainGoal || payload.serviceInterested || payload.message, 2000),
    requested_modules: normalizeArray(payload.requested_modules, 80),
    timeline: clean(payload.timeline, 80),
    budget_range: clean(payload.budget_range || payload.budgetRange, 80),
    current_status: clean(payload.current_status || payload.websiteStatus || payload.currentProblem || "Lead submitted", 2000),
    biggest_problem: clean(payload.biggest_problem, 2000),
    manual_or_confusing: clean(payload.manual_or_confusing, 2000),
    system_outcome: clean(payload.system_outcome, 2000),
    extra_message: clean(payload.extra_message || legacyMessage.extra_message || payload.message, 3000),
    referral_code: referralCode,
    page_url: clean(payload.pageUrl || payload.page_url || request.headers.get("Referer"), 800),
    created_at: new Date().toISOString()
  };
};

const emailHtml = (lead) => `
  <h1>New BOOSTR Intake</h1>
  <h2>Contact</h2>
  <p><strong>Name:</strong> ${escapeHtml(lead.contact_name)}</p>
  <p><strong>Email:</strong> ${escapeHtml(lead.contact_email)}</p>
  <p><strong>Phone:</strong> ${escapeHtml(lead.contact_phone)}</p>
  <p><strong>Preferred contact:</strong> ${escapeHtml(lead.preferred_contact_method)}</p>
  <h2>Business</h2>
  <p><strong>Business:</strong> ${escapeHtml(lead.business_name)}</p>
  <p><strong>Industry:</strong> ${escapeHtml(lead.industry)}</p>
  <h2>Project</h2>
  <p><strong>Goal:</strong> ${escapeHtml(lead.project_goal)}</p>
  <p><strong>Requested modules:</strong> ${escapeHtml(lead.requested_modules.join(", "))}</p>
  <h2>Timeline / Budget</h2>
  <p><strong>Timeline:</strong> ${escapeHtml(lead.timeline)}</p>
  <p><strong>Budget:</strong> ${escapeHtml(lead.budget_range)}</p>
  <h2>Message</h2>
  <p>${escapeHtml(lead.extra_message)}</p>
`;

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const payload = parsed.payload || {};
  const lead = leadFromPayload(payload, request);
  const missingFields = requiredFields.filter((field) => !clean(lead[field]));
  if (missingFields.length) {
    return jsonError("required_fields_missing", "Missing required fields.", 400, { fields: missingFields });
  }

  const suppliedEmail = lead.contact_email;
  const suppliedPhone = lead.contact_phone;
  if (!suppliedEmail && !suppliedPhone) {
    return jsonError("contact_required", "Provide at least one contact channel: email or phone.", 400, { fields: ["contact_email", "contact_phone"] });
  }
  if (suppliedEmail && !isValidEmail(suppliedEmail)) {
    return jsonError("invalid_contact_email", "Invalid email format.", 400, { fields: ["contact_email"] });
  }
  if (suppliedPhone && !isValidPhone(suppliedPhone)) {
    return jsonError("invalid_contact_phone", "Invalid phone format.", 400, { fields: ["contact_phone"] });
  }

  if (env.DB) {
    const workspaceId = await ensureEventWorkspace(env, lead.source, lead.created_at);
    await env.DB.prepare(
      `INSERT INTO leads (
        id, workspace_id, source, contact_name, contact_email, contact_phone, preferred_contact_method,
        business_name, industry, project_goal, budget_range, timeline, current_status,
        message, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`
    )
      .bind(
        lead.id,
        workspaceId,
        lead.source,
        lead.contact_name,
        lead.contact_email,
        lead.contact_phone,
        lead.preferred_contact_method,
        lead.business_name,
        lead.industry,
        lead.project_goal,
        lead.budget_range,
        lead.timeline,
        lead.current_status,
        JSON.stringify({
          requested_modules: lead.requested_modules,
          biggest_problem: lead.biggest_problem,
          manual_or_confusing: lead.manual_or_confusing,
          system_outcome: lead.system_outcome,
          extra_message: lead.extra_message,
          referral_code: lead.referral_code,
          page_url: lead.page_url
        }),
        lead.created_at,
        lead.created_at
      )
      .run();

    await addLeadEvent(env, {
      workspace_id: workspaceId,
      lead_id: lead.id,
      event_type: "intake.submitted",
      payload: {
        source: lead.source,
        business_name: lead.business_name,
        requested_modules: lead.requested_modules,
        referral_code: lead.referral_code
      },
      created_at: lead.created_at
    });
  }

  console.info("BOOSTR intake received", {
    id: lead.id,
    business: lead.business_name,
    modules: lead.requested_modules,
    emailPreview: emailHtml(lead)
  });

  const notification = await notifyLeadOnTelegram(env, lead);

  return json({
    ok: true,
    id: lead.id,
    stored: Boolean(env.DB),
    notificationConfigured: notification.configured,
    notificationSent: notification.sent
  });
}
