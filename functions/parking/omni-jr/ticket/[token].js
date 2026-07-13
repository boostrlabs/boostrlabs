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

function page(session, origin) {
  const status = parkingComputedStatus(session);
  const valid = status === "valid";
  const verifyUrl = `${origin}/app/parking/omni-jr/manager/?token=${encodeURIComponent(session.verification_token)}`;
  const qrUrl = `/api/public/qr?size=900&text=${encodeURIComponent(verifyUrl)}`;
  const expires = session.expires_at ? new Date(session.expires_at).toISOString() : "";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Parking ${esc(session.plate)} · OMNI JR</title><style>
  :root{--bg:#f4f4ef;--card:#fff;--ink:#101010;--muted:#6c6c67;--line:#deded7;--green:#167447;--red:#b93434}*{box-sizing:border-box}body{margin:0;min-height:100dvh;background:linear-gradient(180deg,#fff,var(--bg));color:var(--ink);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{width:min(100%,650px);margin:auto;padding:18px 14px 42px}.logo{display:block;width:132px;height:132px;object-fit:contain;margin:0 auto 10px}.card{background:#fff;border:1px solid var(--line);border-radius:32px;padding:22px;box-shadow:0 28px 90px rgba(0,0,0,.08)}.status{display:inline-flex;border-radius:999px;padding:9px 12px;font-size:11px;font-weight:1000;letter-spacing:.1em;background:${valid ? "#eaf7ef" : "#fdecec"};color:${valid ? "var(--green)" : "var(--red)"}}h1{font-size:clamp(48px,14vw,86px);letter-spacing:-.075em;line-height:.88;margin:18px 0 8px;text-align:center}.sub{text-align:center;color:var(--muted);font-size:14px}.qr{display:block;width:min(100%,330px);aspect-ratio:1;object-fit:contain;margin:20px auto 10px;background:#fff;border:1px solid var(--line);border-radius:24px;padding:12px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.item{border:1px solid var(--line);background:#fafaf7;border-radius:19px;padding:13px}.item span{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:900}.item b{display:block;margin-top:5px;font-size:13px}.foot{text-align:center;color:#858580;font-size:10px;letter-spacing:.1em;text-transform:uppercase;margin-top:18px}@media(max-width:520px){.grid{grid-template-columns:1fr}.card{padding:18px;border-radius:28px}}
  </style></head><body><main class="shell"><img class="logo" src="/assets/omni-jr/omni-jr-logo-black.svg" alt="OMNI JR Parking"><section class="card"><div style="text-align:center"><span class="status">${valid ? "PARKING VÁLIDO" : esc(status.toUpperCase())}</span></div><h1>${esc(session.plate)}</h1><p class="sub">Muestra este QR al manager para verificar tu parking.</p><img class="qr" src="${qrUrl}" alt="QR de verificación OMNI JR"><div class="grid"><div class="item"><span>Vehículo</span><b>${esc(vehicleLabel(session.vehicle_class))}</b></div><div class="item"><span>Plan</span><b>${session.plan_type === "monthly" ? "$150 / mes" : "Hasta 8 horas"}</b></div><div class="item"><span>Inicio</span><b data-date="${esc(session.starts_at)}">${esc(session.starts_at)}</b></div><div class="item"><span>Expira</span><b data-date="${esc(expires)}">${esc(expires || "—")}</b></div></div></section><footer class="foot">OMNI JR PARKING · POWERED BY BOOSTR SMART PARKING</footer></main><script>document.querySelectorAll('[data-date]').forEach(el=>{const v=el.dataset.date;if(v)el.textContent=new Date(v).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})});</script></body></html>`;
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
