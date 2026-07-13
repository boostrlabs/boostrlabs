import { ensureOmniPlan, getOmniPlan } from "../../_lib/omni-parking.js";

function page(plan, message, actionUrl = "/parking/omni-jr/") {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#f4f4ef"><title>${plan.title}</title><style>*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:18px;background:linear-gradient(180deg,#fff,#f2f2ed);color:#101010;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.card{width:min(100%,560px);border:1px solid #ddd;background:#fff;border-radius:32px;padding:24px;box-shadow:0 32px 100px rgba(0,0,0,.1)}.logo{display:block;width:132px;height:132px;object-fit:contain;margin:0 auto 10px}.badge{display:inline-flex;border:1px solid #d8d8d2;background:#f1f1ec;color:#111;border-radius:999px;padding:8px 11px;font-size:10px;font-weight:950;letter-spacing:.14em}h1{font-size:clamp(42px,12vw,76px);line-height:.9;letter-spacing:-.07em;margin:18px 0 12px}.detail{font-size:28px;color:#111;font-weight:950;margin:18px 0}.notice{border:1px solid #ddd;border-radius:20px;padding:14px;background:#fafaf7;color:#686868;line-height:1.5}a{display:flex;align-items:center;justify-content:center;min-height:54px;margin-top:16px;border-radius:999px;background:#111;color:#fff;text-decoration:none;font-weight:1000}.powered{margin-top:18px;color:#8a8a84;font-size:10px;letter-spacing:.12em;text-align:center}</style></head><body><main class="card"><img class="logo" src="/assets/omni-jr/omni-jr-logo-black.svg" alt="OMNI JR Parking"><span class="badge">${plan.badge}</span><h1>Parking<br>inteligente.</h1><div class="detail">${plan.detail}</div><div class="notice">${message}</div><a href="${actionUrl}">Reintentar</a><div class="powered">POWERED BY BOOSTR LABS</div></main></body></html>`;
}

function redirect(location) {
  return new Response(null, {
    status: 302,
    headers: {
      location,
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      pragma: "no-cache",
      expires: "0",
      "x-robots-tag": "noindex, nofollow"
    }
  });
}

export async function onRequestGet({ env, params }) {
  const key = String(params?.plan || "").trim().toLowerCase();
  if (key === "8h") return redirect("/parking/omni-jr/");

  const plan = getOmniPlan(key);
  if (!plan) return new Response("Parking plan not found.", { status: 404 });
  if (!env?.DB) {
    return new Response(page(plan, "El sistema de pagos no está disponible temporalmente."), {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }
    });
  }

  try {
    const provisioned = await ensureOmniPlan(env, key);
    const target = `/omni-jr/checkout/?id=${encodeURIComponent(provisioned.link.id)}&plan=${encodeURIComponent(key)}`;
    return redirect(target);
  } catch (error) {
    console.error("OMNI JR stable plan route failed", { plan: key, error: String(error?.message || error) });
    return new Response(page(plan, "No se pudo preparar el checkout. El sistema intentará reparar el enlace al reintentar.", `/parking/omni-jr/${encodeURIComponent(key)}`), {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store, no-cache, must-revalidate, max-age=0" }
    });
  }
}
