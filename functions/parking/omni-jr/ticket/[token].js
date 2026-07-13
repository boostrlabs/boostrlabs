import { clean } from "../../../_lib/api.js";
import { ensureParkingSchema, parkingComputedStatus } from "../../../_lib/smart-parking.js";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function vehicleLabel(value) {
  if (value === "sedan_sport_coupe") return "Sedan / Sport / Coupe";
  if (value === "truck_big_suv") return "Truck / Big SUV";
  return value || "Parking mensual";
}

function moneyFor(session) {
  if (session.plan_type === "monthly") return "$150.00 / mes";
  if (session.vehicle_class === "truck_big_suv") return "$25.00";
  return "$20.00";
}

function page(session, origin) {
  const status = parkingComputedStatus(session);
  const valid = status === "valid";
  const verifyUrl = `${origin}/app/parking/omni-jr/manager/?token=${encodeURIComponent(session.verification_token)}`;
  const qrUrl = `/api/public/qr?size=900&text=${encodeURIComponent(verifyUrl)}`;
  const expires = session.expires_at ? new Date(session.expires_at).toISOString() : "";
  const liveCopy = valid
    ? `Parking válido ${session.plan_type === "monthly" ? "durante el período mensual activo" : "hasta la hora indicada"}.`
    : `Este parking figura como ${status}.`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Recibo ${esc(session.plate)} · OMNI JR Parking</title><meta name="theme-color" content="#f7f7f3"><style>
  :root{--bg:#f4f4ef;--card:#fff;--ink:#0d0d0e;--muted:#6c6c67;--line:#deded7;--green:#167447;--red:#b93434;--soft:#f7f7f3}*{box-sizing:border-box}body{margin:0;min-height:100dvh;background:radial-gradient(circle at 84% 4%,rgba(190,163,100,.12),transparent 26%),radial-gradient(circle at 8% 90%,rgba(0,0,0,.045),transparent 30%),linear-gradient(180deg,#fff,var(--bg));color:var(--ink);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body:before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.22;background-image:linear-gradient(rgba(0,0,0,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.025) 1px,transparent 1px);background-size:28px 28px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.7),transparent 86%)}.shell{position:relative;width:min(100%,690px);margin:auto;padding:18px 14px 42px}.top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:16px}.brand{display:flex;align-items:center;gap:12px}.logo{width:78px;height:78px;object-fit:contain}.brand-copy b{display:block;font-size:17px;letter-spacing:-.035em}.brand-copy span{display:block;margin-top:3px;color:var(--muted);font-size:9px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.status{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:10px 12px;font-size:10px;font-weight:1000;letter-spacing:.09em;background:${valid ? "#eaf7ef" : "#fdecec"};color:${valid ? "var(--green)" : "var(--red)"};border:1px solid ${valid ? "#b9dec8" : "#efbcbc"}}.dot{width:8px;height:8px;border-radius:50%;background:currentColor;box-shadow:0 0 0 5px ${valid ? "rgba(22,116,71,.1)" : "rgba(185,52,52,.1)"}}.card{position:relative;overflow:hidden;background:rgba(255,255,255,.94);border:1px solid var(--line);border-radius:34px;padding:24px;box-shadow:0 28px 90px rgba(0,0,0,.09);backdrop-filter:blur(18px)}.card:before{content:"OMNI JR × BOOSTR";position:absolute;right:-31px;top:32px;transform:rotate(90deg);font-size:9px;font-weight:1000;letter-spacing:.16em;color:#b7b7b1}.eyebrow{display:inline-flex;border:1px solid var(--line);background:var(--soft);border-radius:999px;padding:8px 10px;font-size:10px;font-weight:1000;letter-spacing:.13em;text-transform:uppercase}h1{font-size:clamp(48px,12vw,82px);letter-spacing:-.075em;line-height:.88;margin:18px 0 6px}.sub{color:var(--muted);font-size:14px;line-height:1.45;margin:0}.receipt{display:grid;grid-template-columns:1.2fr .8fr;gap:12px;margin-top:20px}.details,.qrbox{border:1px solid var(--line);background:#fff;border-radius:24px;padding:16px}.details{display:grid;gap:9px}.row{display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid #ecece8;padding-bottom:9px}.row:last-child{border-bottom:0;padding-bottom:0}.row span{color:var(--muted);font-size:11px}.row b{font-size:12px;text-align:right}.row strong{font-size:14px}.qrbox{display:grid;align-content:center;text-align:center}.qr{display:block;width:100%;aspect-ratio:1;object-fit:contain;background:#fff;border-radius:18px;padding:5px}.qrbox b{font-size:10px;letter-spacing:.08em;text-transform:uppercase;margin-top:8px}.actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.btn{display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:999px;border:1px solid #111;background:#111;color:#fff;text-decoration:none;font-size:12px;font-weight:1000}.btn.ghost{background:#fff;color:#111;border-color:var(--line)}.live{margin-top:14px;border:1px solid ${valid ? "#b9dec8" : "#efbcbc"};background:${valid ? "#eff9f3" : "#fff3f3"};border-radius:19px;padding:13px;font-size:12px;line-height:1.45;color:${valid ? "var(--green)" : "var(--red)"}}.foot{text-align:center;color:#858580;font-size:10px;letter-spacing:.1em;text-transform:uppercase;margin-top:18px}.powered{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:10px;color:#8b8b86;font-size:10px}.shield{width:16px;height:16px;border:1px solid #aaa;border-radius:50%;display:grid;place-items:center;font-size:9px}@media(max-width:600px){.receipt{grid-template-columns:1fr}.actions{grid-template-columns:1fr}.card{padding:20px;border-radius:29px}.card:before{display:none}.top{align-items:flex-start}.logo{width:68px;height:68px}.status{font-size:9px}}
  </style></head><body><main class="shell"><header class="top"><div class="brand"><img class="logo" src="/assets/omni-jr/omni-jr-logo-black.svg" alt="OMNI JR Parking"><div class="brand-copy"><b>OMNI JR Parking</b><span>Powered by BOOSTR Labs</span></div></div><span class="status"><span class="dot"></span>${valid ? "PARKING ACTIVO" : esc(status.toUpperCase())}</span></header><section class="card"><span class="eyebrow">RECIBO INTERACTIVO</span><h1>Recibo de<br>parking.</h1><p class="sub">Gracias por elegir OMNI JR Parking. Este recibo se actualiza con el estado real de tu parking.</p><div class="receipt"><div class="details"><div class="row"><span>Placa</span><strong>${esc(session.plate)}</strong></div><div class="row"><span>Vehículo</span><b>${esc(vehicleLabel(session.vehicle_class))}</b></div><div class="row"><span>Monto</span><b>${esc(moneyFor(session))}</b></div><div class="row"><span>Entrada</span><b data-date="${esc(session.starts_at)}">${esc(session.starts_at)}</b></div><div class="row"><span>Expira</span><b data-date="${esc(expires)}">${esc(expires || "—")}</b></div><div class="row"><span>Estado</span><b>${valid ? "Activo" : esc(status)}</b></div></div><div class="qrbox"><img class="qr" src="${qrUrl}" alt="QR de verificación OMNI JR"><b>Escanea para verificar</b></div></div><div class="live">${esc(liveCopy)}</div><div class="actions"><a class="btn" href="${esc(verifyUrl)}">Verificar parking →</a><a class="btn ghost" href="/parking/omni-jr/">Nuevo parking</a></div><div class="powered"><span class="shield">✓</span><span>Powered by BOOSTR Labs · estado protegido y verificable</span></div></section><footer class="foot">OMNI JR PARKING · CUSTOM PARKING OS</footer></main><script>document.querySelectorAll('[data-date]').forEach(el=>{const v=el.dataset.date;if(v)el.textContent=new Date(v).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})});</script></body></html>`;
}

export async function onRequestGet({ request, env, params }) {
  const token = clean(params?.token, 160);
  if (!env.DB || !token) return new Response("Parking ticket not found.", { status: 404 });
  await ensureParkingSchema(env);
  const session = await env.DB.prepare("SELECT * FROM parking_sessions WHERE verification_token = ? LIMIT 1").bind(token).first();
  if (!session?.id) return new Response("Parking ticket not found.", { status: 404 });
  return new Response(page(session, new URL(request.url).origin), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }
  });
}