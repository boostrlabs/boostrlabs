(()=>{
const countries=[['🇻🇪','Venezuela'],['🇨🇴','Colombia'],['🇦🇷','Argentina'],['🇲🇽','México'],['🇵🇪','Perú'],['🇪🇨','Ecuador'],['🇨🇱','Chile'],['🇧🇴','Bolivia'],['🇧🇷','Brasil'],['🇵🇾','Paraguay'],['🇺🇾','Uruguay'],['🇩🇴','República Dominicana'],['🇵🇷','Puerto Rico'],['🇨🇷','Costa Rica'],['🇵🇦','Panamá'],['🇬🇹','Guatemala'],['🇸🇻','El Salvador'],['🇭🇳','Honduras'],['🇳🇮','Nicaragua'],['🇺🇸','Estados Unidos'],['🇪🇸','España'],['🌎','Otro']];
const countryOptions=()=>'<option value="">Selecciona</option>'+countries.map(([f,n])=>`<option value="${n}">${f} ${n}</option>`).join('');
const checks=(name,items)=>items.map(x=>`<label class="check-chip"><input type="checkbox" name="${name}" value="${x}"><span>${x}</span></label>`).join('');

function renderPremiumApply(){
  if((location.hash.replace(/^#/,'')||'/')!=='/agent/apply') return;
  show('#apply');
  $('#apply').innerHTML=`<main class="agent-apply-shell">
    <section class="agent-apply-head"><div class="agent-v2-kicker">BOOSTR AGENT · LATAM</div><h2>queremos conocerte<br>antes de entrenarte.</h2><p>No buscamos expertos ni vendedores perfectos. Queremos entender cómo te comunicas, con qué herramientas cuentas, cuándo puedes trabajar y en qué tipo de oportunidades podrías rendir mejor.</p></section>
    <form id="applyFormV18" class="agent-apply-form">
      <section class="agent-apply-section"><h3>sobre ti</h3><p>Primero lo básico para conocerte antes de la entrevista.</p><div class="agent-form-grid">
        <label>Nombre completo<input name="name" required autocomplete="name"></label>
        <label>Rango de edad<select name="age_range" required><option value="">Selecciona</option><option>18–20</option><option>21–24</option><option>25–29</option><option>30–35</option><option>36+</option></select></label>
        <label>¿De dónde eres? 🌎<select name="origin_country" required>${countryOptions()}</select></label>
        <label>¿Dónde resides actualmente? 📍<select name="country" required>${countryOptions()}</select></label>
        <label>Ciudad actual<input name="city" required></label>
        <label>Zona horaria<select name="timezone" required><option value="">Selecciona</option><option>EST / Miami</option><option>CST</option><option>MST</option><option>PST</option><option>Venezuela / UTC-4</option><option>Colombia / Perú / Ecuador UTC-5</option><option>Argentina / Uruguay UTC-3</option><option>Chile</option><option>España</option><option>Otra</option></select></label>
        <label>WhatsApp<input name="whatsapp" required inputmode="tel"></label><label>Email<input name="email" type="email" required></label>
        <label>Instagram<input name="instagram" placeholder="@usuario"></label><label>TikTok<input name="tiktok" placeholder="@usuario"></label>
      </div></section>

      <section class="agent-apply-section"><h3>idiomas y comunicación</h3><p>Marca los idiomas y canales que realmente puedes usar con un cliente.</p><div class="check-grid">${checks('languages',['🇪🇸 Español','🇺🇸 Inglés','🇧🇷 Portugués','🇫🇷 Francés','🇮🇹 Italiano','🌎 Otro'])}</div><div class="agent-form-grid" style="margin-top:14px"><label>Nivel de inglés<select name="english_level"><option>No lo manejo</option><option>Básico</option><option>Intermedio</option><option>Avanzado</option><option>Fluido / bilingüe</option></select></label><label>Otro idioma o detalle<input name="language_notes" placeholder="Opcional"></label></div>
        <p style="margin-top:18px">Canales que te sientes cómodo usando</p><div class="check-grid">${checks('channels',['Instagram DM','WhatsApp','Llamadas','Email','Facebook','Videollamada'])}</div>
        <div class="agent-form-grid" style="margin-top:14px"><label>Comodidad haciendo llamadas<select name="call_comfort"><option>Prefiero chat</option><option>Puedo hacerlo si es necesario</option><option>Me siento cómodo</option><option>Me gusta vender por llamada</option></select></label><label>Comodidad en videollamada<select name="video_comfort"><option>Prefiero no hacerlo</option><option>Puedo hacerlo</option><option>Me siento cómodo</option></select></label></div>
      </section>

      <section class="agent-apply-section"><h3>experiencia y herramientas</h3><p>No necesitas experiencia previa para aplicar. Esto solo nos ayuda a entrenarte mejor.</p><div class="agent-form-grid"><label>Experiencia en ventas<select name="sales_experience"><option>Ninguna todavía</option><option>He vendido ocasionalmente</option><option>Tengo experiencia frecuente</option><option>Trabajo o trabajé profesionalmente en ventas</option></select></label><label>Atención al cliente<select name="service_experience"><option>Ninguna todavía</option><option>Algo de experiencia</option><option>Experiencia frecuente</option><option>Experiencia profesional</option></select></label></div>
        <p style="margin-top:18px">Dispositivos disponibles</p><div class="check-grid">${checks('device_list',['📱 Teléfono','💻 Laptop / PC','🎧 Audífonos','🎙️ Micrófono','📷 Cámara','📶 Internet estable'])}</div>
      </section>

      <section class="agent-apply-section"><h3>disponibilidad</h3><p>No hay horario fijo, pero necesitamos saber cuándo realmente puedes responder y dar seguimiento.</p><div class="agent-form-grid">
        <label>Horas disponibles por semana<select name="hours"><option>Menos de 5</option><option>5–10</option><option>10–15</option><option>15–25</option><option>25+</option></select></label>
        <label>¿Cuándo podrías empezar?<select name="start_when"><option>Hoy / inmediatamente</option><option>Esta semana</option><option>En 1–2 semanas</option><option>Más adelante</option></select></label>
        <label class="full">Días disponibles<div class="check-grid" style="margin-top:8px">${checks('days',['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'])}</div></label>
        <label>Horario que prefieres<select name="daypart"><option>Mañana</option><option>Tarde</option><option>Noche</option><option>Flexible / varía</option></select></label>
        <label>Meta semanal en comisiones<input name="weekly_goal" placeholder="Ej. $100 / semana"></label>
      </div></section>

      <section class="agent-apply-section"><h3>fortalezas y contexto</h3><p>Esto nos ayuda a decidir qué tipo de negocios y oportunidades podrían quedarte mejor.</p><p>Industrias que conoces o te interesan</p><div class="check-grid">${checks('industries',['Restaurantes','Automotive','Música','Beauty','Retail','Servicios profesionales','Real estate','Creadores','Ecommerce'])}</div><div class="agent-form-grid" style="margin-top:14px"><label class="full">¿Por qué quieres ser BOOSTR Agent?<textarea name="motivation" required placeholder="Cuéntanos en pocas palabras"></textarea></label><label class="full">¿Qué crees que se te da mejor al hablar con personas o vender?<textarea name="strengths" placeholder="Opcional, pero nos ayuda"></textarea></label></div></section>

      <section class="agent-apply-section"><h3>cómo recibirías tus pagos</h3><p>Marca las opciones que ya tienes disponibles. Esto no cambia tu posibilidad de aplicar.</p><div class="check-grid">${checks('payment_methods',['Zelle','PayPal','USDT / crypto','Banco local','Otro'])}</div><label class="apply-confirm"><input type="checkbox" name="confirm_real" required>Entiendo que BOOSTR Agent funciona por comisión y que los ingresos dependen de ventas realmente cobradas por BOOSTR.</label><button class="apply-submit">enviar aplicación</button><div id="applyMsgV18"></div></section>
    </form>
  </main>`;

  $('#applyFormV18').onsubmit=async e=>{
    e.preventDefault();const form=e.target,fd=new FormData(form),val=n=>String(fd.get(n)||'').trim(),arr=n=>fd.getAll(n);
    const profile={version:2,origin_country:val('origin_country'),residence_country:val('country'),age_range:val('age_range'),timezone:val('timezone'),languages:arr('languages'),language_notes:val('language_notes'),channels:arr('channels'),devices:arr('device_list'),call_comfort:val('call_comfort'),video_comfort:val('video_comfort'),hours:val('hours'),start_when:val('start_when'),days:arr('days'),daypart:val('daypart'),weekly_goal:val('weekly_goal'),industries:arr('industries'),motivation:val('motivation'),strengths:val('strengths'),payment_methods:arr('payment_methods')};
    const payload={name:val('name'),country:val('country'),city:val('city'),whatsapp:val('whatsapp'),instagram:val('instagram'),tiktok:val('tiktok'),email:val('email'),english_level:val('english_level'),sales_experience:val('sales_experience'),service_experience:val('service_experience'),availability:JSON.stringify({hours:profile.hours,start_when:profile.start_when,days:profile.days,daypart:profile.daypart,timezone:profile.timezone}),devices:JSON.stringify(profile)};
    const btn=form.querySelector('.apply-submit');btn.disabled=true;btn.textContent='enviando…';
    try{await api('/api/public/applications',{method:'POST',body:JSON.stringify(payload)});form.innerHTML=`<div class="apply-success"><div class="agent-v2-kicker">APLICACIÓN RECIBIDA</div><h3>gracias por aplicar a BOOSTR Agent LATAM.</h3><p>Nos estaremos comunicando contigo en las próximas horas para una entrevista en tiempo real. Ahí te enseñamos cómo funciona el trabajo, resolvemos tus preguntas y vemos si hacemos buen fit.</p><span class="status">✓ pendiente de entrevista</span></div>`;window.scrollTo({top:0,behavior:'smooth'});}catch(err){$('#applyMsgV18').innerHTML=`<div class="msg err">${esc(err.message)}</div>`;btn.disabled=false;btn.textContent='enviar aplicación';}
  };
}

window.__renderBoostrPremiumApply=renderPremiumApply;
const sync=()=>{if((location.hash.replace(/^#/,'')||'/')==='/agent/apply'){clearTimeout(window.__boostrApplyV18Timer);window.__boostrApplyV18Timer=setTimeout(renderPremiumApply,120)}};
addEventListener('hashchange',sync);
addEventListener('pageshow',sync);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
})();