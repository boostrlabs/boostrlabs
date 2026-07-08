import { addLeadEvent, clean, isValidEmail, isValidPhone, json, jsonError, normalizeArray, normalizePhone, readJson } from "../_lib/api.js";

const requiredFields = ["contact_name", "business_name", "industry", "project_goal", "current_status"];

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const leadFromPayload = (payload) => ({
  id: crypto.randomUUID(),
  source: clean(payload.source || "website", 80),
  contact_name: clean(payload.contact_name, 140),
  contact_email: clean(payload.contact_email, 180).toLowerCase(),
  contact_phone: normalizePhone(payload.contact_phone),
  preferred_contact_method: clean(payload.preferred_contact_method || "email", 40),
  business_name: clean(payload.business_name, 180),
  industry: clean(payload.industry, 120),
  current_website_url: clean(payload.current_website_url, 300),
  social_links: clean(payload.social_links, 1000),
  project_goal: clean(payload.project_goal, 2000),
  requested_modules: normalizeArray(payload.requested_modules, 80),
  timeline: clean(payload.timeline, 80),
  budget_range: clean(payload.budget_range, 80),
  current_status: clean(payload.current_status, 2000),
  biggest_problem: clean(payload.biggest_problem, 2000),
  manual_or_confusing: clean(payload.manual_or_confusing, 2000),
  system_outcome: clean(payload.system_outcome, 2000),
  extra_message: clean(payload.extra_message, 3000),
  referral_code: clean(payload.referralCode || payload.referral_code, 80),
  page_url: clean(payload.pageUrl || payload.page_url, 800),
  created_at: new Date().toISOString()
});

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
  <p><strong>Website:</strong> ${escapeHtml(lead.current_website_url)}</p>
  <p><strong>Socials:</strong> ${escapeHtml(lead.social_links)}</p>
  <h2>Project</h2>
  <p><strong>Goal:</strong> ${escapeHtml(lead.project_goal)}</p>
  <p><strong>Requested modules:</strong> ${escapeHtml(lead.requested_modules.join(", "))}</p>
  <p><strong>Current status:</strong> ${escapeHtml(lead.current_status)}</p>
  <p><strong>Biggest problem:</strong> ${escapeHtml(lead.biggest_problem)}</p>
  <h2>Timeline / Budget</h2>
  <p><strong>Timeline:</strong> ${escapeHtml(lead.timeline)}</p>
  <p><strong>Budget:</strong> ${escapeHtml(lead.budget_range)}</p>
  <h2>Message</h2>
  <p>${escapeHtml(lead.extra_message)}</p>
`;

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const payload = parsed.payload || {};
  const missingFields = requiredFields.filter((field) => !clean(payload[field]));
  if (missingFields.length) {
    return jsonError("required_fields_missing", "Missing required fields.", 400, { fields: missingFields });
  }

  const suppliedEmail = clean(payload.contact_email, 180);
  const suppliedPhone = clean(payload.contact_phone, 80);
  if (!suppliedEmail && !suppliedPhone) {
    return jsonError("contact_required", "Provide at least one contact channel: email or phone.", 400, { fields: ["contact_email", "contact_phone"] });
  }
  if (suppliedEmail && !isValidEmail(suppliedEmail)) {
    return jsonError("invalid_contact_email", "Invalid email format.", 400, { fields: ["contact_email"] });
  }
  if (suppliedPhone && !isValidPhone(suppliedPhone)) {
    return jsonError("invalid_contact_phone", "Invalid phone format.", 400, { fields: ["contact_phone"] });
  }

  const lead = leadFromPayload(payload);

  if (env.DB) {
    await env.DB.prepare(
      `INSERT INTO leads (
        id, source, contact_name, contact_email, contact_phone, preferred_contact_method,
        business_name, industry, project_goal, budget_range, timeline, current_status,
        message, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`
    )
      .bind(
        lead.id,
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
          current_website_url: lead.current_website_url,
          social_links: lead.social_links,
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

  return json({
    ok: true,
    id: lead.id,
    stored: Boolean(env.DB),
    emailReady: true
  });
}
