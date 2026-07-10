(() => {
  'use strict';

  const KEY = 'johankarrd-buildr-v6';
  const SYNC_KEY = 'johankarrd-v59-synced';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const preflight = window.JOHANKARRD_PREFLIGHT || {};
  const dedupe = preflight.dedupe || ((sites) => sites || {});

  const read = () => {
    try { return dedupe(JSON.parse(localStorage.getItem(KEY) || '{}') || {}); }
    catch (_) { return {}; }
  };

  const write = (sites) => localStorage.setItem(KEY, JSON.stringify(dedupe(sites || {})));
  const status = (text) => { const node = $('[data-status]'); if (node) node.textContent = text; };

  function installCss() {
    if ($('#final-v59-css')) return;
    document.head.insertAdjacentHTML('beforeend', `<style id="final-v59-css">
      [data-site-select]{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;clip-path:inset(50%)!important}
      .left-panel>.field:has([data-site-select]){position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important}
      .font-card,.font-card b,.font-card span{font-family:inherit!important}
      .font-card b{font-size:16px!important;letter-spacing:-.02em}.font-card span{font-size:10px!important}
      .prime-love-badge{overflow:hidden!important}
      .burli-card{position:relative}.burli-card:after{content:"BURLI CLUB";position:absolute;right:-18px;bottom:-12px;font:1000 30px/1 Arial;letter-spacing:-.07em;color:rgba(255,255,255,.025);transform:rotate(-8deg);pointer-events:none}
      .media-simple .advanced-url{display:none!important}.media-simple.show-advanced .advanced-url{display:block!important}
      .media-upload-primary{user-select:none;-webkit-user-select:none}
      .preset-copy b{font-size:14px!important}.preset-copy span{font-size:10px!important}
      .preset-art{position:relative;overflow:hidden}.preset-art:after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 20%,rgba(255,255,255,.22) 48%,transparent 70%);transform:translateX(-120%);animation:presetShine 5s ease-in-out infinite}@keyframes presetShine{50%,100%{transform:translateX(120%)}}
    </style>`);
  }

  function hideLegacySelector() {
    const select = $('[data-site-select]');
    if (!select) return;
    const field = select.closest('.field');
    if (field) {
      field.setAttribute('aria-hidden', 'true');
      field.style.position = 'absolute';
      field.style.width = '1px';
      field.style.height = '1px';
      field.style.overflow = 'hidden';
      field.style.opacity = '0';
      field.style.pointerEvents = 'none';
    }
    const managers = $$('[data-prime-manager]');
    managers.slice(1).forEach((node) => node.remove());
  }

  function closeTopLayer() {
    const modal = $('.modal-backdrop');
    if (modal) { modal.remove(); return true; }
    const sheet = $('[data-mobile-sheet].open');
    if (sheet) { $('[data-mobile-close]')?.click(); return true; }
    const menu = $('[data-mobile-more-menu],.prime-quick-menu');
    if (menu) { menu.remove(); return true; }
    return false;
  }

  async function syncCloud() {
    try {
      const response = await fetch('/api/johankarrd/sites', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const cleaned = dedupe(data.sites || {});
      const before = JSON.stringify(read());
      const after = JSON.stringify(cleaned);
      write(cleaned);
      if (before !== after && !sessionStorage.getItem(SYNC_KEY)) {
        sessionStorage.setItem(SYNC_KEY, '1');
        status('Sites synchronized.');
        location.replace('/johankarrdbuildr/?v=59');
      }
    } catch (_) {}
  }

  async function persistCleanState() {
    const sites = read();
    write(sites);
    try {
      await fetch('/api/johankarrd/drafts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sites })
      });
    } catch (_) {}
  }

  function inspect() {
    hideLegacySelector();
    $$('.font-card').forEach((card) => {
      const inline = card.getAttribute('style') || '';
      if (inline.includes('font-family')) card.querySelectorAll('b,span').forEach((node) => { node.style.fontFamily = 'inherit'; });
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (closeTopLayer()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  }, true);

  window.addEventListener('load', () => {
    installCss();
    write(read());
    inspect();
    const observer = new MutationObserver(inspect);
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(syncCloud, 450);
    setTimeout(persistCleanState, 1400);
  });
})();
