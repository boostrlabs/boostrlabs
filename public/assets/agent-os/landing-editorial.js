(function(){
  function editorialLanding(){
    show("#landing");
    const root=$("#landing");
    root.classList.add("editorial-home");
    root.innerHTML=`<main class="eh-shell">
      <section class="eh-hero" id="home">
        <div class="eh-top">
          <img class="eh-brand" src="/assets/logos/boostr-logo-nav.png" alt="BOOSTR Labs" onerror="this.style.display='none'">
          <div class="eh-kicker">digital systems · branding · marketing</div>
          <h1>tu negocio vende<br><span class="eh-gradient-text">como se ve</span></h1>
          <p class="eh-sub">websites, apps, sistemas, marketing, diseño y branding para que tu empresa se vea profesional, funcione mejor y venda más</p>
          <div class="eh-actions"><a class="eh-btn eh-btn-dark" href="#/#services">nuestros productos</a><a class="eh-btn eh-btn-light" href="#/work">trabaja con nosotros</a></div>
        </div>
        <div class="eh-pricing-wrap">
          <div class="eh-pricing"><div class="eh-tower eh-tower-1"></div><div class="eh-tower eh-tower-2"></div><div class="eh-tower eh-tower-3"></div></div>
          <div class="eh-price-row"><div class="eh-price">$200<span>website</span></div><div class="eh-price">$500<span>website pro</span></div><div class="eh-price">$800+<span>systems / custom</span></div></div>
        </div>
      </section>

      <section class="eh-dark" id="reality"><div class="eh-dark-inner">
        <div class="eh-section-index"><div class="eh-small">la realidad</div><div class="eh-num">02</div></div>
        <h2>las redes llaman<br>la atención<br><br>tu presencia digital genera<br><span class="eh-gradient-text">confianza</span></h2>
        <div class="eh-truth"><div class="eh-truth-copy">Una buena imagen hace que te descubran.<br>Una presencia profesional hace que te tomen en serio.</div><div class="eh-truth-card"><b>BOOSTR</b><span>imagen · tecnología · crecimiento</span></div></div>
      </div></section>

      <section class="eh-section" id="services"><div class="eh-section-inner">
        <div class="eh-head"><h3>lo que<br>ofrecemos</h3><p>tecnología, diseño y crecimiento para que tu negocio se vea mejor, opere mejor y venda más</p></div>
        <div class="eh-services">
          <article class="eh-service"><div class="n">01</div><h4>websites</h4><p>dominio propio, presencia profesional, leads, bookings y ventas</p><div class="eh-accent"></div></article>
          <article class="eh-service"><div class="n">02</div><h4>apps & business os</h4><p>clientes, procesos, bases de datos, pagos y sistemas internos</p><div class="eh-accent"></div></article>
          <article class="eh-service"><div class="n">03</div><h4>crm & automation</h4><p>seguimiento, pipelines, mensajes y procesos conectados</p><div class="eh-accent"></div></article>
          <article class="eh-service"><div class="n">04</div><h4>branding & design</h4><p>identidad visual, logos, piezas gráficas y una estética profesional consistente</p><div class="eh-accent"></div></article>
          <article class="eh-service"><div class="n">05</div><h4>marketing</h4><p>estrategia, campañas, contenido y presencia digital para atraer y convertir más clientes</p><div class="eh-accent"></div></article>
          <article class="eh-service"><div class="n">06</div><h4>digital team</h4><p>asistentes y agentes virtuales reales con talento LATAM</p><div class="eh-accent"></div></article>
          <article class="eh-service"><div class="n">07</div><h4>ai chatbots</h4><p>automatización conversacional supervisada por personas</p><div class="eh-accent"></div></article>
          <article class="eh-service"><div class="n">08</div><h4>custom systems</h4><p>parking, automotive, ecommerce y soluciones hechas a medida</p><div class="eh-accent"></div></article>
        </div>
        <a class="eh-portfolio-link" href="/portfolio/">ver portfolio</a>
      </div></section>

      <section class="eh-agent" id="work"><div class="eh-agent-card">
        <div class="eh-small">BOOSTR Agents · LATAM</div>
        <h3>convierte conversaciones<br>en comisiones</h3>
        <p>BOOSTR te da producto, contenido, entrenamiento y oportunidades. Tú hablas con negocios, agendas, cierras y ganas comisión en USD.</p>
        <div class="eh-pills"><span class="eh-pill money">comisiones en USD</span><span class="eh-pill">horario flexible</span><span class="eh-pill">leads BOOSTR</span><span class="eh-pill">LATAM</span></div>
        <div class="eh-actions" style="justify-content:flex-start"><a class="eh-btn eh-btn-light" href="#/work">conoce el programa</a><a class="eh-btn eh-btn-light" href="#/agent/login">ya soy agente</a></div>
      </div></section>

      <section class="eh-contact" id="contact"><div class="eh-contact-grid">
        <div class="eh-panel"><div class="eh-small" style="color:#777">contacto</div><h3>cuéntanos qué necesita tu negocio</h3>
          <form id="contactForm" class="eh-form"><label>Nombre<input name="name" required></label><label>Negocio<input name="business_name" required></label><label>Email<input name="email" type="email"></label><label>WhatsApp<input name="whatsapp"></label><label class="full">¿Qué quieres mejorar?<textarea name="message" required></textarea></label><button class="eh-btn eh-btn-dark full">enviar</button></form><div id="contactMsg"></div>
        </div>
        <div class="eh-panel"><div class="eh-small" style="color:#777">síguenos</div><h3>BOOSTR en todas partes</h3><p style="font:400 17px/1.45 Arial,Helvetica,sans-serif;color:#666">productos, demos, casos de uso, oportunidades y nuevas soluciones</p><div class="eh-socials">${socials()}</div></div>
      </div></section>
    </main>`;

    const form=$("#contactForm");
    if(form) form.onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));try{await api("/api/public/contact",{method:"POST",body:JSON.stringify(f)});$("#contactMsg").innerHTML=`<div class="msg ok">Recibido. BOOSTR puede contactarte con la información que enviaste.</div>`;e.target.reset()}catch(err){$("#contactMsg").innerHTML=`<div class="msg err">${esc(err.message)}</div>`}};
    const anchor=route().split("#")[1];if(anchor)setTimeout(()=>document.getElementById(anchor)?.scrollIntoView(),40);
  }

  try{landing=editorialLanding}catch(e){window.landing=editorialLanding}
  const r=route();if(r==="/"||r.startsWith("/#")) editorialLanding();
})();
