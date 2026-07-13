import { json, jsonError, now, requireDb, requireRole } from "../../_lib/api.js";
import { customOsRoles } from "../../_lib/custom-os.js";
import { ensureParkingSchema } from "../../_lib/smart-parking.js";

const OPERATOR = {
  slug: "omni-jr-parking",
  name: "OMNI JR Parking",
  type: "partner",
  plans: [
    {
      key: "standard",
      code: "omni_jr_standard_8h",
      title: "OMNI JR PARKING · SEDAN / SPORT / COUPE",
      amount: 2000,
      productType: "service",
      vehicleClass: "sedan_sport_coupe",
      description: "Parking para sedan, sport o coupe. Válido por un máximo de 8 horas desde el pago.",
      stableUrl: "/parking/omni-jr/standard",
      planType: "single",
      checkoutMode: "purchase_now",
      requiresAccount: false,
      fulfillment: "manual_service_delivery"
    },
    {
      key: "large",
      code: "omni_jr_large_8h",
      title: "OMNI JR PARKING · TRUCK / BIG SUV",
      amount: 2500,
      productType: "service",
      vehicleClass: "truck_big_suv",
      description: "Parking para truck, pickup o big SUV. Válido por un máximo de 8 horas desde el pago.",
      stableUrl: "/parking/omni-jr/large",
      planType: "single",
      checkoutMode: "purchase_now",
      requiresAccount: false,
      fulfillment: "manual_service_delivery"
    },
    {
      key: "monthly",
      code: "omni_jr_monthly",
      title: "OMNI JR PARKING · MONTHLY",
      amount: 15000,
      productType: "membership",
      vehicleClass: "monthly",
      description: "Suscripción mensual de parking en OMNI JR PARKING.",
      stableUrl: "/parking/omni-jr/monthly",
      planType: "monthly",
      checkoutMode: "subscription",
      requiresAccount: true,
      fulfillment: "account_access",
      subscriptionInterval: "month"
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
  await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_members_workspace_user ON workspace_members(workspace_id, user_id)").run();
  await ensureParkingSchema(env);
}

async function ensureWorkspace(env, auth) {
  let workspace = await env.DB.prepare("SELECT id, name, slug, type, status FROM workspaces WHERE slug = ? LIMIT 1")
    .bind(OPERATOR.slug).first();
  if (workspace?.id) return workspace;
  const id = crypto.randomUUID();
  const timestamp = now();
  await env.DB.prepare(`
    INSERT OR IGNORE INTO workspaces (id, type, name, slug, owner_email, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
  `).bind(id, OPERATOR.type, OPERATOR.name, OPERATOR.slug, auth.user?.email || null, timestamp, timestamp).run();
  return await env.DB.prepare("SELECT id, name, slug, type, status FROM workspaces WHERE slug = ? LIMIT 1").bind(OPERATOR.slug).first();
}

async function ensureMembership(env, workspaceId, auth) {
  const userId = auth.user?.id;
  if (!userId || userId === "dev-manager") return;
  const timestamp = now();
  const current = await env.DB.prepare("SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ? LIMIT 1")
    .bind(workspaceId, userId).first();
  if (current?.id) {
    await env.DB.prepare("UPDATE workspace_members SET role = 'manager', status = 'active', updated_at = ? WHERE id = ?")
      .bind(timestamp, current.id).run();
    return;
  }
  await env.DB.prepare(`
    INSERT INTO workspace_members (id, workspace_id, user_id, role, status, created_at, updated_at)
    VALUES (?, ?, ?, 'manager', 'active', ?, ?)
  `).bind(crypto.randomUUID(), workspaceId, userId, timestamp, timestamp).run();
}

async function archiveMisassignedParking(env, workspaceId) {
  const codes = ["omni_jr_8h", ...OPERATOR.plans.map((plan) => plan.code)];
  for (const code of codes) {
    try {
      await env.DB.prepare(`UPDATE payment_links SET status = 'archived', updated_at = ? WHERE workspace_id != ? AND json_extract(metadata_json, '$.parking_code') = ?`)
        .bind(now(), workspaceId, code).run();
      await env.DB.prepare(`UPDATE products SET status = 'archived', updated_at = ? WHERE workspace_id != ? AND json_extract(metadata_json, '$.parking_code') = ?`)
        .bind(now(), workspaceId, code).run();
    } catch {}
  }
  try {
    const timestamp = now();
    await env.DB.prepare(`UPDATE payment_links SET status = 'archived', updated_at = ? WHERE workspace_id = ? AND status != 'archived' AND json_extract(metadata_json, '$.parking_code') = 'omni_jr_8h'`)
      .bind(timestamp, workspaceId).run();
    await env.DB.prepare(`UPDATE products SET status = 'archived', updated_at = ? WHERE workspace_id = ? AND status != 'archived' AND json_extract(metadata_json, '$.parking_code') = 'omni_jr_8h'`)
      .bind(timestamp, workspaceId).run();
  } catch {}
}

function planMetadata(plan) {
  return {
    source: "boostr_smart_parking_v3",
    module: "BOOSTR Smart Parking",
    operator: "omni_jr",
    operator_name: OPERATOR.name,
    brand_name: "OMNI JR PARKING",
    brand_logo_url: "/assets/omni-jr/omni-jr-logo-black.svg",
    checkout_theme: "light",
    parking_code: plan.code,
    plan_type: plan.planType,
    vehicle_class: plan.vehicleClass,
    max_hours: plan.planType === "single" ? 8 : null,
    subscription_interval: plan.subscriptionInterval || null,
    stable_url: plan.stableUrl
  };
}

async function ensurePlan(env, workspaceId, plan) {
  const timestamp = now();
  const metadata = JSON.stringify(planMetadata(plan));
  let link = await env.DB.prepare(`
    SELECT payment_links.id, payment_links.product_id
    FROM payment_links
    WHERE payment_links.workspace_id = ?
      AND json_extract(payment_links.metadata_json, '$.parking_code') = ?
    ORDER BY payment_links.updated_at DESC LIMIT 1
  `).bind(workspaceId, plan.code).first();

  if (link?.id) {
    await env.DB.prepare(`
      UPDATE payment_links
      SET title = ?, status = 'active', amount_cents = ?, currency = 'USD', checkout_mode = ?,
          requires_account = ?, allow_guest_checkout = ?, metadata_json = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      plan.title,
      plan.amount,
      plan.checkoutMode,
      plan.requiresAccount ? 1 : 0,
      plan.requiresAccount ? 0 : 1,
      metadata,
      timestamp,
      link.id
    ).run();
    if (link.product_id) {
      await env.DB.prepare(`
        UPDATE products
        SET title = ?, product_type = ?, status = 'active', price_amount = ?, currency = 'USD', description = ?,
            asset_status = 'ready', fulfillment_type = ?, requires_account = ?, allow_guest_checkout = ?,
            metadata_json = ?, updated_at = ?
        WHERE id = ?
      `).bind(
        plan.title,
        plan.productType,
        plan.amount,
        plan.description,
        plan.fulfillment,
        plan.requiresAccount ? 1 : 0,
        plan.requiresAccount ? 0 : 1,
        metadata,
        timestamp,
        link.product_id
      ).run();
    }
    return { id: link.id, product_id: link.product_id };
  }

  const productId = crypto.randomUUID();
  const paymentLinkId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO products (
      id, workspace_id, title, product_type, status, price_amount, currency,
      description, asset_status, fulfillment_type, requires_account,
      allow_guest_checkout, metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'active', ?, 'USD', ?, 'ready', ?, ?, ?, ?, ?, ?)
  `).bind(
    productId,
    workspaceId,
    plan.title,
    plan.productType,
    plan.amount,
    plan.description,
    plan.fulfillment,
    plan.requiresAccount ? 1 : 0,
    plan.requiresAccount ? 0 : 1,
    metadata,
    timestamp,
    timestamp
  ).run();

  await env.DB.prepare(`
    INSERT INTO payment_links (
      id, workspace_id, product_id, title, status, amount_cents, currency,
      checkout_mode, requires_account, allow_guest_checkout, license_metadata_json,
      disclosure_json, metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'active', ?, 'USD', ?, ?, ?, '{}', ?, ?, ?, ?)
  `).bind(
    paymentLinkId,
    workspaceId,
    productId,
    plan.title,
    plan.amount,
    plan.checkoutMode,
    plan.requiresAccount ? 1 : 0,
    plan.requiresAccount ? 0 : 1,
    JSON.stringify({
      no_real_payment: false,
      payment_status: "checkout_available",
      note: "Stripe procesa el pago; BOOSTR no guarda datos de tarjeta."
    }),
    metadata,
    timestamp,
    timestamp
  ).run();
  return { id: paymentLinkId, product_id: productId };
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
    const provisioned = {};
    for (const plan of OPERATOR.plans) provisioned[plan.key] = await ensurePlan(env, workspace.id, plan);

    return json({
      ok: true,
      module: "BOOSTR Smart Parking",
      operator: OPERATOR.name,
      workspace,
      payment_links: {
        standard: { id: provisioned.standard.id, public_url: `/pay/${provisioned.standard.id}`, stable_url: "/parking/omni-jr/standard", amount_cents: 2000 },
        large: { id: provisioned.large.id, public_url: `/pay/${provisioned.large.id}`, stable_url: "/parking/omni-jr/large", amount_cents: 2500 },
        monthly: { id: provisioned.monthly.id, public_url: `/pay/${provisioned.monthly.id}`, stable_url: "/parking/omni-jr/monthly", amount_cents: 15000 }
      },
      selector_url: "/parking/omni-jr/",
      manager_url: "/app/parking/omni-jr/manager/"
    }, 201);
  } catch (error) {
    return jsonError("smart_parking_provision_failed", String(error?.message || error), 500);
  }
}
