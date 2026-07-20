import { addLeadEvent, clean, isValidEmail, isValidPhone, json, jsonError, normalizeArray, normalizePhone, readJson } from "../_lib/api.js";

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
  <h2>Project</h2>
  <p><strong>Goal:</strong> ${escapeHtml(lead.project_goal)}</p>
  <p><strong>Requested modules:</strong> ${escapeHtml(lead.requested_modules.join(", "))}</p>
  <h2>Timeline / Budget</h2>
  <p><strong>Timeline:</strong> ${escapeHtml(lead.timeline)}</p>
  <p><strong>Budget:</strong> ${escapeHtml(lead.budget_range)}</p>
  <h2>Message</h2>
  <p>${escapeHtml(lead.extra_message)}</p>
`;

const telegramText = (lead) => [
  "🎟️ NUEVO LEAD · ROWMA ORLANDO",
  "",
  `Nombre: ${lead.contact_name}`,
  `WhatsApp: ${lead.contact_phone}`,
  `Correo: ${lead.contact_email || "No indicado"}`,
  `Total solicitado: ${lead.budget_range}`,
  `Referencia: ${lead.referral_code || "Sin referencia"}`,
  `Fecha: ${lead.created_at}`,
  "",
  "Acción: escribirle por WhatsApp para enviar pago y cerrar las entradas."
].join("\n");

async function sendTelegramLeadNotification(env, lead) {
  const token = clean(env.TELEGRAM_BOT_TOKEN, 200);
  const chatId = clean(env.TELEGRAM_CHAT_ID, 100);
  if (!token || !chatId || lead.source !== ORLANDO_SOURCE) return false;
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) throw new Error("telegram_bot_token_invalid");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: telegramText(lead),
      disable_web_page_preview: true
    })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.ok !== true) {
    throw new Error(clean(result.description || `telegram_http_${response.status}`, 300));
  }
  return true;
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context) {
  const { request, env } = context;
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

  const notificationConfigured = Boolean(
    lead.source === ORLANDO_SOURCE && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID
  );
  let notificationSent = false;
  let notificationError = "";
  if (notificationConfigured) {
    try {
      notificationSent = await sendTelegramLeadNotification(env, lead);
    } catch (error) {
      notificationError = error instanceof Error ? error.message : String(error);
      console.error(JSON.stringify({
        message: "telegram_lead_notification_failed",
        lead_id: lead.id,
        error: notificationError
      }));
    }
  }

  return json({
    ok: true,
    id: lead.id,
    stored: Boolean(env.DB),
    notificationConfigured,
    notificationSent,
    ...(notificationError ? { notificationError } : {})
  });
}
