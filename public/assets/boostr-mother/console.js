(() => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes boostrFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes boostrGlow{0%,100%{box-shadow:var(--shadow)}50%{box-shadow:0 34px 120px rgba(111,140,255,.18),0 0 42px rgba(246,228,189,.11)}}
    .module,.metric,.task,.switch-card,.contract-card,.system-tile,.flow-row,.role-card,.signal,.stat,.item,.insight,.smart-block{position:relative;cursor:grab;animation:boostrFloat 7s ease-in-out infinite;animation-delay:calc(var(--float-i,0)*.28s);transition:transform .22s ease,border-color .22s ease,filter .22s ease}
    .module:hover,.metric:hover,.task:hover,.switch-card:hover,.contract-card:hover,.system-tile:hover,.flow-row:hover,.role-card:hover,.signal:hover,.stat:hover,.item:hover,.insight:hover,.smart-block:hover{transform:translateY(-10px) scale(1.014);border-color:rgba(246,228,189,.35);filter:brightness(1.1)}
    .dragging{opacity:.5;cursor:grabbing}.card.glass{animation:boostrGlow 9s ease-in-out infinite}.micro{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.footer{text-transform:uppercase;letter-spacing:.08em}.footer strong{color:var(--champagne,#f6e4bd)}
    .booster-search-input{width:100%;height:100%;border:0;outline:0;background:transparent;color:var(--ink,#fff);font:inherit;font-size:12px}.booster-search-input::placeholder{color:var(--muted,rgba(255,255,255,.5))}.boostr-hidden-by-search{display:none!important}
    .boostr-viz{margin-top:14px;height:44px;border-radius:16px;overflow:hidden;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.07);position:relative}.boostr-viz:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,var(--gold,#ffd36e),var(--green,#77ffac),var(--blue,#6f8cff),#ff6bd6);opacity:.88}.boostr-viz.line:before{clip-path:polygon(0 75%,15% 55%,30% 28%,45% 48%,60% 22%,75% 34%,100% 14%,100% 100%,0 100%)}.boostr-viz.bars:before{clip-path:polygon(4% 100%,4% 45%,13% 45%,13% 100%,23% 100%,23% 20%,34% 20%,34% 100%,45% 100%,45% 60%,56% 60%,56% 100%,67% 100%,67% 32%,79% 32%,79% 100%,89% 100%,89% 16%,98% 16%,98% 100%)}.boostr-viz.wave:before{clip-path:polygon(0 74%,12% 58%,24% 40%,36% 52%,48% 30%,60% 22%,72% 54%,84% 42%,100% 30%,100% 100%,0 100%)}
    .boostr-ring{--p:76;width:70px;height:70px;border-radius:50%;background:conic-gradient(var(--blue,#6f8cff) calc(var(--p)*1%),rgba(255,255,255,.08) 0);display:grid;place-items:center;margin-top:12px}.boostr-ring:after{content:attr(data-label);width:49px;height:49px;border-radius:50%;background:rgba(0,0,0,.65);display:grid;place-items:center;font-size:12px;font-weight:900}.boostr-row{display:flex;gap:10px;align-items:flex-end}.boostr-row .boostr-viz{flex:1}.boostr-system-name{font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:var(--champagne,#f6e4bd);font-weight:900;margin-bottom:6px}
    .boostr-lang-toggle{position:fixed!important;right:16px!important;bottom:16px!important;display:inline-flex!important;gap:3px!important;align-items:center!important;border:1px solid rgba(255,255,255,.18)!important;background:rgba(0,0,0,.62)!important;backdrop-filter:blur(18px)!important;border-radius:999px!important;padding:4px!important;z-index:99999!important;box-shadow:0 18px 70px rgba(0,0,0,.55)!important}.boostr-lang-toggle button{border:0!important;background:transparent!important;color:rgba(255,255,255,.64)!important;border-radius:999px!important;padding:8px 10px!important;font-size:10px!important;font-weight:950!important;letter-spacing:.09em!important;cursor:pointer!important}.boostr-lang-toggle button.active{background:rgba(255,255,255,.2)!important;color:#fff!important}
    @media (prefers-reduced-motion:reduce){.module,.metric,.task,.switch-card,.contract-card,.system-tile,.flow-row,.role-card,.signal,.stat,.item,.insight,.smart-block,.card.glass{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const FIXED = new Set(['BOOSTR Labs','Mother OS','Identity OS','Manager OS','Signal Inbox','Module Deck','Workspace Core','Partner Grid','System Core','BOOSTR Intake','Proof Vault','82NGEL OS','WESTDETRO OS','82 Command','Signal Engine','Revenue Pulse','Fan Radar','Action Queue','Route Map','BOOSTR OS']);
  const dict = {
    es: {'Home':'Inicio','Open':'Abrir','Access':'Acceder','Continue':'Continuar','Save':'Guardar','Send':'Enviar','Send Audit':'Enviar Audit','Search':'Buscar','Filter':'Filtrar','Status':'Estado','Active':'Activo','New':'Nuevo','Review':'Revisar','Qualified':'Calificado','Lost':'Perdido','Won':'Ganado','Name':'Nombre','Contact':'Contacto','Business / project':'Negocio / proyecto','Industry':'Industria','Stage':'Etapa','Main blocker':'Bloqueo principal','Goal':'Meta','Applications':'Aplicaciones','Modules':'Módulos','Summary':'Resumen','Audits':'Auditorías','Commerce':'Comercio','Proof':'Prueba','Library':'Biblioteca','Public':'Público','Private':'Privado','System':'Sistema','Settings':'Configuración','Help':'Ayuda','Logout':'Salir','Login':'Entrar','Email':'Correo','Role':'Rol','Language':'Idioma','Free BOOSTR Audit':'BOOSTR Audit gratis','FREE BOOSTR Audit':'BOOSTR Audit gratis','Portfolio':'Proof Vault','Module Registry':'Module Deck','Lead Inbox':'Signal Inbox','Partner Dashboard':'Partner Grid','Client OS':'Workspace Core','Admin Panel':'System Core','Manager Leads':'Signal Inbox','Dashboard / CRM':'Workspace Core','Tell BOOSTR what you sell, what is blocked, and what system you need.':'Dile a BOOSTR qué vendes, qué está bloqueado y qué sistema necesitas.','This creates a signal for Manager OS review.':'Esto crea una señal para revisión en Manager OS.','Sending...':'Enviando...','Audit sent.':'Audit enviado.','No data.':'Sin datos.','Loading...':'Cargando...','Select':'Selecciona','Select a row.':'Selecciona una fila.','Failed.':'Falló.','All':'Todo'},
    en: {'Inicio':'Home','Abrir':'Open','Acceder':'Access','Continuar':'Continue','Guardar':'Save','Enviar':'Send','Enviar Audit':'Send Audit','Buscar':'Search','Filtrar':'Filter','Estado':'Status','Activo':'Active','Nuevo':'New','Revisar':'Review','Calificado':'Qualified','Perdido':'Lost','Ganado':'Won','Nombre':'Name','Contacto':'Contact','Negocio / proyecto':'Business / project','Industria':'Industry','Etapa':'Stage','Bloqueo principal':'Main blocker','Meta':'Goal','Aplicaciones':'Applications','Módulos':'Modules','Modulos':'Modules','Resumen':'Summary','Auditorías':'Audits','Auditorias':'Audits','Comercio':'Commerce','Prueba':'Proof','Biblioteca':'Library','Público':'Public','Publico':'Public','Privado':'Private','Sistema':'System','Configuración':'Settings','Configuracion':'Settings','Ayuda':'Help','Salir':'Logout','Entrar':'Login','Correo':'Email','Rol':'Role','Idioma':'Language','FREE BOOSTR Audit':'Free BOOSTR Audit','Portfolio':'Proof Vault','Module Registry':'Module Deck','Lead Inbox':'Signal Inbox','Partner Dashboard':'Partner Grid','Client OS':'Workspace Core','Admin Panel':'System Core','Manager Leads':'Signal Inbox','Dashboard / CRM':'Workspace Core','Cuéntanos qué vendes, dónde se tranca y qué sistema necesitas.':'Tell BOOSTR what you sell, what is blocked, and what system you need.','Esto crea un lead real para revisión de BOOSTR Manager.':'This creates a signal for Manager OS review.','Enviando...':'Sending...','Audit enviado.':'Audit sent.','Sin datos.':'No data.','Cargando...':'Loading...','Selecciona':'Select','Selecciona una fila.':'Select a row.','Falló.':'Failed.','Todo':'All'}
  };
  const placeholders = {
    es: {'Search modules...':'Buscar módulos...','Search signals, leads, modules...':'Buscar señales, leads, módulos...','Access token':'Token de acceso','Filter':'Filtrar','Server search':'Buscar en servidor','Internal note':'Nota interna','Example: I lose leads in DMs, checkout is unclear, my page does not convert...':'Ejemplo: pierdo leads en DM, el cobro no está claro, mi página no convierte...','Example: more bookings, store, smart link, workspace, automation...':'Ejemplo: más bookings, tienda, smart link, workspace, automatización...'},
    en: {'Buscar módulos...':'Search modules...','Buscar señales, leads, módulos...':'Search signals, leads, modules...','Token de acceso':'Access token','Filtrar':'Filter','Buscar en servidor':'Server search','Nota interna':'Internal note','Ej: pierdo leads en DM, no tengo forma clara de cobrar, mi página no convierte...':'Example: I lose leads in DMs, checkout is unclear, my page does not convert...','Ej: más bookings, tienda, smart link, dashboard, CRM, automatización...':'Example: more bookings, store, smart link, workspace, automation...'}
  };
  const langKey = 'boostr_lang';
  const getLang = () => localStorage.getItem(langKey) || ((navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en');
  let currentLang = getLang();
  window.BOOSTRI18N = { get lang(){return currentLang}, setLang };
  const clean = text => String(text || '').replace(/\s+/g,' ').trim();
  const fixed = text => FIXED.has(clean(text));
  function translateText(text) {
    const raw = String(text || '');
    const trimmed = clean(raw);
    if (!trimmed || fixed(trimmed)) return raw;
    const value = dict[currentLang]?.[trimmed];
    return value ? raw.replace(trimmed, value) : raw;
  }
  function applyLang(root = document.body) {
    document.documentElement.lang = currentLang;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode(node){ const p=node.parentElement; if(!p || ['SCRIPT','STYLE','NOSCRIPT','TEXTAREA'].includes(p.tagName) || p.closest('[data-no-i18n]')) return NodeFilter.FILTER_REJECT; return clean(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }});
    const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => node.nodeValue = translateText(node.nodeValue));
    document.querySelectorAll('[placeholder]').forEach(el => { const v=el.getAttribute('placeholder'); const next=placeholders[currentLang]?.[v] || dict[currentLang]?.[v]; if(next) el.setAttribute('placeholder', next); });
    document.querySelectorAll('[title]').forEach(el => { const v=el.getAttribute('title'); const next=dict[currentLang]?.[v]; if(next) el.setAttribute('title', next); });
    document.querySelectorAll('#boostrLangToggle button').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentLang));
  }
  function injectLangToggle() {
    if (document.getElementById('boostrLangToggle')) return;
    const toggle = document.createElement('div');
    toggle.id = 'boostrLangToggle';
    toggle.className = 'boostr-lang-toggle';
    toggle.setAttribute('data-no-i18n','true');
    toggle.innerHTML = '<button type="button" data-lang="en">EN</button><button type="button" data-lang="es">ES</button>';
    toggle.addEventListener('click', event => { const btn = event.target.closest('[data-lang]'); if (btn) setLang(btn.dataset.lang); });
    document.body.appendChild(toggle);
  }
  function setLang(lang) { currentLang = lang === 'es' ? 'es' : 'en'; localStorage.setItem(langKey, currentLang); applyLang(); }

  const cardSelector = '.module,.metric,.task,.switch-card,.contract-card,.system-tile,.flow-row,.role-card,.signal,.stat,.item,.insight,.smart-block';
  const cards = [...document.querySelectorAll(cardSelector)];
  cards.forEach((card, i) => {
    card.style.setProperty('--float-i', i % 12);
    card.setAttribute('draggable', 'true');
    card.dataset.searchText = (card.textContent || '').toLowerCase();
    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
  [...new Set(cards.map(c => c.parentElement).filter(Boolean))].forEach(parent => {
    parent.addEventListener('dragover', event => {
      event.preventDefault();
      const dragging = parent.querySelector('.dragging');
      if (!dragging) return;
      const siblings = [...parent.querySelectorAll(cardSelector + ':not(.dragging)')];
      const after = siblings.find(el => event.clientY <= el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2);
      parent.insertBefore(dragging, after || null);
    });
  });

  const types = ['line','bars','wave'];
  document.querySelectorAll('.metric,.signal,.contract-card,.stat').forEach((card, i) => {
    if (card.querySelector('.boostr-viz')) return;
    const row = document.createElement('div'); row.className = 'boostr-row';
    const viz = document.createElement('div'); viz.className = 'boostr-viz ' + types[i % 3]; row.appendChild(viz);
    if (i % 3 === 0) { const ring = document.createElement('div'); const val = [64,78,86,92][i % 4]; ring.className = 'boostr-ring'; ring.style.setProperty('--p', val); ring.dataset.label = val + '%'; row.appendChild(ring); }
    card.appendChild(row);
  });
  document.querySelectorAll('.module,.task,.switch-card,.flow-row').forEach(card => { if (card.querySelector('.boostr-system-name')) return; const label = document.createElement('div'); label.className = 'boostr-system-name'; label.textContent = 'BOOSTR OS'; card.prepend(label); });

  document.querySelectorAll('.search').forEach(box => {
    if (box.querySelector('input')) return;
    const input = document.createElement('input'); input.className = 'booster-search-input'; input.type = 'search'; input.placeholder = (box.textContent || 'Search...').trim() || 'Search...'; box.textContent = ''; box.appendChild(input);
    input.addEventListener('input', () => { const q = input.value.trim().toLowerCase(); cards.forEach(card => card.classList.toggle('boostr-hidden-by-search', q && !(card.dataset.searchText || '').includes(q))); });
  });
  document.querySelectorAll('a[href="/portfolio"]').forEach(a => { if (a.closest('.network-grid') || a.closest('.timeline') || a.closest('.compact-main')) return; a.href = '/modules'; if ((a.textContent || '').toLowerCase().includes('portfolio')) a.textContent = 'Modules'; if (a.title === 'Portfolio') a.title = 'Modules'; });
  document.querySelectorAll('a[href="/audit"],a[href="/audit/"]').forEach(a => { if (location.pathname.startsWith('/audit')) return; a.target = '_blank'; a.rel = 'noopener noreferrer'; });
  const footer = document.querySelector('.footer');
  if (footer && !/powered by/i.test(footer.textContent)) { const os = document.querySelector('.greeting strong')?.textContent?.trim() || 'OS'; footer.innerHTML = `POWERED BY <strong>BOOSTR LABS</strong> · ${os}`; }
  injectLangToggle();
  applyLang();
})();
