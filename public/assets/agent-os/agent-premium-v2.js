(function(){
const countries=[['🇻🇪','Venezuela'],['🇨🇴','Colombia'],['🇦🇷','Argentina'],['🇲🇽','México'],['🇵🇪','Perú'],['🇪🇨','Ecuador'],['🇨🇱','Chile'],['🇧🇴','Bolivia'],['🇧🇷','Brasil'],['🇵🇾','Paraguay'],['🇺🇾','Uruguay'],['🇩🇴','República Dominicana'],['🇵🇷','Puerto Rico'],['🇨🇷','Costa Rica'],['🇵🇦','Panamá'],['🇬🇹','Guatemala'],['🇸🇻','El Salvador'],['🇭🇳','Honduras'],['🇳🇮','Nicaragua'],['🇺🇸','Estados Unidos'],['🇪🇸','España'],['🌎','Otro']];
const countryOptions=(selected='')=>'<option value="">Selecciona</option>'+countries.map(([f,n])=>`<option ${selected===n?'selected':''} value="${n}">${f} ${n}</option>`).join('');
const checks=(name,items)=>items.map(x=>`<label class="check-chip"><input type="checkbox" name="${name}" value="${x}"><span>${x}</span></label>`).join('');

function premiumWork(){
  show('#work');
  $('#work').innerHTML=`<main class="agent-v2-shell">
    <section class="agent-v2-hero">
      <div class="agent-v2-kicker">BOOSTR AGENT · LATAM</div>
      <h1>vende productos reales.<br><span class="money">gana comisiones reales.</span></h1>
      <p>BOOSTR te da catálogo, contenido, mensajes, soporte, demos y oportunidades. Tú conversas con negocios, detectas lo que necesitan y ayudas a cerrar la venta.</p>
      <div class="agent-v2-pills"><span class="agent-v2-pill money">Comisiones en USD</span><span class="agent-v2-pill">Horario flexible</span><span class="agent-v2-pill">Leads BOOSTR</span><span class="agent-v2-pill">Sin pagar para entrar</span><span class="agent-v2-pill">LATAM</span></div>
      <div class="agent-v2-actions"><a class="agent-v2-btn primary" href="#/agent/apply">Aplicar ahora</a><a class="agent-v2-btn secondary" href="#/agent/login">Ya soy agente</a></div>
    </section>
    <section class="agent-v2-grid">
      <article class="agent-v2-card dark"><div class="n">01 · aprende</div><h3>todo listo para vender.</h3><p>Catálogo, precios, demos, flyers, scripts y respuestas para los casos más comunes.</p></article>
      <article class="agent-v2-card"><div class="n">02 · conversa</div><h3>habla con negocios.</h3><p>Instagram, WhatsApp, Facebook, llamada, email o el canal que tenga más sentido.</p></article>
      <article class="agent-v2-card dark"><div class="n">03 · cierra</div><h3>BOOSTR ejecuta.</h3><p>Tú abres la oportunidad y ayudas a cerrar. Nuestro equipo se encarga del producto y la entrega.</p></article>
      <article class="agent-v2-card dark half"><div class="n">BOOSTR LEAD POOL</div><h3>también te damos leads.</h3><p>Hasta <b>10 leads BOOSTR por semana</b> con contexto, temperatura y producto sugerido. Tus propios leads son ilimitados.</p></article>
      <article class="agent-v2-card dark half"><div class="n">TU COMISIÓN</div><h3 class="money-big">cobra por cerrar.</h3><p>$50 en website de $200 · $100 en website de $500 · $160 en proyectos desde $800. La comisión se genera sobre dinero realmente cobrado por BOOSTR.</p></article>
      <article class="agent-v2-card half"><div class="n">NO VENDES SOLO</div><h3>BOOSTR te respalda.</h3><p>Si una pregunta es técnica, la escalas. Si un lead se complica, el equipo puede ayudarte. No tienes que improvisar precios ni respuestas.</p></article>
      <article class="agent-v2-card half"><div class="n">PRIMEROS 7 DÍAS</div><h3>entras con estructura.</h3><p>Aprendes el catálogo, publicas contenido, practicas scripts, abres conversaciones y empiezas a trabajar tu pipeline.</p></article>
    </section>
  </main>`;
}

function premiumApply(){
  show('#apply');
  $('#apply').innerHTML=`<main class="agent-apply-shell">
    <section class="agent-apply-head"><div class="agent-v2-kicker">BOOSTR AGENT · LATAM</div><h2>queremos conocerte<br>antes de entrenarte.</h2><p>No hay pruebas técnicas. Esta aplicación nos ayuda a entender cómo te comunicas, qué herramientas tienes, tus horarios y en qué podrías ser más fuerte como agente.</p></section>
    <form id="applyFormV2" class="agent-apply-form">
      <section class="agent-apply-section"><h3>Sobre ti</h3><p>La información básica para conocerte antes de la entrevista.</p><div class="agent-form-grid">
        <label>Nombre completo<input name="name" required autocomplete="name"></label>
        <label>Rango de edad<select name="age_range" required><option value="">Selecciona</option><option>18–20</option><option>21–24</option><option>25–29</option><option>30–35</option><option>36+</option></select></label>
        <label>¿De dónde eres? 🌎<select class="country-select" name="origin_country" required>${countryOptions()}</select></label>
        <label>¿Dónde resides actualmente? 📍<select class="country-select" name="country" required>${countryOptions()}</select></label>
        <label>Ciudad actual<input name="city" required></label>
        <label>Zona horaria<select name="timezone" required><option value="">Selecciona</option><option>EST / Miami</option><option>CST</option><option>MST</option><option>PST</option><option>Venezuela / UTC-4</option><option>Colombia / Perú / Ecuador UTC-5</option><option>Argentina / Uruguay UTC-3</option><option>Chile</option><option>España</option><option>Otra</option></select></label>
        <label>WhatsApp<input name="whatsapp" required inputmode="tel"></label><label>Email<input name="email" type="email" required></label>
        <label>Instagram<input name="instagram" placeholder="@usuario"></label><label>TikTok<input name="tiktok" placeholder="@usuario"></label>
      </div></section>

      <section class="agent-apply-section"><h3>Idiomas</h3><p>Marca todos los que puedas usar para hablar con un cliente.</p><div class="check-grid">${checks('languages',['🇪🇸 Español','🇺🇸 Inglés','🇧🇷 Portugués','🇫🇷 Francés','🇮🇹 Italiano','🌎 Otro'])}</div><div class="agent-form-grid" style="margin-top:14px"><label>Nivel de inglés<select name="english_level"><option>No lo manejo</option><option>Básico</option><option>Intermedio</option><option>Avanzado</option><option>Fluido / bilingüe</option></select></label><label>Otro idioma o detalle<input name="language_notes" placeholder="Opcional"></label></div></section>

      <section class="agent-apply-section"><h3>Cómo trabajas</h3><p>Esto nos ayuda a adaptar tu entrenamiento y las herramientas que te damos.</p>
        <div class="agent-form-grid"><label>Experiencia en ventas<select name="sales_experience"><option>Ninguna todavía</option><option>He vendido ocasionalmente</option><option>Tengo experiencia frecuente</option><option>Trabajo o trabajé profesionalmente en ventas</option></select></label><label>Atención al cliente<select name="service_experience"><option>Ninguna todavía</option><option>Algo de experiencia</option><option>Experiencia frecuente</option><option>Experiencia profesional</option></select></label></div>
        <p style="margin-top:18px">Canales que te sientes cómodo usando</p><div class="check-grid">${checks('channels',['Instagram DM','WhatsApp','Llamadas','Email','Facebook','Videollamada'])}</div>
        <p style="margin-top:18px">Dispositivos disponibles</p><div class="check-grid">${checks('device_list',['📱 Teléfono','💻 Laptop / PC','🎧 Audífonos','🎙️ Micrófono','📷 Cámara','📶 Internet estable'])}</div>
        <div class="agent-form-grid" style="margin-top:14px"><label>Comodidad haciendo llamadas<select name="call_comfort"><option>Prefiero chat</option><option>Puedo hacerlo si es necesario</option><option>Me siento cómodo</option><option>Me gusta vender por llamada</option></select></label><label>Comodidad en videollamada<select name="video_comfort"><option>Prefiero no hacerlo</option><option>Puedo hacerlo</option><option>Me siento cómodo</option></select></label></div>
      </section>

      <section class="agent-apply-section"><h3>Disponibilidad y enfoque</h3><p>No necesitas trabajar un horario fijo, pero queremos saber cuándo realmente puedes atender clientes.</p><div class="agent-form-grid">
        <label>Horas disponibles por semana<select name="hours"><option>Menos de 5</option><option>5–10</option><option>10–15</option><option>15–25</option><option>25+</option></select></label>
        <label>¿Cuándo podrías empezar?<select name="start_when"><option>Hoy / inmediatamente</option><option>Esta semana</option><option>En 1–2 semanas</option><option>Más adelante</option></select></label>
        <label class="full">Días disponibles<div class="check-grid" style="margin-top:8px">${checks('days',['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'])}</div></label>
        <label>Horario que prefieres<select name="daypart"><option>Mañana</option><option>Tarde</option><option>Noche</option><option>Flexible / varía</option></select></label>
        <label>Meta personal semanal en comisiones<input name="weekly_goal" placeholder="Ej. $100 / semana"></label>
      </div></section>

      <section class="agent-apply-section"><h3>Fortalezas y contexto</h3><p>Nos sirve para decidir qué tipo de leads, negocios y productos podrían quedarte mejor.</p><p>Industrias que conoces o te interesan</p><div class="check-grid">${checks('industries',['Restaurantes','Automotive','Música','Beauty','Retail','Servicios profesionales','Real estate','Creadores','Ecommerce'])}</div><div class="agent-form-grid" style="margin-top:14px"><label class="full">¿Por qué quieres ser BOOSTR Agent?<textarea name="motivation" required placeholder="Cuéntanos en pocas palabras"></textarea></label><label class="full">¿Qué crees que se te da mejor al hablar con personas o vender?<textarea name="strengths" placeholder="Opcional, pero nos ayuda"></textarea></label></div></section>

      <section class="agent-apply-section"><h3>Cómo podrías recibir pagos</h3><p>Marca las opciones que ya tienes disponibles. Esto no cambia tu posibilidad de aplicar.</p><div class="check-grid">${checks('payment_methods',['Zelle','PayPal','USDT / crypto','Banco local','Otro'])}</div><label style="margin-top:18px"><input type="checkbox" name="confirm_real" required style="width:auto;margin-right:8px">Entiendo que este es un trabajo por comisión y que los ingresos dependen de ventas realmente cobradas por BOOSTR.</label><button class="apply-submit">Enviar aplicación</button><div id="applyMsgV2"></div></section>
    </form>
  </main>`;

  $('#applyFormV2').onsubmit=async e=>{
    e.preventDefault(); const form=e.target; const fd=new FormData(form); const val=n=>String(fd.get(n)||'').trim(); const arr=n=>fd.getAll(n);
    const profile={version:2,origin_country:val('origin_country'),residence_country:val('country'),age_range:val('age_range'),timezone:val('timezone'),languages:arr('languages'),language_notes:val('language_notes'),channels:arr('channels'),devices:arr('device_list'),call_comfort:val('call_comfort'),video_comfort:val('video_comfort'),hours:val('hours'),start_when:val('start_when'),days:arr('days'),daypart:val('daypart'),weekly_goal:val('weekly_goal'),industries:arr('industries'),motivation:val('motivation'),strengths:val('strengths'),payment_methods:arr('payment_methods')};
    const payload={name:val('name'),country:val('country'),city:val('city'),whatsapp:val('whatsapp'),instagram:val('instagram'),tiktok:val('tiktok'),email:val('email'),english_level:val('english_level'),sales_experience:val('sales_experience'),service_experience:val('service_experience'),availability:JSON.stringify({hours:profile.hours,start_when:profile.start_when,days:profile.days,daypart:profile.daypart,timezone:profile.timezone}),devices:JSON.stringify(profile)};
    const btn=form.querySelector('.apply-submit'); btn.disabled=true; btn.textContent='Enviando…';
    try{await api('/api/public/applications',{method:'POST',body:JSON.stringify(payload)});form.innerHTML=`<div class="apply-success"><div class="agent-v2-kicker">APLICACIÓN RECIBIDA</div><h3>gracias por llenar tu aplicación con BOOSTR.</h3><p>Nos estaremos comunicando contigo en las próximas horas para la entrevista en tiempo real. Ten tu teléfono o computadora disponible para que podamos enseñarte cómo funciona BOOSTR Agent LATAM y resolver tus preguntas.</p><span class="status">✓ pendiente de entrevista</span></div>`;window.scrollTo({top:0,behavior:'smooth'});}catch(err){$('#applyMsgV2').innerHTML=`<div class="msg err">${esc(err.message)}</div>`;btn.disabled=false;btn.textContent='Enviar aplicación';}
  };
}

try{window.work=premiumWork;work=premiumWork}catch(e){}
try{window.apply=premiumApply;apply=premiumApply}catch(e){}
const r=typeof route==='function'?route():location.hash.replace(/^#/,'');
if(r==='/work')premiumWork();
if(r==='/agent/apply')premiumApply();
})();
