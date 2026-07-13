import { clean, now } from "./api.js";

export const OMNI_OPERATOR = Object.freeze({
  slug: "omni-jr-parking",
  name: "OMNI JR Parking",
  type: "partner"
});

export const OMNI_PLANS = Object.freeze({
  standard: Object.freeze({
    key: "standard",
    code: "omni_jr_standard_8h",
    title: "OMNI JR PARKING · SEDAN / SPORT / COUPE",
    badge: "SEDAN / SPORT / COUPE",
    detail: "$20 · hasta 8 horas",
    amount: 2000,
    productType: "service",
    vehicleClass: "sedan_sport_coupe",
    description: "Parking para sedan, sport o coupe. Válido por un máximo de 8 horas desde el pago.",
    checkoutMode: "purchase_now",
    requiresAccount: false,
    fulfillment: "manual_service_delivery",
    planType: "single",
    subscriptionInterval: null
  }),
  large: Object.freeze({
    key: "large",
    code: "omni_jr_large_8h",
    title: "OMNI JR PARKING · TRUCK / BIG SUV",
    badge: "TRUCK / BIG SUV",
    detail: "$25 · hasta 8 horas",
    amount: 2500,
    productType: "service",
    vehicleClass: "truck_big_suv",
    description: "Parking para truck, pickup o big SUV. Válido por un máximo de 8 horas desde el pago.",
    checkoutMode: "purchase_now",
    requiresAccount: false,
    fulfillment: "manual_service_delivery",
    planType: "single",
    subscriptionInterval: null
  }),
  monthly: Object.freeze({
    key: "monthly",
    code: "omni_jr_monthly",
    title: "OMNI JR PARKING · MONTHLY",
    badge: "PARKING MENSUAL",
    detail: "$150 / mes",
    amount: 15000,
    productType: "membership",
    vehicleClass: "monthly",
    description: "Suscripción mensual de parking en OMNI JR PARKING.",
    checkoutMode: "subscription",
    requiresAccount: true,
    fulfillment: "account_access",
    planType: "monthly",
    subscriptionInterval: "month"
  })
});

const CORE_COLUMNS = Object.freeze({
  workspaces: Object.freeze({
    type: "type TEXT DEFAULT 'partner'",
    name: "name TEXT",
    slug: "slug TEXT",
    owner_email: "owner_email TEXT",
    status: "status TEXT DEFAULT 'active'",
    created_at: "created_at TEXT",
    updated_at: "updated_at TEXT"
  }),
  products: Object.freeze({
    workspace_id: "workspace_id TEXT",
    title: "title TEXT",
    product_type: "product_type TEXT DEFAULT 'service'",
    status: "status TEXT DEFAULT 'draft'",
    price_amount: "price_amount INTEGER",
    currency: "currency TEXT DEFAULT 'USD'",
    description: "description TEXT",
    asset_status: "asset_status TEXT",
    fulfillment_type: "fulfillment_type TEXT",
    requires_account: "requires_account INTEGER DEFAULT 0",
    allow_guest_checkout: "allow_guest_checkout INTEGER DEFAULT 1",
    metadata_json: "metadata_json TEXT",
    created_at: "created_at TEXT",
    updated_at: "updated_at TEXT"
  }),
  payment_links: Object.freeze({
    workspace_id: "workspace_id TEXT",
    product_id: "product_id TEXT",
    title: "title TEXT",
    status: "status TEXT DEFAULT 'draft'",
    amount_cents: "amount_cents INTEGER",
    currency: "currency TEXT DEFAULT 'USD'",
    checkout_mode: "checkout_mode TEXT",
    requires_account: "requires_account INTEGER DEFAULT 0",
    allow_guest_checkout: "allow_guest_checkout INTEGER DEFAULT 1",
    license_metadata_json: "license_metadata_json TEXT",
    disclosure_json: "disclosure_json TEXT",
    metadata_json: "metadata_json TEXT",
    created_at: "created_at TEXT",
    updated_at: "updated_at TEXT"
  })
});

async function tableColumns(env, table) {
  const result = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
  return new Set((result.results || []).map((row) => String(row.name || "")));
}

async function ensureColumns(env, table, definitions) {
  const existing = await tableColumns(env, table);
  for (const [name, definition] of Object.entries(definitions)) {
    if (existing.has(name)) continue;
    await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${definition}`).run();
  }
}

export async function ensureOmniCoreSchema(env) {
  if (!env?.DB) throw new Error("db_binding_missing");

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      type TEXT,
      name TEXT,
      slug TEXT,
      owner_email TEXT,
      status TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      workspace_id TEXT,
      title TEXT,
      product_type TEXT,
      status TEXT,
      price_amount INTEGER,
      currency TEXT,
      description TEXT,
      asset_status TEXT,
      fulfillment_type TEXT,
      requires_account INTEGER,
      allow_guest_checkout INTEGER,
      metadata_json TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS payment_links (
      id TEXT PRIMARY KEY,
      workspace_id TEXT,
      product_id TEXT,
      title TEXT,
      status TEXT,
      amount_cents INTEGER,
      currency TEXT,
      checkout_mode TEXT,
      requires_account INTEGER,
      allow_guest_checkout INTEGER,
      license_metadata_json TEXT,
      disclosure_json TEXT,
      metadata_json TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();

  await ensureColumns(env, "workspaces", CORE_COLUMNS.workspaces);
  await ensureColumns(env, "products", CORE_COLUMNS.products);
  await ensureColumns(env, "payment_links", CORE_COLUMNS.payment_links);

  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_products_workspace ON products(workspace_id)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_payment_links_workspace ON payment_links(workspace_id)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_payment_links_product ON payment_links(product_id)").run();
}

export function omniPlanMetadata(plan) {
  return {
    source: "boostr_smart_parking_v4",
    module: "BOOSTR Smart Parking",
    operator: "omni_jr",
    operator_name: OMNI_OPERATOR.name,
    brand_name: "OMNI JR PARKING",
    brand_logo_url: "/assets/omni-jr/omni-jr-logo-black.svg",
    checkout_theme: "light",
    parking_code: plan.code,
    plan_type: plan.planType,
    vehicle_class: plan.vehicleClass,
    max_hours: plan.planType === "single" ? 8 : null,
    subscription_interval: plan.subscriptionInterval,
    stable_url: `/parking/omni-jr/${plan.key}`
  };
}

async function resolveWorkspace(env) {
  const configured = clean(env.OMNI_JR_WORKSPACE_ID, 160);
  if (configured) {
    const row = await env.DB.prepare("SELECT id, name, slug, status FROM workspaces WHERE id = ? LIMIT 1")
      .bind(configured)
      .first();
    if (row?.id) {
      if (row.status !== "active") {
        await env.DB.prepare("UPDATE workspaces SET status = 'active', updated_at = ? WHERE id = ?")
          .bind(now(), row.id)
          .run();
      }
      return { ...row, status: "active" };
    }
  }

  let workspace = await env.DB.prepare("SELECT id, name, slug, status FROM workspaces WHERE slug = ? ORDER BY updated_at DESC LIMIT 1")
    .bind(OMNI_OPERATOR.slug)
    .first();

  if (workspace?.id) {
    await env.DB.prepare("UPDATE workspaces SET name = ?, type = ?, status = 'active', updated_at = ? WHERE id = ?")
      .bind(OMNI_OPERATOR.name, OMNI_OPERATOR.type, now(), workspace.id)
      .run();
    return { ...workspace, name: OMNI_OPERATOR.name, slug: OMNI_OPERATOR.slug, status: "active" };
  }

  const id = crypto.randomUUID();
  const timestamp = now();
  await env.DB.prepare(`
    INSERT INTO workspaces (id, type, name, slug, owner_email, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, NULL, 'active', ?, ?)
  `).bind(id, OMNI_OPERATOR.type, OMNI_OPERATOR.name, OMNI_OPERATOR.slug, timestamp, timestamp).run();

  return { id, type: OMNI_OPERATOR.type, name: OMNI_OPERATOR.name, slug: OMNI_OPERATOR.slug, status: "active" };
}

async function findPlanLink(env, workspaceId, plan) {
  try {
    const row = await env.DB.prepare(`
      SELECT id, product_id FROM payment_links
      WHERE workspace_id = ? AND json_extract(metadata_json, '$.parking_code') = ?
      ORDER BY updated_at DESC, created_at DESC LIMIT 1
    `).bind(workspaceId, plan.code).first();
    if (row?.id) return row;
  } catch {}

  return env.DB.prepare(`
    SELECT id, product_id FROM payment_links
    WHERE workspace_id = ? AND lower(title) = lower(?)
    ORDER BY updated_at DESC, created_at DESC LIMIT 1
  `).bind(workspaceId, plan.title).first();
}

async function archiveLegacyPlan(env, workspaceId) {
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

async function upsertProduct(env, workspaceId, plan, metadata, productId = "") {
  const timestamp = now();
  const id = clean(productId, 160) || crypto.randomUUID();
  const existing = await env.DB.prepare("SELECT id FROM products WHERE id = ? LIMIT 1").bind(id).first();

  if (existing?.id) {
    await env.DB.prepare(`
      UPDATE products SET workspace_id = ?, title = ?, product_type = ?, status = 'active',
        price_amount = ?, currency = 'USD', description = ?, asset_status = 'ready',
        fulfillment_type = ?, requires_account = ?, allow_guest_checkout = ?, metadata_json = ?, updated_at = ?
      WHERE id = ?
    `).bind(
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
      id
    ).run();
    return id;
  }

  await env.DB.prepare(`
    INSERT INTO products (
      id, workspace_id, title, product_type, status, price_amount, currency,
      description, asset_status, fulfillment_type, requires_account,
      allow_guest_checkout, metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'active', ?, 'USD', ?, 'ready', ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
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
  return id;
}

async function upsertPaymentLink(env, workspaceId, plan, metadata, current = null) {
  const timestamp = now();
  const productId = await upsertProduct(env, workspaceId, plan, metadata, current?.product_id || "");
  const id = current?.id || crypto.randomUUID();
  const disclosure = JSON.stringify({
    no_real_payment: false,
    payment_status: "checkout_available",
    note: "Stripe procesa el pago; BOOSTR no guarda datos de tarjeta."
  });

  if (current?.id) {
    await env.DB.prepare(`
      UPDATE payment_links SET workspace_id = ?, product_id = ?, title = ?, status = 'active',
        amount_cents = ?, currency = 'USD', checkout_mode = ?, requires_account = ?,
        allow_guest_checkout = ?, license_metadata_json = '{}', disclosure_json = ?,
        metadata_json = ?, updated_at = ? WHERE id = ?
    `).bind(
      workspaceId,
      productId,
      plan.title,
      plan.amount,
      plan.checkoutMode,
      plan.requiresAccount ? 1 : 0,
      plan.requiresAccount ? 0 : 1,
      disclosure,
      metadata,
      timestamp,
      id
    ).run();
  } else {
    await env.DB.prepare(`
      INSERT INTO payment_links (
        id, workspace_id, product_id, title, status, amount_cents, currency,
        checkout_mode, requires_account, allow_guest_checkout, license_metadata_json,
        disclosure_json, metadata_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'active', ?, 'USD', ?, ?, ?, '{}', ?, ?, ?, ?)
    `).bind(
      id,
      workspaceId,
      productId,
      plan.title,
      plan.amount,
      plan.checkoutMode,
      plan.requiresAccount ? 1 : 0,
      plan.requiresAccount ? 0 : 1,
      disclosure,
      metadata,
      timestamp,
      timestamp
    ).run();
  }

  return { id, product_id: productId };
}

export function getOmniPlan(value) {
  return OMNI_PLANS[clean(value, 40).toLowerCase()] || null;
}

export async function ensureOmniPlan(env, planKey) {
  const plan = getOmniPlan(planKey);
  if (!plan) throw new Error("parking_plan_not_found");
  await ensureOmniCoreSchema(env);
  const workspace = await resolveWorkspace(env);
  await archiveLegacyPlan(env, workspace.id);
  const current = await findPlanLink(env, workspace.id, plan);
  const metadata = JSON.stringify(omniPlanMetadata(plan));
  const link = await upsertPaymentLink(env, workspace.id, plan, metadata, current);
  return { workspace, plan, link, metadata: omniPlanMetadata(plan) };
}
