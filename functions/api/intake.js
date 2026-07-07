const requiredFields = ['contact_name', 'contact_email', 'business_name', 'industry', 'project_goal', 'current_status'];

const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store'
    }
  });

const normalizeText = (value, maxLength = 2000) => String(value || '').trim().slice(0, maxLength);

const normalizeModules = (value) => {
  if (Array.isArray(value)) return value.map((item) => normalizeText(item, 80)).filter(Boolean);
  if (!value) return [];
  return [normalizeText(value, 80)].filter(Boolean);
};

const escapeHtml = (value) =>
  String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const leadFromPayload = (payload) => ({
  id: crypto.randomUUID(),
  source: normalizeText(payload.source || 'website', 40),
  contact_name: normalizeText(payload.contact_name, 140),
  contact_email: normalizeText(payload.contact_email, 180).toLowerCase(),
  contact_phone: normalizeText(payload.contact_phone, 60),
  preferred_contact_method: normalizeText(payload.preferred_contact_method || 'email', 40),
  business_name: normalizeText(payload.business_name, 180),
  industry: normalizeText(payload.industry, 120),
  current_website_url: normalizeText(payload.current_website_url, 300),
  social_links: normalizeText(payload.social_links, 1000),
  project_goal: normalizeText(payload.project_goal, 2000),
  requested_modules: normalizeModules(payload.requested_modules),
  timeline: normalizeText(payload.timeline, 80),
  budget_range: normalizeText(payload.budget_range, 80),
  current_status: normalizeText(payload.current_status, 2000),
  biggest_problem: normalizeText(payload.biggest_problem, 2000),
  manual_or_confusing: normalizeText(payload.manual_or_confusing, 2000),
  system_outcome: normalizeText(payload.system_outcome, 2000),
  extra_message: normalizeText(payload.extra_message, 3000),
  referral_code: normalizeText(payload.referralCode, 80),
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
  <p><strong>Requested modules:</strong> ${escapeHtml(lead.requested_modules.join(', '))}</p>
  <p><strong>Current status:</strong> ${escapeHtml(lead.current_status)}</p>
  <p><strong>Biggest problem:</strong> ${escapeHtml(lead.biggest_problem)}</p>
  <h2>Timeline / Budget</h2>
  <p><strong>Timeline:</strong> ${escapeHtml(lead.timeline)}</p>
  <p><strong>Budget:</strong> ${escapeHtml(lead.budget_range)}</p>
  <h2>Message</h2>
  <p>${escapeHtml(lead.extra_message)}</p>
`;

export async function onRequestPost({ request, env }) {
  let payload;

  try {
    payload = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const missingFields = requiredFields.filter((field) => !normalizeText(payload[field]));
  if (missingFields.length) {
    return json({ ok: false, error: 'Missing required fields.', fields: missingFields }, 400);
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
          referral_code: lead.referral_code
        }),
        lead.created_at,
        lead.created_at
      )
      .run();
  }

  console.info('BOOSTR intake received', {
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
