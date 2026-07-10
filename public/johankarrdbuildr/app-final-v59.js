(() => {
  'use strict';

  const KEY = 'johankarrd-buildr-v6';
  const RELOAD_KEY = 'johankarrd-v59-clean-reload';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const slugify = (value = '') => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  function canonical(site = {}, fallback = '') {
    const slug = slugify(site.slug || fallback || site.name);
    const name = slugify(site.name || '');
    if (['inventory', 'solve-inventory', 'solveinventory'].includes(slug) || name === 'solve-inventory') return 'solveinventory';
    if (['cafe', 'cafe-del-mar', 'cafedelmar'].includes(slug) || name === 'cafe-del-mar') return 'cafedelmar';
    return slug || name || slugify(fallback);
  }

  function storageKey(id) {
    if (id === 'cafedelmar') return 'cafe';
    if (id === 'solveinventory') return 'inventory';
    return id;
  }

  function score(site = {}) {
    const sections = Array.isArray(site.sections) ? site.sections : [];
    const items = sections.reduce((sum, section) => sum + (Array.isArray(section?.items) ? section.items.length : 0), 0);
    return sections.length * 100 + items * 10 + (site.slug ? 1 : 0);
  }

  function dedupe(input = {}) {
    const output = {};
    for (const [key, raw] of Object.entries(input || {})) {
      if (!raw || typeof raw !== 'object') continue;
      const id = canonical(raw, key);
      if (!id) continue;
      const target = storageKey(id);
      const site = { ...raw, slug: id, sections: Array.isArray(raw.sections) ? raw.sections : [] };
      if (!output[target] || score(site) > score(output[target])) output[target] = site;
    }
    return output;
  }

  function readLocal() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
    catch (_) { return {}; }
  }

  function writeLocal(sites) {
    localStorage.setItem(KEY, JSON.stringify(dedupe(sites)));
  }

  function hideLegacySelector() {
    const field = $('[data-site-select]')?.closest('.field');
    if (!field) return;
    Object.assign(field.style, {
      position: 'absolute', width: '1px', height: '1px', overflow: 'hidden',
      opacity: '0', pointerEvents: 'none', margin: '0', padding: '0'
    });
    field.setAttribute('aria-hidden', 'true');
    $$('[data-prime-manager]').slice(1).forEach((node) => node.remove());
  }

  function rebuildSelect(sites) {
    const select = $('[data-site-select]');
    if (!select) return;
    const current = select.value;
    select.innerHTML = Object.entries(sites).map(([key, site]) => {
      const label = String(site.name || key).replace(/[&<>"']/g, '');
      return `<option value="${key}">${label}</option>`;
    }).join('');
    select.value = sites[current] ? current : (Object.keys(sites)[0] || '');
  }

  function closeTopLayer() {
    const modal = $('.modal-backdrop');
    if (modal) { modal.remove(); return true; }
    const sheet = $('[data-mobile-sheet].open');
    if (sheet) { $('[data-mobile-close]')?.click(); return true; }
    return false;
  }

  function polish() {
    hideLegacySelector();
    $$('.font-card').forEach((card) => {
      card.querySelectorAll('b,span').forEach((node) => { node.style.fontFamily = 'inherit'; });
    });
  }

  async function synchronize() {
    const local = dedupe(readLocal());
    let merged = local;
    try {
      const response = await fetch('/api/johankarrd/sites', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        merged = dedupe({ ...local, ...(data.sites || {}) });
      }
    } catch (_) {}

    const before = JSON.stringify(local);
    const after = JSON.stringify(merged);
    writeLocal(merged);
    rebuildSelect(merged);

    try {
      await fetch('/api/johankarrd/drafts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sites: merged })
      });
    } catch (_) {}

    if (before !== after && !sessionStorage.getItem(RELOAD_KEY)) {
      sessionStorage.setItem(RELOAD_KEY, '1');
      location.replace('/johankarrdbuildr/?v=59');
    }
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (closeTopLayer()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    document.activeElement?.blur?.();
  }, true);

  window.addEventListener('load', () => {
    polish();
    new MutationObserver(polish).observe(document.body, { childList: true, subtree: true });
    setTimeout(synchronize, 500);
  });
})();
