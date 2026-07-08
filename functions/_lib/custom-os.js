import { authCanSeeAll, clean, defaultWorkspaceId, jsonError, normalizeArray, now, requireWorkspaceAccess } from "./api.js";

export const personaTypes = new Set([
  "admin",
  "manager",
  "partner",
  "client",
  "artist",
  "creator",
  "producer",
  "seller",
  "agent_later"
]);

export const cardTypes = new Set([
  "lead",
  "next_to_boost",
  "product",
  "music",
  "payment",
  "order",
  "file",
  "invoice",
  "insight",
  "health",
  "human_need",
  "asset_request",
  "partner_action"
]);

export const cardStatuses = new Set([
  "unread",
  "read",
  "high_potential",
  "normal",
  "special_case",
  "later",
  "approved",
  "rejected",
  "active",
  "done",
  "blocked",
  "archived"
]);

export const humanNeedTypes = new Set([
  "cash",
  "create",
  "manage",
  "review",
  "boost_product",
  "boost_music",
  "boost_partners",
  "clear_head",
  "feel_artist",
  "feel_business"
]);

export const customOsRoles = ["admin", "manager", "partner", "client", "artist", "producer", "creator", "seller", "agent_later"];

export const resolveWorkspaceForRequest = (auth, requestedWorkspaceId) => {
  const workspaceId = clean(requestedWorkspaceId, 120) || (authCanSeeAll(auth) ? null : defaultWorkspaceId(auth));
  const access = requireWorkspaceAccess(auth, workspaceId);
  if (!access.ok) return { ok: false, response: access.response };
  return { ok: true, workspace_id: workspaceId };
};

export const requireWritableWorkspace = (auth, requestedWorkspaceId) => {
  const workspaceId = clean(requestedWorkspaceId, 120) || defaultWorkspaceId(auth);
  const access = requireWorkspaceAccess(auth, workspaceId);
  if (!access.ok) return { ok: false, response: access.response };
  return { ok: true, workspace_id: workspaceId };
};

export const canSeeOperationalCards = (auth) => authCanSeeAll(auth);

export function scopedCardFilters(auth, workspaceId) {
  const filters = [];
  const binds = [];

  if (workspaceId) {
    filters.push("workspace_id = ?");
    binds.push(workspaceId);
  }

  if (!canSeeOperationalCards(auth)) {
    const roles = auth.roles || [];
    filters.push("(user_id = ? OR owner_user_id = ? OR owner_role IN (" + roles.map(() => "?").join(",") + "))");
    binds.push(auth.user.id, auth.user.id, ...roles);
  }

  return { filters, binds };
}

export async function getPersona(env, personaId, workspaceId) {
  const id = clean(personaId, 120);
  if (!id) return null;
  return env.DB.prepare("SELECT id, user_id, workspace_id, persona_type FROM personas WHERE id = ? AND workspace_id = ? LIMIT 1")
    .bind(id, workspaceId)
    .first();
}

export async function insertCard(env, card) {
  const timestamp = card.created_at || now();
  const id = card.id || crypto.randomUUID();
  const cardType = cardTypes.has(card.card_type) ? card.card_type : "insight";
  const status = cardStatuses.has(card.status) ? card.status : "unread";
  const priority = Math.min(Math.max(Number(card.priority ?? 50) || 50, 0), 100);

  await env.DB.prepare(
    `INSERT INTO cards (
      id, workspace_id, user_id, persona_id, source_type, source_id, card_type,
      title, summary, priority, status, owner_user_id, owner_role,
      action_label, action_url, metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      card.workspace_id,
      card.user_id || null,
      card.persona_id || null,
      clean(card.source_type || "manual", 80),
      clean(card.source_id, 120) || null,
      cardType,
      clean(card.title, 240),
      clean(card.summary, 1200),
      priority,
      status,
      card.owner_user_id || null,
      clean(card.owner_role, 40) || null,
      clean(card.action_label, 120),
      clean(card.action_url, 800) || null,
      JSON.stringify(card.metadata || {}),
      timestamp,
      card.updated_at || timestamp
    )
    .run();

  return { id, card_type: cardType, status, priority };
}

export async function updateCard(env, id, fields) {
  const updates = [];
  const binds = [];
  const status = clean(fields.status, 40);
  const priority = fields.priority === undefined ? null : Math.min(Math.max(Number(fields.priority) || 0, 0), 100);

  if (status) {
    if (!cardStatuses.has(status)) return { ok: false, response: jsonError("invalid_card_status", "Card status is not supported.", 400) };
    updates.push("status = ?");
    binds.push(status);
  }
  if (priority !== null) {
    updates.push("priority = ?");
    binds.push(priority);
  }
  if (fields.owner_user_id !== undefined) {
    updates.push("owner_user_id = ?");
    binds.push(clean(fields.owner_user_id, 120) || null);
  }
  if (fields.owner_role !== undefined) {
    updates.push("owner_role = ?");
    binds.push(clean(fields.owner_role, 40) || null);
  }
  if (fields.action_label !== undefined) {
    updates.push("action_label = ?");
    binds.push(clean(fields.action_label, 120));
  }
  if (fields.action_url !== undefined) {
    updates.push("action_url = ?");
    binds.push(clean(fields.action_url, 800) || null);
  }

  if (!updates.length) return { ok: false, response: jsonError("no_card_updates", "No supported card fields were provided.", 400) };

  updates.push("updated_at = ?");
  binds.push(now(), id);
  await env.DB.prepare(`UPDATE cards SET ${updates.join(", ")} WHERE id = ?`).bind(...binds).run();
  return { ok: true };
}

function auditCardMetadata(record, extra = {}) {
  return {
    audit_submission_id: record.id,
    lead_id: record.id,
    business_name: record.business_name,
    signals: record.signals,
    recommended_modules: record.recommended_modules,
    ...extra
  };
}

export async function createAuditCards(env, record) {
  if (!env.DB || !record.workspace_id) return [];
  const created = [];
  const base = {
    workspace_id: record.workspace_id,
    source_type: "audit_submission",
    source_id: record.id,
    created_at: record.created_at,
    updated_at: record.created_at
  };

  created.push(await insertCard(env, {
    ...base,
    card_type: "lead",
    title: record.business_name || "New BOOSTR Audit",
    summary: `Audit submitted with ${record.signals || 0} signal points.`,
    priority: Math.min(100, 60 + Number(record.signals || 0)),
    status: Number(record.signals || 0) >= 20 ? "high_potential" : "unread",
    owner_role: "manager",
    action_label: "Review lead",
    action_url: `/manager/leads?id=${encodeURIComponent(record.id)}`,
    metadata: auditCardMetadata(record)
  }));

  const assets = normalizeArray(record.audit?.assets || record.audit?.raw?.assets);
  if (!assets.some((item) => item.toLowerCase().includes("website") || item.toLowerCase().includes("web"))) {
    created.push(await insertCard(env, {
      ...base,
      card_type: "asset_request",
      title: "Missing website or system route",
      summary: "Audit signals that this workspace may need a stronger public route.",
      priority: 72,
      status: "unread",
      owner_role: "manager",
      action_label: "Plan route",
      metadata: auditCardMetadata(record, { missing_asset: "website" })
    }));
  }

  const frictions = normalizeArray(record.audit?.frictions || record.audit?.raw?.friction || record.audit?.raw?.frictions);
  for (const friction of frictions.slice(0, 3)) {
    created.push(await insertCard(env, {
      ...base,
      card_type: "next_to_boost",
      title: "Next to boost",
      summary: friction,
      priority: 68,
      status: "normal",
      owner_role: "manager",
      action_label: "Turn into action",
      metadata: auditCardMetadata(record, { friction })
    }));
  }

  for (const moduleName of normalizeArray(record.recommended_modules).slice(0, 4)) {
    created.push(await insertCard(env, {
      ...base,
      card_type: "insight",
      title: `${moduleName} recommended`,
      summary: "Recommended by BOOSTR Audit answers.",
      priority: 62,
      status: "unread",
      owner_role: "manager",
      action_label: "Review module",
      metadata: auditCardMetadata(record, { module: moduleName })
    }));
  }

  return created;
}

export async function createHumanNeedCards(env, need, personaType) {
  const cards = [];
  const base = {
    workspace_id: need.workspace_id,
    user_id: need.user_id,
    persona_id: need.persona_id,
    source_type: "human_need",
    source_id: need.id,
    created_at: need.created_at,
    updated_at: need.created_at
  };

  const add = async (card) => {
    cards.push(await insertCard(env, {
      ...base,
      status: "unread",
      priority: 80,
      metadata: { need_type: need.need_type, persona_type: personaType, note: need.note },
      ...card
    }));
  };

  if (need.need_type === "cash" && ["artist", "producer", "creator", "seller"].includes(personaType)) {
    await add({ card_type: "payment", title: "Create Smart Payment Link", summary: "Package the fastest sellable offer for this workspace.", action_label: "Prepare payment link" });
    await add({ card_type: "product", title: "Push product or beat", summary: "Move the asset closest to purchase intent.", action_label: "Review products" });
    await add({ card_type: "music", title: "Post story with direct CTA", summary: "Use the warmest audience channel to drive immediate action.", action_label: "Draft story" });
    await add({ card_type: "order", title: "Booking deposit path", summary: "Create a clean next step for serious buyers.", action_label: "Prepare deposit" });
  } else if (need.need_type === "manage" && ["manager", "admin"].includes(personaType)) {
    await add({ card_type: "lead", title: "Review unread leads", summary: "Start with new or high-potential lead cards.", action_label: "Open leads" });
    await add({ card_type: "partner_action", title: "High-potential partner action", summary: "Check partner-related cards waiting for a next step.", action_label: "Review partners" });
    await add({ card_type: "health", title: "Ecosystem health scan", summary: "Look for blocked cards, stale orders and missing owners.", action_label: "Check health" });
  } else {
    await add({ card_type: "human_need", title: "Human need captured", summary: need.note || `Need type: ${need.need_type}`, action_label: "Review need" });
  }

  return cards;
}
