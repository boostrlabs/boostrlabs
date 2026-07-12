import { json, jsonError, now, requireDb, requireRole } from "../../_lib/api.js";
import { customOsRoles } from "../../_lib/custom-os.js";

const OPERATOR = {
  slug: "omni-jr-parking",
  name: "OMNI JR Parking",
  type: "partner",
  monthlyCode: "omni_jr_monthly",
  plans: [
    {
      code: "omni_jr_standard_8h",
      title: "OMNI JR PARKING · SEDAN / SPORT / COUPE",
      amount: 2000,
      vehicleClass: "sedan_sport_coupe",
      description: "Parking para sedan, sport o coupe. Válido por un máximo de 8 horas desde el pago.",
      stableUrl: "/parking/omni-jr/standard"
    },
    {
      code: "omni_jr_large_8h",
      title: "OMNI JR PARKING · TRUCK / BIG SUV",
      amount: 2500,
      vehicleClass: "truck_big_suv",
      description: "Parking para truck, pickup o big SUV. Válido por un máximo de 8 horas desde el pago.",
      stableUrl: "/parking/omni-jr/large"
    }
  ]
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
  const codes = ["omni_jr_8h", OPERATOR.monthlyCode, ...OPERATOR.plans.map((plan) => plan.code)];
  for (const code of codes) {
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

  try {
    const timestamp = now();
    await env.DB.prepare(`
      UPDATE payment_links SET status = 'archived', updated_at = ?
      WHERE workspace_id = ? AND status != 'archived'
        AND json_extract(metadata_json, '$.parking_code') = 'omni_jr_8h'
    `).bind(timestamp, workspaceId).run();
    await env.DB.prepare(`
      UPDATE products SET status = 'archived', updated_at = ?
      WHERE workspace_id = ? AND status != 'archived'
        AND json_extract(metadata_json, '$.parking_code') = 'omni_jr_8h'
    `).bind(timestamp, workspaceId).run();
  } catch {}
}

async function ensurePlan(env, workspaceId, plan) {
  let link = await env.DB.prepare(`
    SELECT id FROM payment_links
    WHERE workspace_id = ? AND status = 'active'
      AND json_extract(metadata_json, '$.parking_code') = ?
    ORDER BY updated_at DESC LIMIT 1
  `).bind(workspaceId, plan.code).first();
  if (link?.id) return link;

  const timestamp = now();
  const productId = crypto.randomUUID();
  const paymentLinkId = crypto.randomUUID();
  const metadata = JSON.stringify({
    source: "boostr_smart_parking_v2",
    module: "BOOSTR Smart Parking",
    operator: "omni_jr",
    operator_name: OPERATOR.name,
    brand_name: "OMNI JR PARKING",
    checkout_theme: "light",
    parking_code: plan.code,
    plan_type: "single",
    vehicle_class: plan.vehicleClass,
    max_hours: 8,
    stable_url: plan.stableUrl
  });

  await env.DB.prepare(`
    INSERT INTO products (
      id, workspace_id, title, product_type, status, price_amount, currency,
      description, asset_status, fulfillment_type, requires_account,
      allow_guest_checkout, metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, 'service', 'active', ?, 'USD', ?, 'ready',
      'manual_service_delivery', 0, 1, ?, ?, ?)
  `).bind(productId, workspaceId, plan.title, plan.amount, plan.description, metadata, timestamp, timestamp).run();

  await env.DB.prepare(`
    INSERT INTO payment_links (
      id, workspace_id, product_id, title, status, amount_cents, currency,
      checkout_mode, requires_account, allow_guest_checkout, license_metadata_json,
      disclosure_json, metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'active', ?, 'USD', 'purchase_now', 0, 1, '{}', ?, ?, ?, ?)
  `).bind(
    paymentLinkId,
    workspaceId,
    productId,
    plan.title,
    plan.amount,
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
    const [standardLink, largeLink] = await Promise.all(
      OPERATOR.plans.map((plan) => ensurePlan(env, workspace.id, plan))
    );

    return json({
      ok: true,
      module: "BOOSTR Smart Parking",
      operator: OPERATOR.name,
      workspace,
      payment_links: {
        standard: {
          id: standardLink.id,
          public_url: `/pay/${standardLink.id}`,
          stable_url: "/parking/omni-jr/standard",
          amount_cents: 2000
        },
        large: {
          id: largeLink.id,
          public_url: `/pay/${largeLink.id}`,
          stable_url: "/parking/omni-jr/large",
          amount_cents: 2500
        }
      },
      selector_url: "/parking/omni-jr/"
    }, 201);
  } catch (error) {
    return jsonError("smart_parking_provision_failed", String(error?.message || error), 500);
  }
}