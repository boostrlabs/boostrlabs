import { json, jsonError, now, requireDb, requireRole } from "../../_lib/api.js";
import { customOsRoles } from "../../_lib/custom-os.js";

const OPERATOR = {
  slug: "omni-jr-parking",
  name: "OMNI JR Parking",
  type: "partner",
  fixedCode: "omni_jr_8h",
  monthlyCode: "omni_jr_monthly"
};

async function ensureSchema(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS workspace_members (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_members_workspace_user ON workspace_members(workspace_id, user_id)"
  ).run();
}

async function ensureWorkspace(env, auth) {
  let workspace = await env.DB.prepare(
    "SELECT id, name, slug, type, status FROM workspaces WHERE slug = ? LIMIT 1"
  ).bind(OPERATOR.slug).first();
  if (workspace?.id) return workspace;

  const id = crypto.randomUUID();
  const timestamp = now();
  await env.DB.prepare(`
    INSERT OR IGNORE INTO workspaces (id, type, name, slug, owner_email, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
  `).bind(id, OPERATOR.type, OPERATOR.name, OPERATOR.slug, auth.user?.email || null, timestamp, timestamp).run();

  workspace = await env.DB.prepare(
    "SELECT id, name, slug, type, status FROM workspaces WHERE slug = ? LIMIT 1"
  ).bind(OPERATOR.slug).first();
  return workspace;
}

async function ensureMembership(env, workspaceId, auth) {
  const userId = auth.user?.id;
  if (!userId || userId === "dev-manager") return;
  const timestamp = now();
  const current = await env.DB.prepare(
    "SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ? LIMIT 1"
  ).bind(workspaceId, userId).first();
  if (current?.id) {
    await env.DB.prepare(
      "UPDATE workspace_members SET role = 'manager', status = 'active', updated_at = ? WHERE id = ?"
    ).bind(timestamp, current.id).run();
    return;
  }
  await env.DB.prepare(`
    INSERT INTO workspace_members (id, workspace_id, user_id, role, status, created_at, updated_at)
    VALUES (?, ?, ?, 'manager', 'active', ?, ?)
  `).bind(crypto.randomUUID(), workspaceId, userId, timestamp, timestamp).run();
}

async function archiveMisassignedParking(env, workspaceId) {
  for (const code of [OPERATOR.fixedCode, OPERATOR.monthlyCode]) {
    try {
      await env.DB.prepare(`
        UPDATE payment_links SET status = 'archived', updated_at = ?
        WHERE workspace_id != ? AND json_extract(metadata_json, '$.parking_code') = ?
      `).bind(now(), workspaceId, code).run();
      await env.DB.prepare(`
        UPDATE products SET status = 'archived', updated_at = ?
        WHERE workspace_id != ? AND json_extract(metadata_json, '$.parking_code') = ?
      `).bind(now(), workspaceId, code).run();
    } catch {}
  }
}

async function ensureFixedPlan(env, workspaceId) {
  let link = await env.DB.prepare(`
    SELECT id FROM payment_links
    WHERE workspace_id = ? AND status = 'active'
      AND json_extract(metadata_json, '$.parking_code') = ?
    ORDER BY updated_at DESC LIMIT 1
  `).bind(workspaceId, OPERATOR.fixedCode).first();
  if (link?.id) return link;

  const timestamp = now();
  const productId = crypto.randomUUID();
  const paymentLinkId = crypto.randomUUID();
  const metadata = JSON.stringify({
    source: "boostr_smart_parking_v1",
    module: "BOOSTR Smart Parking",
    operator: "omni_jr",
    operator_name: OPERATOR.name,
    parking_code: OPERATOR.fixedCode,
    plan_type: "single",
    max_hours: 8,
    stable_url: "/parking/omni-jr/8h"
  });

  await env.DB.prepare(`
    INSERT INTO products (
      id, workspace_id, title, product_type, status, price_amount, currency,
      description, asset_status, fulfillment_type, requires_account,
      allow_guest_checkout, metadata_json, created_at, updated_at
    ) VALUES (?, ?, 'OMNI JR PARKING · 8 HOURS', 'service', 'active', 2500, 'USD', ?, 'ready',
      'manual_service_delivery', 0, 1, ?, ?, ?)
  `).bind(productId, workspaceId, "Tarifa única de parking válida por un máximo de 8 horas desde el pago.", metadata, timestamp, timestamp).run();

  await env.DB.prepare(`
    INSERT INTO payment_links (
      id, workspace_id, product_id, title, status, amount_cents, currency,
      checkout_mode, requires_account, allow_guest_checkout, license_metadata_json,
      disclosure_json, metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, 'OMNI JR PARKING · 8 HOURS', 'active', 2500, 'USD', 'purchase_now', 0, 1, '{}', ?, ?, ?, ?)
  `).bind(
    paymentLinkId,
    workspaceId,
    productId,
    JSON.stringify({
      no_real_payment: false,
      payment_status: "checkout_available",
      note: "Stripe procesa el pago; BOOSTR no guarda datos de tarjeta."
    }),
    metadata,
    timestamp,
    timestamp
  ).run();

  link = { id: paymentLinkId };
  return link;
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;
  const auth = await requireRole(request, env, customOsRoles);
  if (!auth.ok) return auth.response;

  try {
    await ensureSchema(env);
    const workspace = await ensureWorkspace(env, auth);
    if (!workspace?.id) return jsonError("smart_parking_workspace_failed", "No se pudo crear el workspace de OMNI JR.", 500);
    await ensureMembership(env, workspace.id, auth);
    await archiveMisassignedParking(env, workspace.id);
    const paymentLink = await ensureFixedPlan(env, workspace.id);

    return json({
      ok: true,
      module: "BOOSTR Smart Parking",
      operator: OPERATOR.name,
      workspace,
      fixed_payment_link: {
        id: paymentLink.id,
        public_url: `/pay/${paymentLink.id}`,
        stable_url: "/parking/omni-jr/8h"
      }
    }, 201);
  } catch (error) {
    return jsonError("smart_parking_provision_failed", String(error?.message || error), 500);
  }
}
