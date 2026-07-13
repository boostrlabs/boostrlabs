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

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Recibo ${esc(session.plate)} · OMNI JR Parking</title>
<meta name="theme-color" content="#f7f7f3">
<style>
:root{--bg:#f2f2ee;--card:#fff;--ink:#0b0b0c;--muted:#71726d;--line:#dedfd9;--green:#157447;--red:#b43838;--soft:#f8f8f5;--accent:#b9a166}
*{box-sizing:border-box}body{margin:0;min-height:100dvh;background:radial-gradient(circle at 50% -12%,#fff 0 34%,transparent 62%),linear-gradient(180deg,#f9f9f6 0,#eeeeea 100%);color:var(--ink);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
body:before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.28;background-image:radial-gradient(circle at 12% 82%,transparent 0 24%,rgba(0,0,0,.035) 24.3% 24.55%,transparent 24.8% 100%),linear-gradient(rgba(0,0,0,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.02) 1px,transparent 1px);background-size:660px 660px,34px 34px,34px 34px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.8),transparent 94%)}
button{font:inherit}.shell{position:relative;width:min(100%,720px);margin:auto;padding:16px 12px 40px}.device{background:rgba(255,255,255,.96);border:1px solid #dcddd8;border-radius:38px;padding:20px;box-shadow:0 28px 80px rgba(18,18,16,.11),0 2px 6px rgba(18,18,16,.04);backdrop-filter:blur(18px)}
.top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:20px}.brand{display:flex;align-items:center;gap:12px}.logo{width:72px;height:72px;object-fit:contain}.brand-copy b{display:block;font-size:17px;letter-spacing:-.035em}.brand-copy span{display:block;margin-top:3px;color:var(--muted);font-size:8px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.status{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:10px 12px;font-size:9px;font-weight:1000;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;background:${valid ? "#edf8f1" : "#fdeeee"};color:${valid ? "var(--green)" : "var(--red)"};border:1px solid ${valid ? "#badfc9" : "#efbcbc"}}.dot{width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 0 4px ${valid ? "rgba(21,116,71,.1)" : "rgba(180,56,56,.1)"}}
.hero{display:flex;align-items:flex-end;justify-content:space-between;gap:16px}.eyebrow{display:inline-flex;border:1px solid var(--line);background:var(--soft);border-radius:999px;padding:8px 10px;font-size:9px;font-weight:1000;letter-spacing:.13em;text-transform:uppercase}.hero h1{font-size:clamp(48px,11vw,76px);letter-spacing:-.07em;line-height:.88;margin:14px 0 8px}.sub{color:var(--muted);font-size:14px;line-height:1.45;margin:0;max-width:490px}.live-clock{min-width:116px;border:1px solid var(--line);background:#fafaf7;border-radius:20px;padding:12px;text-align:center}.live-clock span{display:block;color:var(--muted);font-size:8px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.live-clock b{display:block;margin-top:5px;font-size:15px;letter-spacing:-.02em}
.receipt{position:relative;display:grid;grid-template-columns:1.25fr .75fr;gap:0;margin-top:20px;border:1px solid var(--line);background:#fff;border-radius:25px;box-shadow:0 16px 42px rgba(0,0,0,.06)}.receipt:before,.receipt:after{content:"";position:absolute;left:65%;width:18px;height:18px;border-radius:50%;background:#f3f3ef;border:1px solid var(--line);transform:translateX(-50%);z-index:2}.receipt:before{top:-10px}.receipt:after{bottom:-10px}.details{display:grid;gap:0;padding:15px 16px}.row{display:grid;grid-template-columns:24px 1fr auto;align-items:center;gap:9px;border-bottom:1px solid #ecece8;padding:10px 0}.row:last-child{border-bottom:0}.icon{display:grid;place-items:center;width:22px;height:22px;border:1px solid #dedfd9;border-radius:7px;background:#fafaf7;font-size:10px;font-weight:1000}.row span{color:var(--muted);font-size:10px}.row b,.row strong{font-size:11px;text-align:right}.row strong{font-size:14px}.state-value{color:${valid ? "var(--green)" : "var(--red)"}}
.qrbox{display:grid;align-content:center;justify-items:center;text-align:center;border-left:1px dashed #d9dad5;padding:14px}.qrbox small{font-size:8px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase}.qr{display:block;width:100%;max-width:190px;aspect-ratio:1;object-fit:contain;background:#fff;border:1px solid #e3e4df;border-radius:16px;padding:8px;margin:8px 0}.token{font:800 8px/1.3 ui-monospace,Menlo,monospace;color:#777873;word-break:break-all}
.live{margin-top:14px;border:1px solid ${valid ? "#badfc9" : "#efbcbc"};background:${valid ? "#edf8f1" : "#fff1f1"};border-radius:18px;padding:13px;color:${valid ? "var(--green)" : "var(--red)"};font-size:12px;line-height:1.45}.live b{display:block;margin-bottom:4px;font-size:10px;letter-spacing:.08em;text-transform:uppercase}.countdown{font-weight:950}
.actions{display:grid;grid-template-columns:1.2fr .8fr;gap:9px;margin-top:14px}.btn{display:flex;align-items:center;justify-content:center;gap:8px;min-height:54px;border-radius:999px;border:1px solid #111;background:#111;color:#fff;text-decoration:none;font-size:12px;font-weight:1000}.btn.ghost{background:#fff;color:#111;border-color:var(--line)}.btn:focus-visible{outline:3px solid rgba(0,0,0,.18);outline-offset:2px}.powered{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:16px;color:#858681;font-size:9px}.shield{width:17px;height:17px;border:1px solid #aaa;border-radius:50%;display:grid;place-items:center;font-size:9px}.foot{text-align:center;color:#858681;font-size:9px;letter-spacing:.1em;text-transform:uppercase;margin-top:16px}
@media(max-width:620px){.device{border-radius:30px;padding:17px}.top{align-items:flex-start}.logo{width:64px;height:64px}.brand-copy b{font-size:15px}.status{font-size:8px;padding:9px}.hero{display:block}.live-clock{display:none}.receipt{grid-template-columns:1fr}.receipt:before,.receipt:after{display:none}.qrbox{border-left:0;border-top:1px dashed #d9dad5}.qr{max-width:190px}.actions{grid-template-columns:1fr}.row{grid-template-columns:24px 1fr auto}}
</style>
</head>
<body>
<main class="shell">
  <section class="device">
    <header class="top">
      <div class="brand"><img class="logo" src="/assets/omni-jr/omni-jr-logo-black.svg" alt="OMNI JR Parking"><div class="brand-copy"><b>OMNI JR Parking</b><span>Powered by BOOSTR Labs</span></div></div>
      <span class="status" id="statusPill"><span class="dot"></span><span id="statusLabel">${valid ? "PARKING ACTIVO" : esc(status.toUpperCase())}</span></span>
    </header>

    <section class="hero">
      <div><span class="eyebrow">RECIBO INTERACTIVO</span><h1>Recibo de<br>parking.</h1><p class="sub">Gracias por elegir OMNI JR Parking. Este recibo está conectado al estado real de tu parking.</p></div>
      <div class="live-clock"><span>Ahora</span><b id="clock">--:--</b></div>
    </section>

    <section class="receipt">
      <div class="details">
        <div class="row"><i class="icon">P</i><span>Placa</span><strong>${esc(session.plate)}</strong></div>
        <div class="row"><i class="icon">▰</i><span>Tipo de vehículo</span><b>${esc(vehicleLabel(session.vehicle_class))}</b></div>
        <div class="row"><i class="icon">$</i><span>Monto pagado</span><b>${esc(moneyFor(session))}</b></div>
        <div class="row"><i class="icon">↗</i><span>Entrada</span><b data-date="${esc(session.starts_at)}">${esc(session.starts_at)}</b></div>
        <div class="row"><i class="icon">◷</i><span>Expira</span><b data-date="${esc(expires)}">${esc(expires || "—")}</b></div>
        <div class="row"><i class="icon">✓</i><span>Estado</span><b class="state-value" id="stateValue">${valid ? "Activo" : esc(status)}</b></div>
      </div>
      <div class="qrbox"><small>OMNI JR PARKING</small><img class="qr" src="${qrUrl}" alt="QR de verificación OMNI JR"><div class="token">${esc(session.verification_token.slice(0, 16).toUpperCase())}</div></div>
    </section>

    <div class="live"><b>Estado en vivo</b><span id="liveMessage">${esc(liveCopy)}</span> <span class="countdown" id="countdown"></span></div>

    <div class="actions"><a class="btn" href="${esc(verifyUrl)}">▦ Verificar parking →</a><a class="btn ghost" href="/parking/omni-jr/">Nuevo parking</a></div>
    <div class="powered"><span class="shield">✓</span><span>Powered by BOOSTR Labs · recibo vivo, protegido y verificable</span></div>
  </section>
  <footer class="foot">OMNI JR PARKING · CUSTOM PARKING OS</footer>
</main>
<script>
const expiresAt=${JSON.stringify(expires)};
const initiallyValid=${JSON.stringify(valid)};
const statusPill=document.getElementById('statusPill');
const statusLabel=document.getElementById('statusLabel');
const stateValue=document.getElementById('stateValue');
const liveMessage=document.getElementById('liveMessage');
const countdown=document.getElementById('countdown');
const clock=document.getElementById('clock');

document.querySelectorAll('[data-date]').forEach(el=>{const value=el.dataset.date;if(value)el.textContent=new Date(value).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})});

function updateClock(){clock.textContent=new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}
function updateStatus(){
  if(!expiresAt||!initiallyValid){countdown.textContent='';return}
  const remaining=new Date(expiresAt).getTime()-Date.now();
  if(remaining<=0){
    statusPill.style.background='#fdeeee';statusPill.style.color='#b43838';statusPill.style.borderColor='#efbcbc';
    statusLabel.textContent='PARKING EXPIRADO';stateValue.textContent='Expirado';stateValue.style.color='#b43838';
    liveMessage.textContent='Este parking ha expirado.';countdown.textContent='';return;
  }
  const hours=Math.floor(remaining/3600000);
  const minutes=Math.max(0,Math.floor((remaining%3600000)/60000));
  countdown.textContent=hours?` · ${hours}h ${minutes}m restantes`:` · ${minutes}m restantes`;
}
updateClock();updateStatus();setInterval(updateClock,30000);setInterval(updateStatus,30000);
</script>
</body>
</html>`;
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
