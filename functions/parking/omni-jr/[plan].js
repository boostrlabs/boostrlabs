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

function page(plan, message) {
  const qrSheet = "/parking/omni-jr/qr/";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${plan.title}</title><style>*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:18px;background:radial-gradient(circle at 80% 0,rgba(254,237,185,.14),transparent 30%),#020202;color:#fff;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.card{width:min(100%,560px);border:1px solid rgba(255,255,255,.15);background:linear-gradient(145deg,rgba(255,255,255,.11),rgba(255,255,255,.03));border-radius:32px;padding:24px;box-shadow:0 32px 100px rgba(0,0,0,.7)}.badge{display:inline-flex;border:1px solid rgba(254,237,185,.35);color:#feedb9;border-radius:999px;padding:8px 11px;font-size:10px;font-weight:950;letter-spacing:.14em}.logo{font-size:15px;font-weight:1000;letter-spacing:.13em;margin-bottom:28px}h1{font-size:clamp(42px,12vw,76px);line-height:.9;letter-spacing:-.07em;margin:18px 0 12px}p{color:rgba(255,255,255,.66);line-height:1.5}.detail{font-size:24px;color:#fff;font-weight:950;margin:18px 0}.notice{border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:14px;background:rgba(0,0,0,.25)}a{display:flex;align-items:center;justify-content:center;min-height:54px;margin-top:16px;border-radius:999px;background:#fff;color:#000;text-decoration:none;font-weight:1000}</style></head><body><main class="card"><div class="logo">BOOSTR LABS</div><span class="badge">${plan.badge}</span><h1>OMNI JR<br>PARKING</h1><div class="detail">${plan.detail}</div><div class="notice"><strong>Enlace reservado.</strong><p>${message}</p></div><a href="${qrSheet}">Ver los QR de parking</a></main></body></html>`;
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

export async function onRequestGet({ env, params }) {
  const key = String(params?.plan || "").trim().toLowerCase();
  const plan = PLANS[key];
  if (!plan) return new Response("Parking plan not found.", { status: 404 });

  const link = env.DB ? await findPaymentLink(env, plan) : null;
  if (link?.id) {
    return new Response(null, {
      status: 302,
      headers: {
        location: `/pay/${encodeURIComponent(link.id)}`,
        "cache-control": "no-store, no-cache, must-revalidate, max-age=0"
      }
    });
  }

  return new Response(page(plan, key === "monthly"
    ? "La mensualidad todavía necesita que un manager defina el precio. Este mismo QR se activará sin cambiar el enlace."
    : "La tarifa única está preparada para activarse desde el panel OMNI JR Parking. Este mismo QR permanecerá vigente."), {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0"
    }
  });
}
