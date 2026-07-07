const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });

const clean = (value, max = 5000) => String(value || '').trim().slice(0, max);

const summarizeAnswers = (answers = {}) => ({
  identity: answers.identity || [],
  futureId: answers.futureId || [],
  current: answers.current || [],
  future: answers.future || [],
  assets: answers.assets || [],
  stage: answers.stage || '',
  friction: answers.friction || [],
  traffic: answers.traffic || '',
  contact: clean(answers.contact, 500)
});

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const answers = payload.answers || {};
  const summary = summarizeAnswers(answers);
  const contact = clean(payload.contact || answers.contact || '', 500);
  const lead = {
    id,
    source: 'boostr-audit',
    contact_name: contact || 'BOOSTR Audit Lead',
    contact_email: '',
    contact_phone: '',
    preferred_contact_method: 'audit-contact-field',
    business_name: contact || 'BOOSTR Audit Submission',
    industry: Array.isArray(summary.identity) ? summary.identity.join(', ').slice(0, 180) : '',
    project_goal: JSON.stringify(summary).slice(0, 2000),
    budget_range: '',
    timeline: summary.stage || '',
    current_status: Array.isArray(summary.friction) ? summary.friction.join(', ').slice(0, 2000) : '',
    message: JSON.stringify({ ...payload, answers: summary }).slice(0, 12000),
    created_at: now,
    updated_at: now
  };

  let stored = false;
  if (env.DB) {
    try {
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
          lead.message,
          lead.created_at,
          lead.updated_at
        )
        .run();
      stored = true;
    } catch (error) {
      console.error('BOOSTR audit DB insert failed', { id, error: String(error) });
    }
  }

  console.info('BOOSTR audit received', {
    id,
    stored,
    contact,
    signals: payload.signals,
    language: payload.language,
    summary
  });

  return json({
    ok: true,
    id,
    stored,
    needsDbBinding: !Boolean(env.DB)
  });
}

export async function onRequestGet() {
  return json({ ok: true, endpoint: 'BOOSTR Audit API', accepts: 'POST JSON' });
}
