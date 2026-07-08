import { addLeadEvent, clean, isValidEmail, json, jsonError, now, readJson, requireDb, requireRole } from "../../../_lib/api.js";
import { insertCard } from "../../../_lib/custom-os.js";

const roleForWorkspace = (type) => type === "artist" ? "artist" : type === "partner" ? "partner" : "client";
const slugify = (value) => clean(value, 90).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 58) || "workspace";
const parseJson = (value, fallback) => { try { return JSON.parse(value || ""); } catch { return fallback; } };

async function uniqueSlug(env, base) {
  const root = slugify(base);
  for (let index = 0; index < 30; index += 1) {
    const slug = index === 0 ? root : `${root}-${index + 1}`;
    const existing = await env.DB.prepare("SELECT id FROM workspaces WHERE slug = ? LIMIT 1").bind(slug).first();
    if (!existing?.id) return slug;
  }
  return `${root}-${crypto.randomUUID().slice(0, 8)}`;
}

function personaFor(audit, payload) {
  const requested = clean(payload.persona_type || payload.default_persona, 40).toLowerCase();
  if (["artist", "partner", "client"].includes(requested)) return requested;
  const text = `${audit.industry || ""} ${audit.business_name || ""}`.toLowerCase();
  if (text.includes("artist") || text.includes("artista") || text.includes("music") || text.includes("música")) return "artist";
  if (text.includes("partner") || text.includes("aliado")) return "partner";
  return "client";
}

async function ensureUser(env, audit, payload, workspaceId, personaId, persona, timestamp) {
  const email = clean(payload.client_email || payload.owner_email || audit.contact_email, 180).toLowerCase();
  if (!email || !isValidEmail(email)) return null;
  const existing = await env.DB.prepare("SELECT id, email, name, role, status FROM users WHERE lower(email) = ? LIMIT 1").bind(email).first();
  if (existing?.id) {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO workspace_members (id, workspace_id, user_id, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?)`
    ).bind(crypto.randomUUID(), workspaceId, existing.id, roleForWorkspace(persona), timestamp, timestamp).run();
    await env.DB.prepare("UPDATE users SET default_workspace_id = COALESCE(default_workspace_id, ?), default_persona_id = COALESCE(default_persona_id, ?), updated_at = ? WHERE id = ?")
      .bind(workspaceId, personaId, timestamp, existing.id).run();
    return existing;
  }
  const userId = crypto.randomUUID();
  const name = clean(payload.client_name || payload.owner_name || audit.contact_name || audit.business_name || "BOOSTR Client", 140);
  await env.DB.prepare(
    `INSERT INTO users (id, email, name, role, workspace_id, status, created_at, updated_at,
      default_workspace_id, default_persona_id, language, theme, signup_source, onboarding_status)
     VALUES (?, ?, ?, ?, ?, 'invited', ?, ?, ?, ?, ?, 'platinum_dark', 'audit_claim', 'claimed_from_audit')`
  ).bind(userId, email, name, roleForWorkspace(persona), workspaceId, timestamp, timestamp, workspaceId, personaId, clean(audit.language, 8).toLowerCase() === "es" ? "es" : "en").run();
  await env.DB.prepare(
    `INSERT INTO workspace_members (id, workspace_id, user_id, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?)`
  ).bind(crypto.randomUUID(), workspaceId, userId, roleForWorkspace(persona), timestamp, timestamp).run();
  return { id: userId, email, name, role: roleForWorkspace(persona), status: "invited" };
}

async function addClaimCards(env, audit, workspaceId, userId, personaId, persona, modules, timestamp) {
  const base = { workspace_id: workspaceId, user_id: userId || null, persona_id: personaId || null, source_type: "audit_claim", source_id: audit.id, owner_user_id: userId || null, owner_role: roleForWorkspace(persona), created_at: timestamp, updated_at: timestamp };
  const cards = [
    ["insight", "Audit claimed into Custom OS", `Signals: ${audit.signals || 0}. Modules: ${modules.join(", ") || "BOOSTR Review"}.`, 94, "Review audit", `/manager/leads?audit=${encodeURIComponent(audit.id)}`],
    ["product", "Create the first sellable offer", "Turn this audit into one concrete product, service, booking or license.", 90, "Open Products", "/app/products"],
    ["payment", "Prepare a Smart Link", "Create a public reservation link without Stripe once the product exists.", 86, "Open Smart Links", "/manager/payment-links"],
    ["next_to_boost", "Follow up with the lead", "Confirm offer, delivery, access rules and next step manually.", 84, "Open Orders", "/app/orders"]
  ];
  if (modules.some((module) => /payment|smart link|checkout/i.test(module))) cards.push(["payment", "Audit detected payment friction", "Prioritize checkout/reservation cleanup before adding more traffic.", 92, "Create Smart Link", "/manager/payment-links"]);
  for (const [card_type, title, summary, priority, action_label, action_url] of cards) {
    await insertCard(env, { ...base, card_type, title, summary, priority, status: "unread", action_label, action_url, metadata: { audit_submission_id: audit.id, modules, claim: true } });
  }
  return cards.length;
}

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestPost({ request, env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};
  const id = clean(params.id, 120);
  const audit = await env.DB.prepare(
    `SELECT id, workspace_id, contact_email, contact_name, business_name, industry, language, signals, recommended_modules, status
     FROM audit_submissions WHERE id = ? LIMIT 1`
  ).bind(id).first();
  if (!audit?.id) return jsonError("audit_not_found", "Audit submission not found.", 404);
  if (audit.status === "claimed" && audit.workspace_id && audit.workspace_id !== "boostr-intake") return json({ ok: true, already_claimed: true, workspace_id: audit.workspace_id, audit_id: id });

  const timestamp = now();
  const workspaceId = crypto.randomUUID();
  const workspaceName = clean(payload.workspace_name || audit.business_name || "BOOSTR Client Workspace", 140);
  const persona = personaFor(audit, payload);
  const role = roleForWorkspace(persona);
  const personaId = crypto.randomUUID();
  const ownerEmail = clean(payload.owner_email || payload.client_email || audit.contact_email, 180).toLowerCase() || null;
  const slug = await uniqueSlug(env, workspaceName);
  const modules = parseJson(audit.recommended_modules, []);

  await env.DB.prepare("INSERT INTO workspaces (id, type, name, slug, owner_email, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)")
    .bind(workspaceId, role, workspaceName, slug, ownerEmail, timestamp, timestamp).run();
  const user = await ensureUser(env, audit, payload, workspaceId, personaId, persona, timestamp);
  const userId = user?.id || null;
  if (userId) {
    await env.DB.prepare("INSERT INTO personas (id, user_id, workspace_id, persona_type, display_name, status, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)")
      .bind(personaId, userId, workspaceId, persona, clean(user.name || audit.contact_name || workspaceName, 120), JSON.stringify({ source: "audit_claim", audit_submission_id: id }), timestamp, timestamp).run();
  }
  await env.DB.prepare(
    `INSERT OR IGNORE INTO workspace_preferences (id, workspace_id, default_mode, default_persona_id, default_language, card_density, show_demo_labels, reduce_motion, notification_preferences_json, created_at, updated_at)
     VALUES (?, ?, 'cash', ?, ?, 'comfortable', 0, 0, ?, ?, ?)`
  ).bind(crypto.randomUUID(), workspaceId, userId ? personaId : null, clean(audit.language, 8).toLowerCase() === "es" ? "es" : "en", JSON.stringify({ in_app: true }), timestamp, timestamp).run();

  await env.DB.prepare("UPDATE audit_submissions SET workspace_id = ?, status = 'claimed', updated_at = ? WHERE id = ?").bind(workspaceId, timestamp, id).run();
  await env.DB.prepare("UPDATE leads SET workspace_id = ?, status = 'qualified', updated_at = ? WHERE id = ?").bind(workspaceId, timestamp, id).run();
  await env.DB.prepare("UPDATE cards SET workspace_id = ?, user_id = COALESCE(user_id, ?), persona_id = COALESCE(persona_id, ?), owner_user_id = COALESCE(owner_user_id, ?), updated_at = ? WHERE source_type = 'audit_submission' AND source_id = ?").bind(workspaceId, userId, userId ? personaId : null, userId, timestamp, id).run();
  await env.DB.prepare("UPDATE lead_events SET workspace_id = ? WHERE audit_submission_id = ? OR lead_id = ?").bind(workspaceId, id, id).run();

  const cardsCreated = await addClaimCards(env, audit, workspaceId, userId, userId ? personaId : null, persona, modules, timestamp);
  await addLeadEvent(env, { workspace_id: workspaceId, lead_id: id, audit_submission_id: id, event_type: "audit.claimed", payload: { workspace_id: workspaceId, workspace_name: workspaceName, user_id: userId, claimed_by: auth.user.id, cards_created: cardsCreated }, created_at: timestamp });

  return json({ ok: true, audit_id: id, lead_id: id, workspace: { id: workspaceId, name: workspaceName, slug, type: role }, client_user: user, persona: userId ? { id: personaId, type: persona } : null, cards_created: cardsCreated, status: "claimed" }, 201);
}
