const PLANS = {
  "8h": {
    code: "omni_jr_8h",
    title: "OMNI JR PARKING · 8 HOURS",
    badge: "TARIFA ÚNICA",
    detail: "$25 · hasta 8 horas"
  },
  monthly: {
    code: "omni_jr_monthly",
    title: "OMNI JR PARKING · MONTHLY",
    badge: "PARKING MENSUAL",
    detail: "Suscripción mensual"
  }
};

function now() {
  return new Date().toISOString();
}

function page(plan, message, actionUrl = "/parking/omni-jr/qr/") {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${plan.title}</title><style>*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:18px;background:radial-gradient(circle at 80% 0,rgba(254,237,185,.14),transparent 30%),#020202;color:#fff;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.card{width:min(100%,560px);border:1px solid rgba(255,255,255,.15);background:linear-gradient(145deg,rgba(255,255,255,.11),rgba(255,255,255,.03));border-radius:32px;padding:24px;box-shadow:0 32px 100px rgba(0,0,0,.7)}.badge{display:inline-flex;border:1px solid rgba(254,237,185,.35);color:#feedb9;border-radius:999px;padding:8px 11px;font-size:10px;font-weight:950;letter-spacing:.14em}.logo{font-size:15px;font-weight:1000;letter-spacing:.13em;margin-bottom:28px}h1{font-size:clamp(42px,12vw,76px);line-height:.9;letter-spacing:-.07em;margin:18px 0 12px}p{color:rgba(255,255,255,.66);line-height:1.5}.detail{font-size:24px;color:#fff;font-weight:950;margin:18px 0}.notice{border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:14px;background:rgba(0,0,0,.25)}a{display:flex;align-items:center;justify-content:center;min-height:54px;margin-top:16px;border-radius:999px;background:#fff;color:#000;text-decoration:none;font-weight:1000}</style></head><body><main class="card"><div class="logo">BOOSTR LABS</div><span class="badge">${plan.badge}</span><h1>OMNI JR<br>PARKING</h1><div class="detail">${plan.detail}</div><div class="notice"><strong>BOOSTR Smart Payment</strong><p>${message}</p></div><a href="${actionUrl}">Continuar</a></main></body></html>`;
}

async function findPaymentLink(env, plan) {
  try {
    const row = await env.DB.prepare(`
      SELECT id
      FROM payment_links
      WHERE status = 'active'
        AND json_extract(metadata_json, '$.parking_code') = ?
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
    `).bind(plan.code).first();
    if (row?.id) return row;
  } catch {}

  try {
    return await env.DB.prepare(`
      SELECT id
      FROM payment_links
      WHERE status = 'active' AND lower(title) = lower(?)
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
    `).bind(plan.title).first();
  } catch {
    return null;
  }
}

async function resolveWorkspace(env) {
  const configured = String(env.OMNI_JR_WORKSPACE_ID || "").trim();
  if (configured) {
    const row = await env.DB.prepare("SELECT id FROM workspaces WHERE id = ? AND status = 'active' LIMIT 1").bind(configured).first();
    if (row?.id) return row.id;
  }

  const preferred = await env.DB.prepare(`
    SELECT id
    FROM workspaces
    WHERE status = 'active'
    ORDER BY
      CASE
        WHEN lower(name) LIKE '%omni%' OR lower(slug) LIKE '%omni%' THEN 0
        WHEN lower(name) LIKE '%boostr%' OR lower(slug) LIKE '%boostr%' THEN 1
        ELSE 2
      END,
      updated_at DESC,
      created_at DESC
    LIMIT 1
  `).first();
  return preferred?.id || null;
}

async function provisionFixedPlan(env) {
  const existing = await findPaymentLink(env, PLANS["8h"]);
  if (existing?.id) return existing;

  const workspaceId = await resolveWorkspace(env);
  if (!workspaceId) return null;

  const timestamp = now();
  const productId = crypto.randomUUID();
  const paymentLinkId = crypto.randomUUID();
  const metadata = JSON.stringify({
    source: "omni_jr_parking_v2",
    parking_code: "omni_jr_8h",
    plan_type: "single",
    max_hours: 8,
    stable_url: "/parking/omni-jr/8h"
  });

  await env.DB.prepare(`
    INSERT INTO products (
      id, workspace_id, title, product_type, status, price_amount, currency,
      description, asset_status, fulfillment_type, requires_account,
      allow_guest_checkout, metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, 'service', 'active', 2500, 'USD', ?, 'ready',
      'manual_service_delivery', 0, 1, ?, ?, ?)
  `).bind(
    productId,
    workspaceId,
    PLANS["8h"].title,
    "Tarifa única de parking válida por un máximo de 8 horas desde el pago.",
    metadata,
    timestamp,
    timestamp
  ).run();

  await env.DB.prepare(`
    INSERT INTO payment_links (
      id, workspace_id, product_id, title, status, amount_cents, currency,
      checkout_mode, requires_account, allow_guest_checkout, license_metadata_json,
      disclosure_json, metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'active', 2500, 'USD', 'purchase_now', 0, 1, '{}', ?, ?, ?, ?)
  `).bind(
    paymentLinkId,
    workspaceId,
    productId,
    PLANS["8h"].title,
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
  const plan = PLANS[key];
  if (!plan) return new Response("Parking plan not found.", { status: 404 });
  if (!env.DB) return new Response(page(plan, "El sistema de pagos no está disponible temporalmente."), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }
  });

  let link = await findPaymentLink(env, plan);
  if (!link?.id && key === "8h") {
    try { link = await provisionFixedPlan(env); } catch (error) { console.error("OMNI JR parking provision failed", error); }
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
    ? "La mensualidad todavía necesita que el manager defina el precio. El QR mensual conservará este mismo enlace cuando se active."
    : "No se pudo activar el cobro automáticamente. Abre el panel administrativo para completar la configuración.";
  const action = key === "monthly" ? "/app/parking/omni-jr/" : "/app/parking/omni-jr/";
  return new Response(page(plan, message, action), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0"
    }
  });
}