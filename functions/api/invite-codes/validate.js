import { clean, getIp, getUa, json, jsonError, jsonOk, readJson, requireDb } from "../../_lib/api.js";

const encoder = new TextEncoder();
const toHex = (buffer) =>
  [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, "0")).join("");

const normalizeCode = (value) =>
  clean(value, 160)
    .replace(/\s+/g, "")
    .toLowerCase();

async function hashInviteCode(code, salt = "") {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(`${salt}:${normalizeCode(code)}`)));
}

async function logInviteEvent(env, event) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(
      `INSERT INTO invite_code_events (
        id, invite_code_id, event_type, source, ip, user_agent, metadata_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        crypto.randomUUID(),
        event.invite_code_id || null,
        clean(event.event_type || "invite_code.checked", 80),
        clean(event.source || "unknown", 80),
        event.ip || null,
        clean(event.user_agent || "", 500),
        JSON.stringify(event.metadata || {}),
        new Date().toISOString()
      )
      .run();
  } catch {
    // Logging must never break public validation.
  }
}

async function validateEnvCode(code, env) {
  const configured = clean(env.BOOSTR_SECRET_CODE || env.BOOSTR_INVITE_CODE || "", 160);
  if (!configured) return null;
  const suppliedHash = await hashInviteCode(code, "env");
  const configuredHash = await hashInviteCode(configured, "env");
  if (suppliedHash !== configuredHash) return null;
  return {
    id: "env-secret-code",
    label: "BOOSTR private access",
    bypass_audit: true,
    allowed_role: "client",
    allowed_persona: "client",
    allowed_workspace_type: "onboarding",
    campaign: "env_secret_code",
    source: "env"
  };
}

async function validateDbCode(code, env) {
  const now = new Date().toISOString();
  let rows = [];
  try {
    const result = await env.DB.prepare(
      `SELECT id, code_hash, code_salt, label, status, max_uses, used_count, expires_at,
              allowed_role, allowed_persona, allowed_workspace_type, campaign, source,
              bypass_audit, metadata_json
       FROM invite_codes
       WHERE status = 'active'
         AND (expires_at IS NULL OR expires_at > ?)
         AND used_count < max_uses
       LIMIT 200`
    )
      .bind(now)
      .all();
    rows = result.results || [];
  } catch {
    return null;
  }

  for (const row of rows) {
    const candidate = await hashInviteCode(code, row.code_salt || "");
    if (candidate === row.code_hash) return row;
  }
  return null;
}

function safeValidPayload(row) {
  return {
    valid: true,
    label: row.label || "BOOSTR private access",
    bypass_audit: Boolean(row.bypass_audit ?? true),
    allowed_role: row.allowed_role || "client",
    allowed_persona: row.allowed_persona || row.allowed_role || "client",
    allowed_workspace_type: row.allowed_workspace_type || "onboarding",
    campaign: row.campaign || null,
    source: row.source || null,
    message: "Cheat BOOSTR Code unlocked"
  };
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok && !(env.BOOSTR_SECRET_CODE || env.BOOSTR_INVITE_CODE)) return db.response;

  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;

  const code = normalizeCode(parsed.payload?.code);
  const source = clean(parsed.payload?.source || "audit_entry", 80);
  if (!code) return jsonError("code_required", "Secret BOOSTR code is required.", 400);
  if (code.length < 2) return jsonOk({ valid: false }, 200);

  const ip = getIp(request);
  const userAgent = getUa(request);

  const envMatch = await validateEnvCode(code, env);
  if (envMatch) {
    await logInviteEvent(env, {
      invite_code_id: envMatch.id,
      event_type: "invite_code.validated",
      source,
      ip,
      user_agent: userAgent,
      metadata: { storage: "env" }
    });
    return jsonOk(safeValidPayload(envMatch));
  }

  if (!env.DB) return jsonOk({ valid: false }, 200);

  const match = await validateDbCode(code, env);
  if (!match) {
    await logInviteEvent(env, {
      event_type: "invite_code.invalid",
      source,
      ip,
      user_agent: userAgent
    });
    return jsonOk({ valid: false }, 200);
  }

  await logInviteEvent(env, {
    invite_code_id: match.id,
    event_type: "invite_code.validated",
    source,
    ip,
    user_agent: userAgent,
    metadata: { campaign: match.campaign || null }
  });

  return jsonOk(safeValidPayload(match));
}
