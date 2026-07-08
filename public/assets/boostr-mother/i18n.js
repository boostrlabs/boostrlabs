(() => {
  const FIXED = new Set(['BOOSTR Labs','Mother OS','Identity OS','Manager OS','Signal Inbox','Module Deck','Workspace Core','Partner Grid','System Core','BOOSTR Intake','Proof Vault','82NGEL OS','WESTDETRO OS','82 Command','Signal Engine','Revenue Pulse','Fan Radar','Action Queue','Route Map']);
  const STORE_KEY = 'boostr_lang';
  const FALLBACK = 'en';
  const detect = () => {
    const stored = localStorage.getItem(STORE_KEY);
    if (stored === 'en' || stored === 'es') return stored;
    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    return nav.startsWith('es') ? 'es' : FALLBACK;
  };
  const builtIn = {
    en: { label:'EN', phrases:{ 'Inicio':'Home','Abrir':'Open','Acceder':'Access','Continuar':'Continue','Guardar':'Save','Enviar':'Send','Enviar Audit':'Send Audit','Buscar':'Search','Filtrar':'Filter','Estado':'Status','Activo':'Active','Nuevo':'New','Calificado':'Qualified','Perdido':'Lost','Ganado':'Won','Nombre':'Name','Contacto':'Contact','Negocio / proyecto':'Business / project','Industria':'Industry','Etapa':'Stage','Bloqueo principal':'Main blocker','Meta':'Goal','Ready for leads':'BOOSTR Intake','Portfolio':'Proof Vault','Module Registry':'Module Deck','Lead Inbox':'Signal Inbox','Partner Dashboard':'Partner Grid','Manager Leads':'Signal Inbox','FREE BOOSTR Audit':'Free BOOSTR Audit'}, placeholders:{} },
    es: { label:'ES', phrases:{ 'Home':'Inicio','Open':'Abrir','Access':'Acceder','Continue':'Continuar','Save':'Guardar','Send':'Enviar','Send Audit':'Enviar Audit','Search':'Buscar','Filter':'Filtrar','Status':'Estado','Active':'Activo','New':'Nuevo','Qualified':'Calificado','Lost':'Perdido','Won':'Ganado','Name':'Nombre','Contact':'Contacto','Business / project':'Negocio / proyecto','Industry':'Industria','Stage':'Etapa','Main blocker':'Bloqueo principal','Goal':'Meta','Ready for leads':'BOOSTR Intake','Portfolio':'Proof Vault','Module Registry':'Module Deck','Lead Inbox':'Signal Inbox','Partner Dashboard':'Partner Grid','Manager Leads':'Signal Inbox','Free BOOSTR Audit':'BOOSTR Audit gratis','FREE BOOSTR Audit':'BOOSTR Audit gratis'}, placeholders:{} }
  };
  const state = { lang: detect(), dicts: {} };
  window.BOOSTRI18N = { get lang(){ return state.lang; }, setLang };

  async function loadDict(lang) {
    if (state.dicts[lang]) return state.dicts[lang];
    try {
      const res = await fetch(`/assets/boostr-mother/i18n/${lang}.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error('missing dictionary');
      state.dicts[lang] = await res.json();
    } catch (_) {
      state.dicts[lang] = builtIn[lang] || builtIn.en;
    }
    return state.dicts[lang];
  }

  function clean(text) { return String(text || '').replace(/\s+/g, ' ').trim(); }
  function protectFixed(text) {
    for (const name of FIXED) if (clean(text) === name) return true;
    return false;
  }
  function translateText(text, dict, fallback) {
    const raw = String(text || '');
    const trimmed = clean(raw);
    if (!trimmed || protectFixed(trimmed)) return raw;
    const value = dict.phrases?.[trimmed] || fallback.phrases?.[trimmed];
    if (!value) return raw;
    return raw.replace(trimmed, value);
  }
  function translateAttr(el, attr, dict, fallback) {
    const value = el.getAttribute(attr);
    if (!value || protectFixed(value)) return;
    const map = attr === 'placeholder' ? 'placeholders' : 'phrases';
    const next = dict[map]?.[value] || fallback[map]?.[value] || dict.phrases?.[value] || fallback.phrases?.[value];
    if (next) el.setAttribute(attr, next);
  }
  function walk(root, dict, fallback) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        if (!p || ['SCRIPT','STYLE','NOSCRIPT','TEXTAREA'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
        if (p.closest('[data-no-i18n]')) return NodeFilter.FILTER_REJECT;
        if (!clean(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => { node.nodeValue = translateText(node.nodeValue, dict, fallback); });
    root.querySelectorAll('[placeholder]').forEach(el => translateAttr(el, 'placeholder', dict, fallback));
    root.querySelectorAll('[title]').forEach(el => translateAttr(el, 'title', dict, fallback));
    root.querySelectorAll('[aria-label]').forEach(el => translateAttr(el, 'aria-label', dict, fallback));
    document.documentElement.lang = state.lang;
  }
  function injectToggle() {
    if (document.getElementById('boostrLangToggle')) return;
    const style = document.createElement('style');
    style.textContent = `.boostr-lang-toggle{display:inline-flex;gap:3px;align-items:center;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.28);backdrop-filter:blur(18px);border-radius:999px;padding:4px;z-index:20}.boostr-lang-toggle button{border:0;background:transparent;color:rgba(255,255,255,.62);border-radius:999px;padding:7px 9px;font-size:10px;font-weight:950;letter-spacing:.08em;cursor:pointer}.boostr-lang-toggle button.active{background:rgba(255,255,255,.18);color:#fff}.boostr-lang-toggle.floating{position:fixed;right:16px;bottom:16px;box-shadow:0 18px 70px rgba(0,0,0,.42)}.topbar .boostr-lang-toggle{margin-left:auto}@media(max-width:680px){.topbar .boostr-lang-toggle{position:fixed;right:14px;bottom:14px}.boostr-lang-toggle button{padding:7px 8px}}`;
    document.head.appendChild(style);
    const wrap = document.createElement('div');
    wrap.className = 'boostr-lang-toggle';
    wrap.id = 'boostrLangToggle';
    wrap.setAttribute('data-no-i18n','true');
    wrap.innerHTML = `<button type="button" data-lang="en">EN</button><button type="button" data-lang="es">ES</button>`;
    const host = document.querySelector('.topbar') || document.querySelector('.top') || document.querySelector('.compact-side') || document.body;
    if (host === document.body) wrap.classList.add('floating');
    host.appendChild(wrap);
    wrap.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-lang]');
      if (btn) setLang(btn.dataset.lang);
    });
  }
  function updateToggle() {
    document.querySelectorAll('#boostrLangToggle [data-lang]').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === state.lang));
  }
  async function apply() {
    injectToggle();
    const fallback = await loadDict(FALLBACK);
    const dict = await loadDict(state.lang);
    walk(document.body, dict, fallback);
    updateToggle();
    document.dispatchEvent(new CustomEvent('boostr:language', { detail: { lang: state.lang } }));
  }
  async function setLang(lang) {
    state.lang = lang === 'es' ? 'es' : 'en';
    localStorage.setItem(STORE_KEY, state.lang);
    await apply();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
