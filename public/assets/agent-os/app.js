
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const api=async(path,opt={})=>{
  const r=await fetch(path.replace("/api/", "/api/agent-os/"),{credentials:"include",headers:{"Content-Type":"application/json",...(opt.headers||{})},...opt});
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error||"Request failed");
  return data;
};
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Number(n||0));
const route=()=>location.hash.replace(/^#/,"")||"/";
let me=null, settings={}, catalog=[], scripts=[], flyers=[];

async function publicData(){
  const [s,c,sc,f]=await Promise.all([
    api("/api/public/settings").catch(()=>({})),
    api("/api/public/catalog").catch(()=>[]),
    api("/api/public/scripts").catch(()=>[]),
    api("/api/public/flyers").catch(()=>[])
  ]);
  settings=s;catalog=c;scripts=sc;flyers=f;
  $("#footerSocial").textContent=[s.instagram&&"Instagram",s.tiktok&&"TikTok",s.x&&"X",s.facebook&&"Facebook"].filter(Boolean).join(" · ");
}
function show(id){$$(".route").forEach(x=>x.classList.remove("active"));$(id).classList.add("active")}
function socials(){
  const entries=[["Instagram",settings.instagram],["TikTok",settings.tiktok],["X",settings.x],["Facebook",settings.facebook],["WhatsApp",settings.whatsapp],["Email",settings.email&&`mailto:${settings.email}`]];
  return entries.filter(x=>x[1]).map(([n,u])=>`<a class="social" target="_blank" rel="noopener" href="${esc(u)}">${n}</a>`).join("")||`<span class="pill">Contacto: boostrlabs@gmail.com</span>`;
}

function landing(){
  show("#landing");
  $("#landing").innerHTML=`
  <main class="wrap">
    <section class="hero" id="home"><div class="hero-content">
      <div class="eyebrow">Digital infrastructure for real businesses</div>
      <h1>Tu negocio.<br>Mejor <span style="color:var(--red)">conectado.</span></h1>
      <p class="lead">Websites, apps, CRM, automatización, sistemas y equipos digitales para vender más, operar mejor y darle a tu empresa una estructura que realmente pueda crecer.</p>
      <div class="actions"><a class="btn dark" href="#/#services">Ver soluciones</a><a class="btn light" href="#/work">Trabaja con nosotros</a></div>
    </div></section>

    <section id="services" class="section"><div class="section-head"><div class="eyebrow">Qué hacemos</div><h2>Soluciones que un negocio entiende.</h2></div>
      <div class="grid">
        <article class="card"><div class="eyebrow">Web</div><h3>Websites</h3><p>Tu propio dominio, una presencia profesional y una estructura pensada para convertir visitas en clientes.</p></article>
        <article class="card"><div class="eyebrow">Systems</div><h3>Apps & Business OS</h3><p>Herramientas propias para manejar clientes, operaciones, bookings, pagos y procesos.</p></article>
        <article class="card"><div class="eyebrow">Sales</div><h3>CRM & Automation</h3><p>Seguimiento, bases de datos, mensajes automáticos y pipelines para perder menos oportunidades.</p></article>
        <article class="card"><div class="eyebrow">People</div><h3>Digital Team</h3><p>Asistentes y agentes virtuales reales con talento LATAM para soporte, ventas y operación.</p></article>
        <article class="card"><div class="eyebrow">AI + Human</div><h3>AI Chatbots</h3><p>Automatización conversacional supervisada por personas para mantener calidad y control.</p></article>
        <article class="card"><div class="eyebrow">Custom</div><h3>Sistemas a medida</h3><p>Parking, automotive, ecommerce y necesidades específicas que un software genérico no resuelve.</p></article>
      </div>
    </section>

    <section id="pricing" class="section"><div class="section-head"><div class="eyebrow">Precios</div><h2>Empieza simple. Escala cuando lo necesites.</h2></div>
      <div class="grid">${catalog.filter(x=>x.price).slice(0,3).map(x=>`<article class="card"><div class="eyebrow">${esc(x.name)}</div><div class="price">${money(x.price)}${x.price===800?"+":""}</div><p>${esc(x.description)}</p><a href="#/#contact" class="btn light">Quiero esta opción</a></article>`).join("")}</div>
    </section>

    <section class="section"><div class="card full"><h3>Tu proyecto, por escrito. Tu pago, con Stripe.</h3><p>Antes de pagar recibes un enlace con tu invoice, el alcance del trabajo y los términos acordados. Realizas el pago en la página segura de Stripe.</p></div></section><section id="recruitment" class="section"><div class="card full work" style="padding:42px">
      <div class="eyebrow" style="color:#aaa">BOOSTR Agents · LATAM</div><h2>¿Sabes hablar con gente y cerrar?</h2>
      <p class="lead">Te damos producto, contenido, entrenamiento y hasta leads. Tú conversas con negocios, agendas, cierras y ganas comisión en USD.</p>
      <div class="pills"><span class="pill green">Horario flexible</span><span class="pill">Sin pagar para entrar</span><span class="pill">Leads BOOSTR</span><span class="pill">LATAM</span></div>
      <div class="actions"><a class="btn red" href="#/work">Conoce el programa</a><a class="btn light" href="#/agent/login">Ya soy agente</a></div>
    </div></section>

    <section id="contact" class="section"><div class="grid">
      <div class="card half"><div class="eyebrow">Contacto</div><h2 style="font-size:46px">Cuéntanos qué necesita tu negocio.</h2><form id="contactForm" class="formgrid">
        <label>Nombre<input name="name" required></label><label>Negocio<input name="business_name" required></label>
        <label>Email<input name="email" type="email"></label><label>WhatsApp<input name="whatsapp"></label>
        <label style="grid-column:1/-1">¿Qué quieres mejorar?<textarea name="message" required></textarea></label>
        <button class="btn dark" style="grid-column:1/-1">Enviar</button>
      </form><div id="contactMsg"></div></div>
      <div class="card half"><div class="eyebrow">Síguenos</div><h2 style="font-size:46px">BOOSTR en todas partes.</h2><p>Productos, demos, casos de uso, oportunidades y nuevas soluciones.</p><div class="socials">${socials()}</div></div>
    </div></section>
  </main>`;
  $("#contactForm").onsubmit=async e=>{
    e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
    try{await api("/api/public/contact",{method:"POST",body:JSON.stringify(f)});$("#contactMsg").innerHTML=`<div class="msg ok">Recibido. BOOSTR puede contactarte con la información que enviaste.</div>`;e.target.reset()}catch(err){$("#contactMsg").innerHTML=`<div class="msg err">${esc(err.message)}</div>`}
  };
  const anchor=route().split("#")[1]; if(anchor) setTimeout(()=>document.getElementById(anchor)?.scrollIntoView(),50);
}
function work(){
  show("#work"); $("#work").innerHTML=`<main class="wrap">
    <section class="hero" style="min-height:590px"><div class="hero-content"><div class="eyebrow">Trabaja con BOOSTR Labs</div><h1>Convierte conversaciones<br>en <span style="color:var(--green)">comisiones.</span></h1>
      <p class="lead">Trabajo remoto para personas en LATAM con buena comunicación y ganas de aprender. BOOSTR te da productos fáciles de presentar, flyers, mensajes, soporte y oportunidades reales.</p>
      <div class="pills"><span class="pill green">Comisiones en USD</span><span class="pill">Horario flexible</span><span class="pill">Inglés recomendado</span><span class="pill">No pagas nada para entrar</span></div>
      <div class="actions"><a class="btn dark" href="#/agent/apply">Aplicar ahora</a><a class="btn light" href="#/agent/login">Iniciar sesión</a></div>
    </div></section>
    <section class="section"><div class="grid">
      <div class="card"><div class="eyebrow">1</div><h3>Aprende el catálogo</h3><p>Precios, productos, demos, scripts y cómo detectar una oportunidad.</p></div>
      <div class="card"><div class="eyebrow">2</div><h3>Habla con negocios</h3><p>Instagram, WhatsApp, Facebook, llamada o el canal que tenga más sentido.</p></div>
      <div class="card"><div class="eyebrow">3</div><h3>Cierra y gana</h3><p>Lead propio o lead BOOSTR. Si el cliente compra, ganas la comisión correspondiente.</p></div>
      <div class="card half"><div class="eyebrow">BOOSTR Lead Pool</div><h2 style="font-size:44px">También te damos leads.</h2><p>BOOSTR agrega negocios fríos, tibios y calientes con contexto para contactarlos. Cada agente puede tomar hasta <b>10 leads BOOSTR por semana</b>. Tus propios leads son ilimitados.</p></div>
      <div class="card half"><div class="eyebrow">Cobro</div><h2 style="font-size:44px;color:var(--green)">Tu comisión.</h2><p>BOOSTR paga tu comisión el mismo día que se procesa el pago del cliente. Puedes recibirla por Zelle, PayPal, crypto o moneda local según tu país. Incluso puedes cobrar el día que empiezas.</p></div>
    </div></section>
  </main>`;
}
function apply(){
  show("#apply");$("#apply").innerHTML=`<div class="auth-shell"><div class="auth-card">
  <div class="eyebrow">Aplicación BOOSTR Agent</div><h2 style="font-size:52px">Buscamos potencial.<br>Nosotros entrenamos.</h2><p class="lead">No hay pruebas para aplicar. Queremos conocerte y, si vemos potencial, te contactamos para una entrevista.</p>
  <form id="applyForm" class="formgrid">
    <label>Nombre completo<input name="name" required></label><label>País<input name="country" required></label>
    <label>Ciudad<input name="city" required></label><label>WhatsApp<input name="whatsapp" required></label>
    <label>Instagram<input name="instagram"></label><label>TikTok<input name="tiktok"></label>
    <label>Email<input name="email" type="email" required></label>
    <label>Inglés<select name="english_level"><option>No</option><option>Básico</option><option>Intermedio</option><option>Avanzado</option><option>Fluido</option></select></label>
    <label>Experiencia en ventas (opcional)<select name="sales_experience"><option>Ninguna</option><option>Algo</option><option>Frecuente</option></select></label>
    <label>Atención al cliente (opcional)<select name="service_experience"><option>Ninguna</option><option>Algo</option><option>Frecuente</option></select></label>
    <label>Disponibilidad semanal<input name="availability" placeholder="Ej. 10-15 horas"></label>
    <label>Dispositivos<select name="devices"><option>Teléfono</option><option>Teléfono + computadora</option><option>Computadora</option></select></label>
    <button class="btn dark" style="grid-column:1/-1">Enviar aplicación</button>
  </form><div id="applyMsg"></div></div></div>`;
  $("#applyForm").onsubmit=async e=>{e.preventDefault();try{await api("/api/public/applications",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});$("#applyMsg").innerHTML=`<div class="msg ok">Aplicación recibida. Si avanzas, BOOSTR te contactará para la entrevista.</div>`;e.target.reset()}catch(err){$("#applyMsg").innerHTML=`<div class="msg err">${esc(err.message)}</div>`}};
}
function login(){
  show("#login");$("#login").innerHTML=`<div class="auth-shell"><div class="auth-grid">
    <div class="auth-card"><div class="eyebrow">BOOSTR Agent Login</div><h2 style="font-size:48px">Bienvenido de vuelta.</h2>
      <div class="pills"><button class="btn light" id="passMode">Contraseña</button><button class="btn light" id="pinMode">PIN de 6 dígitos</button></div>
      <form id="loginForm" style="margin-top:20px"><label>Email<input name="email" type="email" required></label><label id="secretLabel">Contraseña<input name="secret" type="password" required></label><button class="btn dark">Entrar</button></form><div id="loginMsg"></div>
    </div>
    <div class="auth-card"><div class="eyebrow">¿Quieres trabajar con nosotros?</div><h2 style="font-size:48px">Primero aplica.</h2><p>Las cuentas de agente son por invitación. Después de la entrevista y aprobación recibirás un link privado para crear tu cuenta.</p><a class="btn red" href="#/agent/apply">Aplicar</a></div>
  </div></div>`;
  let mode="password";
  $("#passMode").onclick=()=>{mode="password";$("#secretLabel").innerHTML=`Contraseña<input name="secret" type="password" required>`};
  $("#pinMode").onclick=()=>{mode="pin";$("#secretLabel").innerHTML=`PIN<input name="secret" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" required>`};
  $("#loginForm").onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));try{await api("/api/auth/login",{method:"POST",body:JSON.stringify({email:f.email,secret:f.secret,mode})});location.hash="#/agent/dashboard"}catch(err){$("#loginMsg").innerHTML=`<div class="msg err">${esc(err.message)}</div>`}};
}
function register(){
  show("#register"); const token=new URLSearchParams(route().split("?")[1]||"").get("invite")||"";
  $("#register").innerHTML=`<div class="auth-shell"><div class="auth-card"><div class="eyebrow">Cuenta aprobada</div><h2 style="font-size:52px">Crea tu acceso BOOSTR.</h2>
    <p>Este registro funciona únicamente con un link de invitación aprobado por BOOSTR.</p>
    <form id="regForm" class="formgrid"><input type="hidden" name="invite" value="${esc(token)}">
      <label>Email<input name="email" type="email" required></label><label>Nombre<input name="name" required></label>
      <label>Contraseña<input name="password" type="password" minlength="8" required></label>
      <label>PIN de 6 dígitos (opcional)<input name="pin" inputmode="numeric" maxlength="6" pattern="[0-9]{6}"></label>
      <button class="btn dark" style="grid-column:1/-1">Crear cuenta</button>
    </form><div id="regMsg"></div></div></div>`;
  $("#regForm").onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));try{await api("/api/auth/register",{method:"POST",body:JSON.stringify(f)});location.hash="#/agent/dashboard"}catch(err){$("#regMsg").innerHTML=`<div class="msg err">${esc(err.message)}</div>`}};
}

async function agent(){
  try{me=await api("/api/auth/me");if(!me.user||me.user.role!=="AGENT"){location.hash="#/agent/login";return}}catch{location.hash="#/agent/login";return}
  show("#agent");
  $("#agent").innerHTML=`<div class="agent-shell">
    <aside class="side"><div class="logo">BOOSTR<small>AGENT OS</small></div><nav>
      <button data-m="overview" class="active">Inicio</button><button data-m="starter">Starter Kit</button><button data-m="content">Flyers & contenido</button>
      <button data-m="pool">Piscina de Leads</button><button data-m="myleads">Mis Leads</button><button data-m="commissions">Comisiones</button><button data-m="profile">Perfil</button>
    </nav><div class="sidefoot"><p>Apoyo para cerrar · 24/7</p><a class="btn light" href="https://wa.me/13059008163" target="_blank" rel="noopener">Supervisora</a><a class="btn light" href="https://wa.me/17866820776" target="_blank" rel="noopener">Hablar con el fundador</a><button class="btn light" id="logout">Cerrar sesión</button></div></aside>
    <main id="agentMain"></main></div>`;
  $("#logout").onclick=async()=>{await api("/api/auth/logout",{method:"POST"});location.hash="#/"};
  $$(".side button[data-m]").forEach(b=>b.onclick=()=>{$$(".side button[data-m]").forEach(x=>x.classList.toggle("active",x===b));agentModule(b.dataset.m)});
  agentModule("overview");
}
async function agentModule(m){
  const host=$("#agentMain"); host.innerHTML=`<div class="dashhero">Cargando...</div>`;
  if(m==="overview"){
    const d=await api("/api/agent/dashboard");
    host.innerHTML=`<div class="dashhero"><div class="eyebrow">BOOSTR Agent</div><h2 style="font-size:52px">Hola, ${esc(d.user.name)}.</h2><p>Tu trabajo: conversar, precalificar, agendar y cerrar.</p>
      <div class="stats"><div class="stat"><b>${d.quota.used}/10</b><span>LEADS BOOSTR ESTA SEMANA</span></div><div class="stat"><b>${d.leads.length}</b><span>MIS LEADS</span></div><div class="stat"><b>${money(d.pendingCommission)}</b><span>COMISIÓN PENDIENTE</span></div><div class="stat"><b>${money(d.paidCommission)}</b><span>PAGADO</span></div></div>
    </div><div class="grid"><div class="card half"><div class="eyebrow">Tu objetivo</div><h3>La llamada es el siguiente paso.</h3><p>No necesitas resolver todo por chat. Entiende el negocio, crea confianza y mueve el lead.</p></div><div class="card half"><div class="eyebrow">BOOSTR Leads</div><h3>Tu close rate abre oportunidades.</h3><p>Hasta 10 leads de la piscina por semana. Tus leads propios no tienen límite.</p></div></div>`;
  }
  if(m==="starter"){
    host.innerHTML=`<div class="dashhero"><div class="eyebrow">Starter Kit</div><h2 style="font-size:52px">Todo para empezar.</h2><p>Catálogo, mensajes, reglas y metodología de trabajo.</p></div>
    <div class="grid">
      <div class="card full"><div class="eyebrow">Catálogo</div><h3>Productos y comisiones</h3>${catalog.filter(x=>x.price).map(x=>`<div class="row"><div><b>${esc(x.name)}</b><br><span style="color:var(--muted)">${esc(x.description)}</span></div><div style="margin-left:auto;text-align:right"><b>${money(x.price)}</b><br><span class="commission">comisión ${money(x.commission||x.price*.2)}</span></div></div>`).join("")}</div>
      <div class="card half"><div class="eyebrow">Dónde buscar</div><h3>Instagram · WhatsApp · Google Maps · Facebook · TikTok</h3><p>Busca negocios con website viejo, sin sistema, reservas manuales, clientes sin seguimiento o demasiadas tareas repetitivas.</p></div>
      <div class="card half"><div class="eyebrow">Reglas</div><h3>Representa a BOOSTR con claridad.</h3><p>No cambies precios, no recibas pagos del cliente, no prometas fechas/features no confirmadas y escala cualquier duda técnica.</p></div>
      <div class="card full"><div class="eyebrow">Mensajes listos</div>${scripts.map(s=>`<h3>${esc(s.title)}</h3><div class="script"><button class="copy" data-copy="${esc(s.text)}">Copiar</button><p>${esc(s.text)}</p></div>`).join("")}</div>
    </div>`;bindCopy();
  }
  if(m==="content"){
    host.innerHTML=`<div class="dashhero"><div class="eyebrow">Starter Content Kit</div><h2 style="font-size:52px">Postea. Copia. Envía.</h2><p>Flyers oficiales listos para descargar y captions listos para copiar.</p></div>
    <div class="flygrid">${flyers.map(f=>`<div class="fly"><img src="${esc(f.file)}"><h3>${esc(f.title)}</h3><div class="actions"><a download class="btn dark" href="${esc(f.file)}">Descargar flyer</a><button class="btn light copy" data-copy="${esc(f.caption)}">Copiar caption</button></div></div>`).join("")}</div>`;bindCopy();
  }
  if(m==="pool"){
    const [p,q]=await Promise.all([api("/api/agent/pool"),api("/api/agent/quota")]);
    host.innerHTML=`<div class="dashhero"><div class="eyebrow">Piscina de Leads</div><h2 style="font-size:52px">${q.remaining} disponibles esta semana.</h2><p>Puedes tomar hasta 10 leads BOOSTR por semana. Revísalos antes de reclamarlos.</p></div>
    <div class="poolgrid">${p.length?p.map(x=>`<div class="leadcard"><span class="temp ${esc(x.temperature)}">${esc(x.temperature)}</span><h3>${esc(x.business_name)}</h3><p>${esc(x.industry||"")} · ${esc(x.city||"")} ${esc(x.country||"")}</p><p><b>${esc(x.suggested_product||"Oportunidad BOOSTR")}</b><br>${esc(x.opportunity_summary||"")}</p><button class="btn dark claim" data-id="${x.id}">Tomar lead</button></div>`).join(""):`<div class="card full"><h3>No hay leads disponibles ahora.</h3><p>BOOSTR agrega nuevas oportunidades regularmente.</p></div>`}</div>`;
    $$(".claim").forEach(b=>b.onclick=async()=>{try{await api(`/api/agent/pool/${b.dataset.id}/claim`,{method:"POST"});agentModule("myleads")}catch(e){alert(e.message)}});
  }
  if(m==="myleads"){
    const leads=await api("/api/agent/leads");
    host.innerHTML=`<div class="dashhero"><div class="eyebrow">Mis Leads</div><h2 style="font-size:52px">Tu pipeline.</h2><div class="actions"><button class="btn dark" id="newLead">+ Registrar lead propio</button></div></div><div id="leadForm"></div>
    <div class="poolgrid">${leads.map(x=>`<div class="leadcard"><span class="temp ${esc(x.temperature||"FRIO")}">${esc(x.temperature||"FRIO")}</span><h3>${esc(x.business_name)}</h3><p>${esc(x.source==="BOOSTR_POOL"?"Lead BOOSTR":"Lead propio")} · ${esc(x.status)}</p><p>${esc(x.opportunity_summary||x.notes||"")}</p>
      ${x.source==="BOOSTR_POOL"?`<div class="contactbar">${x.phone?`<a href="tel:${esc(x.phone)}">Llamar</a>`:""}${x.whatsapp?`<a target="_blank" href="https://wa.me/${esc(String(x.whatsapp).replace(/\D/g,""))}">WhatsApp</a>`:""}${x.instagram?`<a target="_blank" href="${esc(x.instagram.startsWith("http")?x.instagram:"https://instagram.com/"+x.instagram.replace("@",""))}">Instagram</a>`:""}${x.facebook?`<a target="_blank" href="${esc(x.facebook)}">Facebook</a>`:""}${x.email?`<a href="mailto:${esc(x.email)}">Email</a>`:""}</div>`:""}
      ${x.recommended_opener?`<div class="script"><button class="copy" data-copy="${esc(x.recommended_opener)}">Copiar</button><p>${esc(x.recommended_opener)}</p></div>`:""}
      ${x.closing_notes?`<p><b>Notas para cerrar:</b><br>${esc(x.closing_notes)}</p>`:""}</div>`).join("")||`<div class="card full"><p>Aún no tienes leads.</p></div>`}</div>`;bindCopy();
    $("#newLead").onclick=()=>{$("#leadForm").innerHTML=`<div class="adminpanel"><h3>Registrar lead propio</h3><form id="ownLead" class="formgrid"><label>Negocio<input name="business_name" required></label><label>Contacto<input name="contact_name" required></label><label>Producto<select name="product_id">${catalog.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select></label><label>Teléfono / WhatsApp<input name="phone"></label><label>Instagram<input name="instagram"></label><label>País<input name="country"></label><label style="grid-column:1/-1">Notas<textarea name="notes"></textarea></label><button class="btn dark" style="grid-column:1/-1">Guardar lead</button></form></div>`;$("#ownLead").onsubmit=async e=>{e.preventDefault();await api("/api/agent/leads",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});agentModule("myleads")}};
  }
  if(m==="commissions"){
    const rows=await api("/api/agent/commissions");
    host.innerHTML=`<div class="dashhero"><div class="eyebrow">Comisiones</div><h2 style="font-size:52px">Tu dinero, claro.</h2></div><div class="grid">${rows.map(x=>`<div class="card"><div class="eyebrow">${esc(x.status)}</div><div class="price">${money(x.amount)}</div><p>${esc(x.business_name||"Venta BOOSTR")}</p></div>`).join("")||`<div class="card full"><p>Todavía no hay comisiones registradas.</p></div>`}</div>`;
  }
  if(m==="profile"){
    host.innerHTML=`<div class="dashhero"><div class="eyebrow">Perfil</div><h2 style="font-size:52px">${esc(me.user.name)}</h2><p>${esc(me.user.email)}</p></div><div class="card full"><h3>PIN de acceso</h3><p>Puedes configurar o cambiar un PIN de 6 dígitos para entrar más rápido.</p><form id="pinForm" style="max-width:420px"><label>Nuevo PIN<input name="pin" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required></label><button class="btn dark">Guardar PIN</button></form><div id="pinMsg"></div></div>`;
    $("#pinForm").onsubmit=async e=>{e.preventDefault();try{await api("/api/agent/pin",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});$("#pinMsg").innerHTML=`<div class="msg ok">PIN actualizado.</div>`}catch(err){$("#pinMsg").innerHTML=`<div class="msg err">${esc(err.message)}</div>`}};
  }
}
function bindCopy(){$$(".copy").forEach(b=>b.onclick=async()=>{await navigator.clipboard.writeText(b.dataset.copy||"");const old=b.textContent;b.textContent="Copiado";setTimeout(()=>b.textContent=old,1000)})}

async function admin(){
  try{me=await api("/api/auth/me");if(!me.user||me.user.role!=="ADMIN"){location.hash="#/agent/login";return}}catch{location.hash="#/agent/login";return}
  show("#admin");$("#admin").innerHTML=`<div class="agent-shell"><aside class="side"><div class="logo">BOOSTR<small>ADMIN</small></div><nav>
    <button data-a="apps" class="active">Aplicaciones</button><button data-a="pool">Lead Pool</button><button data-a="contacts">Contactos</button><button data-a="sales">Ventas y pagos</button><button data-a="settings">Landing / Redes</button>
  </nav><div class="sidefoot"><button id="adminOut" class="btn light">Cerrar sesión</button></div></aside><main id="adminMain"></main></div>`;
  $("#adminOut").onclick=async()=>{await api("/api/auth/logout",{method:"POST"});location.hash="#/"};
  $$(".side button[data-a]").forEach(b=>b.onclick=()=>{$$(".side button[data-a]").forEach(x=>x.classList.toggle("active",x===b));adminModule(b.dataset.a)});
  adminModule("apps");
}
async function adminModule(m){
  const h=$("#adminMain");h.innerHTML=`<div class="dashhero">Cargando...</div>`;
  if(m==="sales"){ await salesModule(h); return; }
  if(m==="apps"){
    const rows=await api("/api/admin/applications");
    h.innerHTML=`<div class="dashhero"><div class="eyebrow">Aplicaciones</div><h2 style="font-size:52px">Entrevista → aprobación → cuenta.</h2></div>
    <div class="adminpanel"><table class="table"><thead><tr><th>Persona</th><th>País</th><th>Contacto</th><th>Estado</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.name)}</b><br>${esc(x.email)}</td><td>${esc(x.city)}, ${esc(x.country)}</td><td>${esc(x.whatsapp)}<br>${esc(x.instagram||"")}</td><td>${esc(x.status)}</td><td>${x.status==="NEW"?`<button class="btn dark approve" data-id="${x.id}">Aprobar</button>`:x.invite_path?`<button class="btn light copy" data-copy="${location.origin}${x.invite_path}">Copiar invite</button>`:""}</td></tr>`).join("")}</tbody></table></div>`;bindCopy();
    $$(".approve").forEach(b=>b.onclick=async()=>{const r=await api(`/api/admin/applications/${b.dataset.id}/approve`,{method:"POST"});await navigator.clipboard.writeText(location.origin+r.invite_path);alert("Aprobado. Link de cuenta copiado.");adminModule("apps")});
  }
  if(m==="pool"){
    const rows=await api("/api/admin/pool");
    h.innerHTML=`<div class="dashhero"><div class="eyebrow">BOOSTR Lead Pool</div><h2 style="font-size:52px">Agrega leads todos los días.</h2><p>Carga suficiente contexto para que el agente pueda romper el hielo, contactar y cerrar.</p></div>
    <div class="adminpanel"><form id="poolForm" class="formgrid">
      <label>Negocio<input name="business_name" required></label><label>Temperatura<select name="temperature"><option>FRIO</option><option>TIBIO</option><option>CALIENTE</option></select></label>
      <label>Industria<input name="industry"></label><label>Producto recomendado<select name="suggested_product">${catalog.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select></label>
      <label>Contacto<input name="contact_name"></label><label>Cargo<input name="contact_role"></label><label>Teléfono<input name="phone"></label><label>WhatsApp<input name="whatsapp"></label>
      <label>Instagram<input name="instagram"></label><label>Facebook URL<input name="facebook"></label><label>Email<input name="email"></label><label>Website<input name="website"></label>
      <label>Ciudad<input name="city"></label><label>País<input name="country"></label><label>Idioma<input name="language"></label><label>Mejor canal<input name="preferred_channel" placeholder="WhatsApp / llamada / IG..."></label>
      <label style="grid-column:1/-1">Oportunidad<textarea name="opportunity_summary"></textarea></label>
      <label style="grid-column:1/-1">Rompehielo recomendado<textarea name="recommended_opener"></textarea></label>
      <label style="grid-column:1/-1">Notas para cerrar<textarea name="closing_notes"></textarea></label>
      <button class="btn dark" style="grid-column:1/-1">Agregar a la piscina</button>
    </form></div>
    <div class="adminpanel"><table class="table"><thead><tr><th>Lead</th><th>Temp.</th><th>Producto</th><th>Estado</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.business_name)}</b><br>${esc(x.city||"")} ${esc(x.country||"")}</td><td>${esc(x.temperature)}</td><td>${esc(x.suggested_product||"")}</td><td>${esc(x.status)}</td></tr>`).join("")}</tbody></table></div>`;
    $("#poolForm").onsubmit=async e=>{e.preventDefault();await api("/api/admin/pool",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});adminModule("pool")};
  }
  if(m==="contacts"){
    const rows=await api("/api/admin/contacts");h.innerHTML=`<div class="dashhero"><div class="eyebrow">Landing leads</div><h2 style="font-size:52px">Personas que contactaron BOOSTR.</h2></div><div class="adminpanel"><table class="table"><thead><tr><th>Contacto</th><th>Negocio</th><th>Mensaje</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.name)}<br>${esc(x.email||"")}<br>${esc(x.whatsapp||"")}</td><td>${esc(x.business_name)}</td><td>${esc(x.message)}</td></tr>`).join("")}</tbody></table></div>`;
  }
  if(m==="settings"){
    const s=await api("/api/admin/settings");h.innerHTML=`<div class="dashhero"><div class="eyebrow">Landing</div><h2 style="font-size:52px">Contacto y redes.</h2></div><div class="adminpanel"><form id="settingsForm" class="formgrid">${["instagram","tiktok","x","facebook","whatsapp","email"].map(k=>`<label>${k}<input name="${k}" value="${esc(s[k]||"")}"></label>`).join("")}<button class="btn dark" style="grid-column:1/-1">Guardar</button></form></div>`;$("#settingsForm").onsubmit=async e=>{e.preventDefault();await api("/api/admin/settings",{method:"PUT",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});settings=await api("/api/public/settings");alert("Guardado")};
  }
}

async function render(){
  await publicData();
  const r=route();
  if(r==="/"||r.startsWith("/#")) landing();
  else if(r.startsWith("/work")) work();
  else if(r.startsWith("/agent/apply")) apply();
  else if(r.startsWith("/agent/login")) login();
  else if(r.startsWith("/agent/create-account")) register();
  else if(r.startsWith("/agent/dashboard")) agent();
  else if(r.startsWith("/admin")) admin();
  else landing();
}
window.addEventListener("hashchange",render);render();


async function salesModule(h){
 const d=await api('/api/admin/sales');
 h.innerHTML='<div class="dashhero"><h2>Ventas y pagos</h2><p>Crea la invoice después de acordar alcance y términos. El cliente paga en Stripe. Confirma aquí el envío real de la comisión.</p><button class="btn light" id="reconcile">Actualizar pagos de Stripe</button></div><div class="adminpanel"><form id="dealForm" class="formgrid"><label>Lead<select name="lead_id">'+d.leads.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.business_name)+' · '+esc(x.agent_name)+'</option>').join('')+'</select></label><label>Email del cliente<input type="email" name="customer_email" required></label><label>Precio USD<input type="number" min="200" step="0.01" name="amount" required></label><label>Comisión USD<input type="number" min="0.01" step="0.01" name="commission" required></label><label>Trabajo acordado<textarea name="scope" maxlength="3000" required></textarea></label><label>Términos acordados<textarea name="terms" maxlength="3000" required></textarea></label><button class="btn dark">Generar invoice y enlace de pago</button></form><p id="saleMsg"></p></div><div class="adminpanel"><h3>Invoices</h3>'+d.deals.map(x=>'<p>'+esc(x.business_name)+' · '+money(x.amount_cents/100)+' · '+esc(x.status)+(x.invoice_url?' · <a target="_blank" rel="noopener" href="'+esc(x.invoice_url)+'">Abrir invoice</a>':'')+'</p>').join('')+'</div><div class="adminpanel"><h3>Comisiones</h3>'+d.commissions.map(x=>'<p>'+esc(x.agent_name)+' · '+money(x.amount)+' · '+esc(x.status)+(x.status==='APPROVED'?' <button class="btn light payout" data-id="'+esc(x.id)+'">Registrar pago realizado</button>':'')+'</p>').join('')+'</div>';
 document.getElementById('dealForm').onsubmit=async e=>{e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;try{const r=await api('/api/admin/deals',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});document.getElementById('saleMsg').innerHTML='<a target="_blank" rel="noopener" href="'+esc(r.invoice_url)+'">Abrir y compartir invoice</a>';}catch(e){document.getElementById('saleMsg').textContent=e.message}finally{btn.disabled=false}};
 document.getElementById('reconcile').onclick=async()=>{try{await api('/api/admin/reconcile',{method:'POST'});salesModule(h)}catch(e){alert(e.message)}};
 document.querySelectorAll('.payout').forEach(b=>b.onclick=async()=>{const method=prompt('Método: Zelle, PayPal, Crypto o Moneda local');if(!method)return;const reference=prompt('Referencia del pago ya enviado al agente');if(!reference)return;try{await api('/api/admin/payout',{method:'POST',body:JSON.stringify({id:b.dataset.id,method,reference})});salesModule(h)}catch(e){alert(e.message)}});
}

