(function(){
  const $=s=>document.querySelector(s);
  const isWork=()=>location.hash.replace(/^#/,'')==='/work';
  let scheduled=false;

  function renderWork(){
    scheduled=false;
    if(!isWork())return;
    const host=$('#work');
    if(!host)return;
    document.querySelectorAll('.route').forEach(x=>x.classList.remove('active'));
    host.classList.add('active');
    if(host.querySelector('.work-v9-shell'))return;
    host.innerHTML=`<main class="work-v9-shell">
      <section class="work-v9-hero">
        <div class="work-v9-kicker">BOOSTR AGENT · LATAM</div>
        <h1>todo negocio necesita<br><span>presencia web.</span></h1>
        <p class="work-v9-lead">Una página web .com, una presencia profesional y un proceso claro para convertir interés en venta ya no son un lujo. BOOSTR te da productos fáciles de explicar para que puedas ayudar a negocios a verse mejor, vender mejor y ganar comisión por cada cierre.</p>
        <div class="work-v9-pills"><span>💵 comisiones en USD</span><span>🌎 remoto desde LATAM</span><span>🧰 kit de trabajo</span><span>🎯 leads BOOSTR</span><span>🕐 horario flexible</span></div>
        <div class="work-v9-actions"><a class="primary" href="#/agent/apply">aplicar ahora</a><a class="secondary" href="#/agent/login">ya soy agente</a></div>
      </section>
      <section class="work-v9-section"><div class="work-v9-head"><small>qué vas a vender</small><h2>productos que un negocio entiende.</h2><p>No tienes que vender tecnología complicada. Empiezas detectando un problema real: el negocio no tiene web, se ve poco profesional, pierde leads, depende de mensajes manuales o hace difícil comprar.</p></div><div class="work-v9-products"><article><small>01 · entrada</small><h3>🌐 website basic</h3><b>$200</b><p>Para negocios que necesitan presencia profesional sin arrancar con un proyecto grande.</p></article><article class="dark"><small>02 · crecimiento</small><h3>🌐 website pro</h3><b>$500</b><p>Más estructura, contenido y una experiencia preparada para generar confianza y convertir.</p></article><article><small>03 · sistemas</small><h3>🧩 advanced / custom</h3><b>$800+</b><p>CRM, automatización, pagos, procesos y sistemas hechos según lo que el negocio realmente necesita.</p></article></div></section>
      <section class="work-v9-dark"><small>por qué funciona</small><h2>no vendes “una página”.<br>vendes una necesidad.</h2><div class="work-v9-reasons"><div><span>🔗</span><h3>links que no funcionan</h3><p>Si llegar a comprar es complicado, hay una oportunidad.</p></div><div><span>📸</span><h3>producto que se ve mal</h3><p>Si las fotos o la presentación no generan confianza, hay una oportunidad.</p></div><div><span>💬</span><h3>todo ocurre por mensajes</h3><p>Si reservas, pedidos o seguimiento dependen de chats manuales, hay una oportunidad.</p></div><div><span>📉</span><h3>interés que no se convierte</h3><p>Si el negocio recibe atención pero pierde personas antes de cerrar, hay una oportunidad.</p></div></div></section>
      <section class="work-v9-section"><div class="work-v9-head"><small>cómo trabajas</small><h2>BOOSTR te da estructura.</h2></div><div class="work-v9-steps"><article><b>1</b><h3>aprende el catálogo</h3><p>Precios, demos, mensajes, objeciones y ejemplos reales.</p></article><article><b>2</b><h3>habla con negocios</h3><p>Instagram, WhatsApp, TikTok, Facebook, email o llamada.</p></article><article><b>3</b><h3>rompe el hielo</h3><p>Primero confianza. Después enseñas el producto o demo.</p></article><article><b>4</b><h3>cierra y cobra</h3><p>BOOSTR ejecuta el trabajo. Tú ganas la comisión correspondiente cuando el cliente paga.</p></article></div></section>
      <section class="work-v9-cta"><small>BOOSTR AGENT LATAM</small><h2>buscamos potencial.<br>nosotros entrenamos.</h2><p>No necesitas programar ni ser experto técnico. Necesitas comunicar bien, aprender el sistema y tomarte cada lead en serio.</p><a href="#/agent/apply">llenar aplicación →</a></section>
    </main>`;
  }

  function schedule(){
    if(!isWork()||scheduled)return;
    scheduled=true;
    requestAnimationFrame(renderWork);
  }

  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href="#/work"]');
    if(!a)return;
    if(isWork()){e.preventDefault();schedule();}
  },true);
  window.addEventListener('hashchange',schedule);
  window.addEventListener('pageshow',schedule);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  window.__renderBoostrWork=schedule;
})();