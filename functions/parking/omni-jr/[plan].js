const PLANS = {
  standard: {
    code: "omni_jr_standard_8h",
    title: "OMNI JR PARKING · SEDAN / SPORT / COUPE",
    badge: "STANDARD VEHICLE",
    detail: "$20 · hasta 8 horas",
    amount: 2000,
    vehicleClass: "sedan_sport_coupe",
    description: "Parking para sedan, sport o coupe. Válido por un máximo de 8 horas desde el pago."
  },
  large: {
    code: "omni_jr_large_8h",
    title: "OMNI JR PARKING · TRUCK / BIG SUV",
    badge: "LARGE VEHICLE",
    detail: "$25 · hasta 8 horas",
    amount: 2500,
    vehicleClass: "truck_big_suv",
    description: "Parking para truck, pickup o big SUV. Válido por un máximo de 8 horas desde el pago."
  },
  monthly: {
    code: "omni_jr_monthly",
    title: "OMNI JR PARKING · MONTHLY",
    badge: "PARKING MENSUAL",
    detail: "Suscripción mensual"
  }
};

const now = () => new Date().toISOString();

function page(plan, message, actionUrl = "/app/parking/?operator=omni-jr") {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${plan.title}</title><style>*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:18px;background:linear-gradient(180deg,#fff,#f2f2ed);color:#101010;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.card{width:min(100%,560px);border:1px solid #ddd;background:#fff;border-radius:32px;padding:24px;box-shadow:0 32px 100px rgba(0,0,0,.1)}.badge{display:inline-flex;border:1px solid #d8d8d2;background:#f1f1ec;color:#111;border-radius:999px;padding:8px 11px;font-size:10px;font-weight:950;letter-spacing:.14em}.logo{font-size:12px;font-weight:1000;letter-spacing:.14em;margin-bottom:28px;color:#666}h1{font-size:clamp(42px,12vw,76px);line-height:.9;letter-spacing:-.07em;margin:18px 0 12px}p{color:#686868;line-height:1.5}.detail{font-size:24px;color:#111;font-weight:950;margin:18px 0}.notice{border:1px solid #ddd;border-radius:20px;padding:14px;background:#fafaf7}a{display:flex;align-items:center;justify-content:center;min-height:54px;margin-top:16px;border-radius:999px;background:#111;color:#fff;text-decoration:none;font-weight:1000}.powered{margin-top:18px;color:#8a8a84;font-size:10px;letter-spacing:.12em;text-align:center}</style></head><body><main class="card"><div class="logo">OMNI JR PARKING</div><span class="badge">${plan.badge}</span><h1>Parking<br>inteligente.</h1><div class="detail">${plan.detail}</div><div class="notice"><strong>BOOSTR Smart Payment</strong><p>${message}</p></div><a href="${actionUrl}">Continuar</a><div class="powered">POWERED BY BOOSTR SMART PARKING</div></main></body></html>`;
}

async function resolveWorkspace(env) {
  const configured = String(env.OMNI_JR_WORKSPACE_ID || "").trim();
  if (configured) {
    const row = await env.DB.prepare("SELECT id FROM workspaces WHERE id = ? AND status = 'active' LIMIT 1").bind(configured).first();
    if (row?.id) return row.id;
  }

  let workspace = await env.DB.prepare(
    "SELECT id FROM workspaces WHERE slug = 'omni-jr-parking' AND status = 'active' LIMIT 1"
  ).first();
  if (workspace?.id) return workspace.id;

  const id = crypto.randomUUID();
  const timestamp = now();
  await env.DB.prepare(`
    INSERT OR IGNORE INTO workspaces (id, type, name, slug, owner_email, status, created_at, updated_at)
    VALUES (?, 'partner', 'OMNI JR Parking', 'omni-jr-parking', NULL, 'active', ?, ?)
  `).bind(id, timestamp, timestamp).run();

  workspace = await env.DB.prepare(
    "SELECT id FROM workspaces WHERE slug = 'omni-jr-parking' AND status = 'active' LIMIT 1"
  ).first();
  return workspace?.id || null;
}

async function findPaymentLink(env, plan, workspaceId) {
  try {
    const row = await env.DB.prepare(`
      SELECT id
      FROM payment_links
      WHERE workspace_id = ?
        AND status = 'active'
        AND json_extract(metadata_json, '$.parking_code') = ?
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
    `).bind(workspaceId, plan.code).first();
    if (row?.id) return row;
  } catch {}

  try {
    return await env.DB.prepare(`
      SELECT id
      FROM payment_links
      WHERE workspace_id = ? AND status = 'active' AND lower(title) = lower(?)
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
    `).bind(workspaceId, plan.title).first();
  } catch {
    return null;
  }
}

async function archiveLegacyFixedPlan(env, workspaceId) {
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

async function provisionPlan(env, workspaceId, plan) {
  const existing = await findPaymentLink(env, plan, workspaceId);
  if (existing?.id) return existing;

  await archiveLegacyFixedPlan(env, workspaceId);
  const timestamp = now();
  const productId = crypto.randomUUID();
  const paymentLinkId = crypto.randomUUID();
  const metadata = JSON.stringify({
    source: "boostr_smart_parking_v2",
    module: "BOOSTR Smart Parking",
    operator: "omni_jr",
    operator_name: "OMNI JR Parking",
    brand_name: "OMNI JR PARKING",
    checkout_theme: "light",
    parking_code: plan.code,
    plan_type: "single",
    vehicle_class: plan.vehicleClass,
    max_hours: 8,
    stable_url: `/parking/omni-jr/${plan === PLANS.standard ? "standard" : "large"}`
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

  return { id: paymentLinkId };
}

export async function onRequestGet({ env, params }) {
  const key = String(params?.plan || "").trim().toLowerCase();
  if (key === "8h") {
    return new Response(null, { status: 302, headers: { location: "/parking/omni-jr/", "cache-control": "no-store" } });
  }

  const plan = PLANS[key];
  if (!plan) return new Response("Parking plan not found.", { status: 404 });
  if (!env.DB) return new Response(page(plan, "El sistema de pagos no está disponible temporalmente."), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }
  });

  let workspaceId = null;
  try { workspaceId = await resolveWorkspace(env); } catch (error) { console.error("Smart Parking workspace failed", error); }
  if (!workspaceId) return new Response(page(plan, "OMNI JR todavía necesita un workspace activo dentro de BOOSTR Smart Parking."), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }
  });

  let link = await findPaymentLink(env, plan, workspaceId);
  if (!link?.id && (key === "standard" || key === "large")) {
    try { link = await provisionPlan(env, workspaceId, plan); } catch (error) { console.error("OMNI JR parking provision failed", error); }
  }

  if (link?.id) {
    return new Response(null, {
      status: 302,
      headers: {
        location: `/pay/${encodeURIComponent(link.id)}`,
        "cache-control": "no-store, no-cache, must-revalidate, max-age=0"
      }
    });
  }

  const message = key === "monthly"
    ? "La mensualidad todavía necesita que el manager defina el precio. El QR conservará este mismo enlace cuando se active."
    : "No se pudo activar el cobro automáticamente. Abre BOOSTR Smart Parking para completar la configuración.";
  return new Response(page(plan, message), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0"
    }
  });
}