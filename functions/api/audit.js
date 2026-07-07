import { addLeadEvent, clean, getIp, getUa, json, normalizeArray, readJson } from "../_lib/api.js";

const inferContact = (payload) => {
  const free = clean(payload.contact || payload.contact_info || payload.free || payload.link || payload.website || payload.social || payload.business_link, 500);
  const emailMatch = free.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return {
    raw: free,
    email: clean(payload.email || payload.contact_email || emailMatch?.[0] || "", 180).toLowerCase(),
    phone: clean(payload.phone || payload.contact_phone || "", 80)
  };
};

const buildAuditRecord = (payload, request) => {
  const answers = payload.answers && typeof payload.answers === "object" ? payload.answers : payload;
  const contact = inferContact(payload);
  const language = clean(payload.lang || payload.language || answers.lang || "unknown", 20);
  const businessName = clean(
    payload.business_name ||
      payload.business ||
      payload.businessProject ||
      answers.business_name ||
      answers.business ||
      answers.contact ||
      contact.raw ||
      "BOOSTR Audit Lead",
    180
  );

  const identity = normalizeArray(answers.identity || answers.ids || answers.identity_current);
  const futureIdentity = normalizeArray(answers.futureId || answers.future_identity);
  const currentMoney = normalizeArray(answers.current || answers.current_money);
  const futureMoney = normalizeArray(answers.future || answers.future_money);
  const assets = normalizeArray(answers.assets);
  const frictions = normalizeArray(answers.friction || answers.frictions);
  const traffic = clean(answers.traffic || payload.traffic, 400);
  const stage = clean(answers.stage || payload.stage, 400);
  const signals = Number(payload.signals || answers.signals || 0) || 0;

  const modules = new Set(["BOOSTR Review"]);
  const frictionText = frictions.join(" ").toLowerCase();
  const futureText = futureMoney.join(" ").toLowerCase();

  if (frictionText.includes("dm") || frictionText.includes("pregunt") || frictionText.includes("question")) {
    modules.add("Smart Link");
    modules.add("Lead Capture");
  }
  if (frictionText.includes("cobrar") || frictionText.includes("charging") || frictionText.includes("payment")) {
    modules.add("Payment Flow");
  }
  if (frictionText.includes("audiencia") || frictionText.includes("audience") || frictionText.includes("sales")) {
    modules.add("Conversion Path");
  }
  if (futureText.includes("clothing") || futureText.includes("ropa") || futureText.includes("products")) {
    modules.add("Store");
  }
  if (!assets.some((item) => item.toLowerCase().includes("website") || item.toLowerCase().includes("web"))) {
    modules.add("Website / Landing");
  }

  return {
    id: crypto.randomUUID(),
    source: clean(payload.source || "boostr-audit", 80),
    page_url: clean(payload.pageUrl || payload.page_url || request.headers.get("Referer") || "", 800),
    language,
    contact_name: clean(payload.name || payload.contact_name || answers.name || "", 160),
    contact_email: contact.email,
    contact_phone: contact.phone,
    contact_raw: contact.raw,
    business_name: businessName,
    industry: identity.join(", ").slice(0, 260),
    stage,
    traffic,
    signals,
    recommended_modules: [...modules],
    answers_json: JSON.stringify({
      identity,
      futureIdentity,
      currentMoney,
      futureMoney,
      assets,
      frictions,
      traffic,
      stage,
      raw: answers
    }),
    ip: getIp(request),
    user_agent: getUa(request),
    created_at: new Date().toISOString()
  };
};

async function storeAudit(env, record) {
  if (!env.DB) return { stored: false, reason: "D1 DB binding missing" };

  try {
    await env.DB.prepare(
      `INSERT INTO audit_submissions (
        id, source, page_url, language, contact_name, contact_email, contact_phone, contact_raw,
        business_name, industry, stage, traffic, signals, recommended_modules, answers_json,
        ip, user_agent, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`
    )
      .bind(
        record.id,
        record.source,
        record.page_url,
        record.language,
        record.contact_name,
        record.contact_email,
        record.contact_phone,
        record.contact_raw,
        record.business_name,
        record.industry,
        record.stage,
        record.traffic,
        record.signals,
        JSON.stringify(record.recommended_modules),
        record.answers_json,
        record.ip,
        record.user_agent,
        record.created_at,
        record.created_at
      )
      .run();

    await env.DB.prepare(
      `INSERT INTO leads (
        id, source, contact_name, contact_email, contact_phone, preferred_contact_method,
        business_name, industry, project_goal, budget_range, timeline, current_status,
        message, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`
    )
      .bind(
        record.id,
        "boostr-audit",
        record.contact_name || "Audit Lead",
        record.contact_email,
        record.contact_phone,
        "unknown",
        record.business_name,
        record.industry,
        `BOOSTR Audit submitted. Signals: ${record.signals}. Recommended modules: ${record.recommended_modules.join(", ")}`,
        "not_collected",
        "not_collected",
        record.stage || "Audit submitted",
        JSON.stringify({
          contact_raw: record.contact_raw,
          traffic: record.traffic,
          recommended_modules: record.recommended_modules,
          audit_submission_id: record.id
        }),
        record.created_at,
        record.created_at
      )
      .run();

    await addLeadEvent(env, {
      lead_id: record.id,
      audit_submission_id: record.id,
      event_type: "audit.submitted",
      payload: {
        business_name: record.business_name,
        signals: record.signals,
        recommended_modules: record.recommended_modules,
        source: record.source
      },
      created_at: record.created_at
    });

    return { stored: true };
  } catch (error) {
    console.error("BOOSTR Audit storage error", error);
    return { stored: false, reason: error.message || "Database storage failed" };
  }
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const record = buildAuditRecord(parsed.payload || {}, request);

  if (!record.contact_email && !record.contact_phone && !record.contact_raw) {
    return json({
      ok: false,
      error: "Missing contact channel.",
      message: "Audit needs at least email, phone, Instagram, WhatsApp, website or another contact link."
    }, 400);
  }

  try {
    const storage = await storeAudit(env, record);
    
    if (!storage.stored) {
      console.error("BOOSTR Audit storage failed", { id: record.id, reason: storage.reason });
      return json({
        ok: false,
        error: "Audit storage failed.",
        reason: storage.reason
      }, 503);
    }

    console.info("BOOSTR Audit received and stored", {
      id: record.id,
      business_name: record.business_name,
      recommended_modules: record.recommended_modules
    });

    return json({
      ok: true,
      id: record.id,
      stored: storage.stored,
      recommended_modules: record.recommended_modules
    });
  } catch (error) {
    console.error("BOOSTR Audit endpoint error", error);
    return json({ ok: false, error: "Audit processing failed." }, 500);
  }
}

export async function onRequestGet({ env }) {
  return json({
    ok: true,
    endpoint: "/api/audit",
    accepts: "POST",
    dbBound: Boolean(env.DB)
  });
}
