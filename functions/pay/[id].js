function htmlEscapeScriptValue(value) {
  return JSON.stringify(String(value || "")).replace(/</g, "\\u003c");
}

export async function onRequestGet({ params }) {
  const id = String(params?.id || "").trim();
  if (!id) return new Response("Smart Payment Link missing.", { status: 400 });
  const paymentLinkId = htmlEscapeScriptValue(id);

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>BOOSTR Smart Pay</title>
<link rel="icon" href="/assets/icons/09.-b-star-favicon.png">
<script src="https://js.stripe.com/v3/"></script>
<style>
:root{--bg:#020202;--panel:#111312;--ink:#f7f7f5;--muted:rgba(247,247,245,.62);--line:rgba(255,255,255,.14);--gold:#feedb9;--green:#7dff9e;--red:#ff9292;--cyan:#7cecff}*{box-sizing:border-box}html{background:#000}body{margin:0;min-height:100dvh;background:radial-gradient(circle at 78% 0,rgba(254,237,185,.13),transparent 30%),radial-gradient(circle at 10% 92%,rgba(125,255,158,.10),transparent 28%),#020202;color:var(--ink);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}.shell{min-height:100dvh;display:grid;place-items:center;padding:14px}.wrap{width:min(100%,980px);display:grid;grid-template-columns:.92fr 1.08fr;gap:16px}.card{border:1px solid var(--line);background:linear-gradient(145deg,rgba(255,255,255,.105),rgba(255,255,255,.025));border-radius:34px;box-shadow:0 36px 120px rgba(0,0,0,.72);padding:22px}.brand-logo{width:126px;max-height:68px;object-fit:contain}.hero-img{display:none;width:100%;aspect-ratio:1/1;border-radius:24px;object-fit:cover;background:rgba(255,255,255,.05);margin:16px 0}.eyebrow{display:inline-flex;border:1px solid rgba(254,237,185,.30);background:rgba(254,237,185,.07);color:var(--gold);border-radius:999px;padding:8px 11px;font:950 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.15em;text-transform:uppercase}h1{font-family:Arial Black,Arial,sans-serif;font-size:clamp(42px,7vw,76px);line-height:.9;letter-spacing:-.075em;margin:16px 0 10px;overflow-wrap:anywhere}h2{font-family:Arial Black,Arial,sans-serif;font-size:clamp(28px,5vw,44px);letter-spacing:-.045em;margin:16px 0 10px}.lead{color:var(--muted);font-size:15px;line-height:1.5}.price{font-family:Arial Black,Arial,sans-serif;font-size:clamp(54px,8vw,88px);letter-spacing:-.075em;margin:18px 0}.meta{display:grid;gap:9px;margin-top:20px}.meta div{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--line);background:rgba(0,0,0,.24);border-radius:18px;padding:13px;color:var(--muted);font-size:13px}.meta b{color:#fff;text-align:right}.form{display:grid;gap:12px}.field{display:grid;gap:8px;color:rgba(255,255,255,.68);font-size:10px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}.field input{width:100%;border:1px solid var(--line);background:rgba(0,0,0,.34);color:#fff;border-radius:18px;min-height:54px;padding:0 14px;font-size:16px;font-weight:800;outline:0}.field input:focus{border-color:rgba(254,237,185,.55)}.notice{border:1px solid rgba(125,255,158,.22);background:rgba(125,255,158,.06);border-radius:20px;padding:13px;color:rgba(255,255,255,.76);font-size:13px;line-height:1.45}.notice.error{border-color:rgba(255,146,146,.34);background:rgba(255,146,146,.08);color:#ffd2d2}.btn{width:100%;border:0;background:#fff;color:#050505;border-radius:999px;min-height:56px;padding:0 18px;font-size:15px;font-weight:1000;cursor:pointer}.btn:disabled{opacity:.45;cursor:wait}.secondary{border:1px solid var(--line);background:rgba(255,255,255,.06);color:#fff}.status{min-height:20px;color:var(--gold);font-size:13px;font-weight:850;line-height:1.4}.hidden{display:none!important}.payment-shell{display:grid;gap:14px}.payment-element{min-height:180px}.legal{color:var(--muted);font-size:11px;line-height:1.45}.success{border:1px solid rgba(125,255,158,.32);background:rgba(125,255,158,.08);border-radius:22px;padding:18px}.success h2{margin-top:4px}.success p{color:var(--muted);line-height:1.5}.spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(0,0,0,.22);border-top-color:#000;border-radius:50%;animation:spin .75s linear infinite;margin-right:8px;vertical-align:-2px}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:820px){.wrap{grid-template-columns:1fr}.shell{padding:8px}.card{border-radius:28px;padding:18px}h1{font-size:clamp(42px,13vw,68px)}}
</style>
</head>
<body>
<main class="shell">
<section class="wrap">
<aside class="card">
<img class="brand-logo" src="/assets/logos/boostr-logo-nav.png" alt="BOOSTR">
<img id="heroImage" class="hero-img" alt="Producto">
<div style="margin-top:22px"><span class="eyebrow" id="saleBadge">SMART PAY</span></div>
<h1 id="title">Cargando...</h1>
<p class="lead" id="description">Preparando la oferta.</p>
<div class="price" id="price">—</div>
<div class="meta">
<div><span>Negocio</span><b id="workspace">BOOSTR</b></div>
<div><span>Tipo</span><b id="mode">Pago</b></div>
<div><span>Experiencia</span><b>BOOSTR Smart Pay</b></div>
<div><span>Acceso</span><b id="rule">Verificando</b></div>
</div>
</aside>
<section class="card">
<div id="startPanel">
<span class="eyebrow">PAGO SEGURO</span>
<h2 id="actionTitle">Elige cómo pagar.</h2>
<p class="lead" id="actionCopy">Los métodos disponibles aparecerán dentro de BOOSTR según tu dispositivo, país, moneda y elegibilidad.</p>
<form class="form" id="startForm">
<label class="field">Correo<input id="email" type="email" required inputmode="email" autocomplete="email" placeholder="cliente@email.com"></label>
<label class="field hidden" id="bidField">Tu puja<input id="bidAmount" type="number" min="1" step="0.01" inputmode="decimal" placeholder="150.00"></label>
<div class="notice" id="notice">Tus datos sensibles se envían directamente al procesador certificado y no pasan por los servidores de BOOSTR.</div>
<button class="btn" id="startButton" type="submit">Ver métodos de pago</button>
<div class="status" id="startStatus"></div>
</form>
</div>
<div id="paymentPanel" class="payment-shell hidden">
<span class="eyebrow">MÉTODOS DISPONIBLES</span>
<h2>Finaliza tu pago.</h2>
<div id="payment-element" class="payment-element"></div>
<form id="confirmForm">
<button class="btn" id="confirmButton" type="submit" disabled>Confirmar pago</button>
</form>
<div class="status" id="paymentStatus"></div>
<button class="btn secondary" id="backButton" type="button">Cambiar correo</button>
<p class="legal">Algunos métodos pueden mostrar su marca, autenticación o avisos legales obligatorios.</p>
</div>
<div id="resultPanel" class="success hidden">
<span class="eyebrow">RESULTADO</span>
<h2 id="resultTitle">Pago recibido.</h2>
<p id="resultCopy">BOOSTR está verificando la transacción.</p>
</div>
</section>
</section>
</main>
<script>
(function(){
'use strict';
const paymentLinkId=${paymentLinkId};
const params=new URLSearchParams(location.search);
let link=null;
let checkoutSdk=null;
let checkoutActions=null;
let paymentElement=null;
const el=function(id){return document.getElementById(id)};
const money=function(cents,currency){if(cents===null||cents===undefined)return 'Manual';return new Intl.NumberFormat('es-US',{style:'currency',currency:currency||'USD'}).format(Number(cents)/100)};
const label=function(value){return({purchase_now:'Compra inmediata',subscription:'Suscripción',auction:'Subasta',bnpl:'Opciones flexibles'})[value]||value||'Pago'};
const errorText=function(error,fallback){return error&&((error.message)||(error.error))||fallback};
function showStartError(message){el('startStatus').textContent=message;el('notice').classList.add('error')}
function showPaymentError(message){el('paymentStatus').textContent=message}
async function fetchJson(url,options){const response=await fetch(url,options||{});const data=await response.json().catch(function(){return{}});if(!response.ok||data.ok===false){throw new Error(errorText(data,'No se pudo completar la solicitud.'))}return data}
async function verifyReturn(){const sessionId=params.get('session_id');if(!sessionId)return false;try{const data=await fetchJson('/api/public/stripe/session?session_id='+encodeURIComponent(sessionId),{cache:'no-store'});el('startPanel').classList.add('hidden');el('paymentPanel').classList.add('hidden');el('resultPanel').classList.remove('hidden');const paid=data.payment&&data.payment.status==='paid';el('resultTitle').textContent=paid?'Pago confirmado.':'Pago en procesamiento.';el('resultCopy').textContent=paid?'BOOSTR registró correctamente la transacción.':'El método elegido todavía está procesando la transacción.';return true}catch(error){showStartError(errorText(error,'No se pudo verificar el pago.'));return false}}
async function loadOffer(){try{const data=await fetchJson('/api/public/payment-links/'+encodeURIComponent(paymentLinkId),{cache:'no-store'});link=data.payment_link;el('title').textContent=link.title;el('description').textContent=link.product_description||'BOOSTR Smart Pay';el('price').textContent=money(link.amount_cents,link.currency);el('workspace').textContent=link.workspace_name||'BOOSTR Workspace';const sale=link.sale_type||link.checkout_mode||'purchase_now';el('mode').textContent=label(sale);el('saleBadge').textContent=label(sale).toUpperCase();el('rule').textContent=link.requires_account?'Cuenta requerida':'Checkout como invitado';if(link.image_url){el('heroImage').src=link.image_url;el('heroImage').style.display='block'}if(sale==='subscription'){el('actionTitle').textContent='Activa tu suscripción.';el('startButton').textContent='Ver métodos de suscripción'}else if(sale==='bnpl'){el('actionTitle').textContent='Elige una opción flexible.';el('startButton').textContent='Ver opciones disponibles'}else if(sale==='auction'){el('actionTitle').textContent='Envía tu puja.';el('actionCopy').textContent='La oferta quedará registrada para que el vendedor la revise.';el('bidField').classList.remove('hidden');el('bidAmount').min=(Number(link.amount_cents||0)/100).toFixed(2);el('startButton').textContent='Enviar puja';el('notice').textContent=link.auction_end?'Finaliza: '+new Date(link.auction_end).toLocaleString():'El vendedor elegirá la mejor oferta.'}await verifyReturn()}catch(error){el('title').textContent='Link no disponible';el('description').textContent=errorText(error,'Esta oferta está inactiva o no existe.');el('startForm').classList.add('hidden')}}
async function createPaymentForm(email){if(typeof window.Stripe!=='function')throw new Error('El motor seguro de pagos no pudo cargar. Recarga la página.');const data=await fetchJson('/api/public/payment-links/'+encodeURIComponent(link.id)+'/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})});const config=data.checkout||{};if(!config.client_secret||!config.publishable_key)throw new Error('El proveedor no devolvió una sesión válida.');const stripe=window.Stripe(config.publishable_key);const appearance={theme:'night',labels:'floating',variables:{colorPrimary:'#feedb9',colorBackground:'#0b0d0c',colorText:'#f7f7f5',colorDanger:'#ff9292',fontFamily:'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',borderRadius:'16px',spacingUnit:'4px'},rules:{'.Input':{border:'1px solid rgba(255,255,255,.18)',boxShadow:'none'},'.Input:focus':{border:'1px solid rgba(254,237,185,.62)',boxShadow:'none'},'.Tab':{border:'1px solid rgba(255,255,255,.14)',backgroundColor:'rgba(255,255,255,.04)'},'.Tab--selected':{border:'1px solid rgba(254,237,185,.55)',backgroundColor:'rgba(254,237,185,.08)'},'.Label':{color:'rgba(247,247,245,.72)'}}};checkoutSdk=stripe.initCheckoutElementsSdk({clientSecret:Promise.resolve(config.client_secret),elementsOptions:{appearance:appearance}});checkoutSdk.on('change',function(session){el('confirmButton').disabled=!session.canConfirm});paymentElement=checkoutSdk.createPaymentElement({layout:{type:'accordion',defaultCollapsed:false,radios:'always'}});paymentElement.mount('#payment-element');const loaded=await checkoutSdk.loadActions();if(loaded&&loaded.type==='error')throw new Error(loaded.error&&loaded.error.message||'No se pudieron cargar las acciones de pago.');checkoutActions=loaded.actions;el('startPanel').classList.add('hidden');el('paymentPanel').classList.remove('hidden');el('confirmButton').disabled=false}
el('startForm').addEventListener('submit',async function(event){event.preventDefault();const button=el('startButton');button.disabled=true;el('startStatus').textContent='Preparando...';el('notice').classList.remove('error');try{const sale=link.sale_type||link.checkout_mode;if(sale==='auction'){const bidCents=Math.round(Number(el('bidAmount').value)*100);if(!Number.isFinite(bidCents)||bidCents<Number(link.amount_cents||0))throw new Error('La puja debe ser igual o mayor al precio inicial.');await fetchJson('/api/order-reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payment_link_id:link.id,customer_name:el('email').value.split('@')[0],guest_email:el('email').value.trim(),customer_contact:el('email').value.trim(),note:'Puja: '+money(bidCents,link.currency),source:'auction_bid',metadata:{bid_amount_cents:bidCents,sale_type:'auction'}})});el('startPanel').classList.add('hidden');el('resultPanel').classList.remove('hidden');el('resultTitle').textContent='Puja enviada.';el('resultCopy').textContent='El vendedor recibió tu oferta.';return}await createPaymentForm(el('email').value.trim());el('startStatus').textContent=''}catch(error){showStartError(errorText(error,'No se pudo preparar el pago.'));button.disabled=false}});
el('confirmForm').addEventListener('submit',async function(event){event.preventDefault();const button=el('confirmButton');button.disabled=true;button.innerHTML='<span class="spinner"></span>Procesando';el('paymentStatus').textContent='';try{if(!checkoutActions)throw new Error('La sesión de pago no está lista.');const result=await checkoutActions.confirm();if(result&&result.type==='error')throw new Error(result.error&&result.error.message||'No se pudo confirmar el pago.')}catch(error){showPaymentError(errorText(error,'No se pudo confirmar el pago.'));button.textContent='Confirmar pago';button.disabled=false}});
el('backButton').addEventListener('click',function(){if(paymentElement&&typeof paymentElement.unmount==='function')paymentElement.unmount();checkoutSdk=null;checkoutActions=null;paymentElement=null;el('paymentPanel').classList.add('hidden');el('startPanel').classList.remove('hidden');el('startButton').disabled=false;el('startButton').textContent='Ver métodos de pago';el('startStatus').textContent=''});
loadOffer();
})();
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      "pragma": "no-cache",
      "expires": "0",
      "x-robots-tag": "noindex, nofollow"
    }
  });
}
