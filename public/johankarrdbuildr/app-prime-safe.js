(() => {
  'use strict';

  const KEY = 'johankarrd-buildr-v6';
  const SYNC_FLAG = 'johankarrd-prime-safe-synced-v53';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));

  const seed = () => {
    try { return JSON.parse(JSON.stringify(window.JOHANKARRD_SEED || {})); }
    catch (_) { return {}; }
  };

  const readSites = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      return saved && typeof saved === 'object' ? saved : seed();
    } catch (_) {
      return seed();
    }
  };

  const writeSites = (sites) => localStorage.setItem(KEY, JSON.stringify(sites || {}));

  const status = (text) => {
    const node = $('[data-status]');
    if (node) node.textContent = text;
  };

  const currentSlug = () => $('[data-site-select]')?.value || Object.keys(readSites())[0] || 'cafe';

  function thumb(site = {}) {
    const first = (site.sections || [])
      .flatMap((section) => section.items || [])
      .find((item) => item && (item.src || (Array.isArray(item.imgs) && item.imgs[0])));
    const src = first && (first.src || first.imgs?.[0]);
    if (src) return `<img src="${esc(src)}" alt="">`;
    return `<span>${esc((site.name || 'J').slice(0, 1))}</span>`;
  }

  function installCss() {
    if ($('#prime-safe-css')) return;
    document.head.insertAdjacentHTML('beforeend', `<style id="prime-safe-css">
      .prime-manager-btn{width:100%;display:grid;grid-template-columns:52px 1fr auto;gap:12px;align-items:center;text-align:left;border:1px solid rgba(255,255,255,.15);background:linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.035));color:#fff;border-radius:23px;padding:10px;cursor:pointer;box-shadow:0 18px 42px rgba(0,0,0,.22);margin:0 0 10px;transition:.18s}
      .prime-manager-btn:hover{transform:translateY(-1px);border-color:rgba(254,237,185,.55)}
      .prime-manager-btn .p-thumb,.prime-row .p-thumb,.mobile-site .p-thumb{border-radius:16px;background:#000;border:1px solid rgba(255,255,255,.12);overflow:hidden;display:grid;place-items:center;color:#feedb9;font-weight:1000}
      .prime-manager-btn .p-thumb{width:52px;height:66px}.prime-manager-btn img,.prime-row img,.mobile-site img{width:100%;height:100%;object-fit:cover}.prime-manager-btn b{display:block;font-size:14px}.prime-manager-btn small{display:block;color:rgba(255,255,255,.52);font-size:10px;margin-top:3px}.prime-manager-btn i{font-style:normal;color:#feedb9;font-size:18px}.prime-love-badge{margin:12px 0;padding:12px;border-radius:18px;border:1px solid rgba(254,237,185,.28);background:linear-gradient(135deg,rgba(254,237,185,.14),rgba(139,232,255,.08));color:rgba(255,255,255,.75);font:800 12px/1.35 Arial}.prime-search{width:100%;border:1px solid rgba(255,255,255,.13);background:rgba(0,0,0,.35);color:#fff;border-radius:16px;padding:12px;outline:none;margin:0 0 12px}.prime-rows{display:grid;gap:10px;max-height:56vh;overflow:auto}.prime-row{display:grid;grid-template-columns:62px 1fr;gap:12px;align-items:center;padding:11px;border:1px solid rgba(255,255,255,.11);border-radius:22px;background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.025))}.prime-row .p-thumb{width:62px;height:78px}.prime-row b,.prime-row span,.prime-row small{display:block}.prime-row span,.prime-row small{color:rgba(255,255,255,.5);font-size:11px;margin-top:3px}.prime-row-actions{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap}.prime-row-actions button,.prime-row-actions a{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;border-radius:999px;padding:8px 11px;font:900 10px/1 Arial;text-decoration:none}.prime-row-actions .danger{border-color:rgba(255,106,125,.38);color:#ffb7c0}.prime-mobile-dock,.prime-mobile-close{display:none}.prime-drag-ghost{position:fixed;top:-999px;left:-999px;z-index:9999;border-radius:18px;overflow:hidden;box-shadow:0 28px 90px rgba(0,0,0,.72);opacity:.95;pointer-events:none;background:#000}
      @media(max-width:820px){html,body{height:100%;overflow:hidden}.app{grid-template-rows:92px 1fr}.topbar{padding:8px 9px;gap:8px}.brand{min-width:174px}.brand strong{font-size:24px;line-height:1.03;max-width:124px}.brand small{font-size:10px}.actions{overflow-x:auto;gap:10px;scrollbar-width:none}.actions::-webkit-scrollbar{display:none}.actions .btn{padding:14px 18px;font-size:15px;white-space:nowrap}.actions .btn:nth-child(3),.actions .btn:nth-child(4),.actions .btn:nth-child(5){display:none}.workspace{display:block;padding:0;height:calc(100vh - 92px);overflow:hidden}.preview-panel{height:100%;border-radius:0;padding:12px;display:grid;place-items:center;background:linear-gradient(145deg,rgba(64,95,130,.28),rgba(255,255,255,.035));box-shadow:none}.device{width:100%;height:calc(100vh - 136px);border-width:7px;border-radius:30px}.left-panel,.editor-panel{display:none!important}.prime-show-sites .left-panel,.prime-show-edit .editor-panel{display:block!important;position:fixed;left:0;right:0;bottom:0;z-index:85;max-height:74vh;overflow:auto;border-radius:30px 30px 0 0;padding:18px 14px 92px;background:linear-gradient(145deg,rgba(21,26,37,.98),rgba(8,10,15,.97));box-shadow:0 -28px 90px rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.16)}.prime-mobile-dock{position:fixed;left:10px;right:10px;bottom:12px;z-index:80;display:flex;gap:8px;padding:8px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:rgba(5,7,10,.84);backdrop-filter:blur(20px);box-shadow:0 18px 60px rgba(0,0,0,.56)}.prime-mobile-dock button{flex:1;border:0;border-radius:999px;background:rgba(255,255,255,.08);color:#fff;padding:12px 7px;font:900 11px/1 Arial}.prime-mobile-dock button:nth-child(3),.prime-mobile-dock button:nth-child(4){background:linear-gradient(135deg,#fff5c7,#feedb9,#8be8ff);color:#061f3d}.prime-mobile-close{display:none}.prime-show-sites .prime-mobile-close,.prime-show-edit .prime-mobile-close{display:block;position:fixed;right:18px;bottom:25px;z-index:90;border:0;border-radius:999px;padding:13px 18px;background:linear-gradient(135deg,#fff5c7,#feedb9,#8be8ff);color:#061f3d;font-weight:1000}.status{bottom:78px;left:18px;right:18px}.modal-card{max-height:78vh}.prime-row{grid-template-columns:54px 1fr}.prime-row .p-thumb{width:54px;height:68px}}
    </style>`);
  }

  async function api(url, options = {}) {
    const response = await fetch(url, { cache: 'no-store', ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || String(response.status));
    return data;
  }

  async function syncSites({ reload = false } = {}) {
    const local = { ...seed(), ...readSites() };
    let changed = false;
    try {
      const data = await api('/api/johankarrd/sites');
      for (const [key, site] of Object.entries(data.sites || {})) {
        if (!local[key] || JSON.stringify(local[key]) !== JSON.stringify(site)) {
          local[key] = site;
          changed = true;
        }
      }
      writeSites(local);
      status('Cloud sites synced.');
    } catch (_) {
      status('Cloud unavailable. Local draft loaded.');
    }
    if (changed && reload && !sessionStorage.getItem(SYNC_FLAG)) {
      sessionStorage.setItem(SYNC_FLAG, '1');
      location.href = '/johankarrdbuildr/?v=53';
    }
    return local;
  }

  function ensureManagerButton() {
    const field = $('[data-site-select]')?.closest('.field');
    if (!field || field.querySelector('[data-prime-manager]')) return;
    const sites = readSites();
    const site = sites[currentSlug()] || {};
    field.insertAdjacentHTML('afterend', `<button type="button" class="prime-manager-btn" data-prime-manager><span class="p-thumb">${thumb(site)}</span><span><b>${esc(site.name || currentSlug())}</b><small>Open visual site manager</small></span><i>⌄</i></button>`);
  }

  function refreshManagerButton() {
    const button = $('[data-prime-manager]');
    if (!button) return ensureManagerButton();
    const site = readSites()[currentSlug()] || {};
    button.innerHTML = `<span class="p-thumb">${thumb(site)}</span><span><b>${esc(site.name || currentSlug())}</b><small>Open visual site manager</small></span><i>⌄</i>`;
  }

  function openModal(html) {
    $('.modal-backdrop')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop"><div class="modal-card">${html}</div></div>`);
  }

  function openSiteManager() {
    const sites = readSites();
    const rows = Object.entries(sites)
      .sort((a, b) => String(a[1]?.name || a[0]).localeCompare(String(b[1]?.name || b[0])))
      .map(([key, site]) => {
        const slug = site.slug || key;
        const protectedSite = ['cafe', 'cafedelmar', 'inventory', 'solveinventory'].includes(key) || ['cafedelmar', 'solveinventory'].includes(slug);
        return `<article class="prime-row"><div class="p-thumb">${thumb(site)}</div><div><b>${esc(site.name || key)}</b><span>/${esc(slug)}/</span><small>${protectedSite ? 'Protected template' : 'Draft / Published'}</small></div><div class="prime-row-actions"><button type="button" data-prime-edit="${esc(key)}">Edit</button><a href="/johankarrd/${esc(slug)}/" target="_blank" rel="noopener">Live</a><button type="button" data-prime-copy="${esc(key)}">Duplicate</button>${protectedSite ? '' : `<button type="button" class="danger" data-prime-delete="${esc(key)}">Delete</button>`}</div></article>`;
      }).join('');
    openModal(`<div class="modal-head"><img src="/assets/link/82ngel/logo.png" alt=""><div><small>JOHANKA OS PRIME</small><h2>Johankarrds</h2></div></div><input class="prime-search" data-prime-search placeholder="Search Carrds"><div class="prime-love-badge">Unlimited forever. Free because she is Janko Diorr’s wife.</div><div class="prime-rows">${rows}</div><div class="modal-actions"><button class="btn" data-close-modal>Close</button><button class="btn gold" data-action="new-site">New</button></div>`);
  }

  function dispatchNative(selector) {
    const target = $(selector);
    if (target) target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }

  function openMobilePanel(panel) {
    document.body.classList.remove('prime-show-sites', 'prime-show-edit');
    if (panel === 'sites') document.body.classList.add('prime-show-sites');
    if (panel === 'edit' || panel === 'assets') {
      if (panel === 'assets') document.querySelector('[data-mode="assets"]')?.click();
      if (panel === 'edit') document.querySelector('[data-mode="content"]')?.click();
      document.body.classList.add('prime-show-edit');
    }
  }

  function installMobileDock() {
    if ($('.prime-mobile-dock')) return;
    document.body.insertAdjacentHTML('beforeend', `<nav class="prime-mobile-dock"><button type="button" data-mobile-sites>Sites</button><button type="button" data-mobile-edit>Edit</button><button type="button" data-mobile-add>+ Add</button><button type="button" data-mobile-publish>Publish</button><button type="button" data-mobile-assets>Assets</button></nav><button type="button" class="prime-mobile-close" data-mobile-close>Done</button>`);
  }

  function installFloatingDrag() {
    if (window.__primeSafeDrag) return;
    window.__primeSafeDrag = true;
    document.addEventListener('dragstart', (event) => {
      const source = event.target.closest('[data-preview-item], [data-asset]');
      if (!source) return;
      const ghost = source.cloneNode(true);
      ghost.className = 'prime-drag-ghost';
      ghost.style.width = Math.min(source.offsetWidth || 180, 230) + 'px';
      ghost.style.height = Math.min(source.offsetHeight || 120, 180) + 'px';
      document.body.append(ghost);
      try { event.dataTransfer.setDragImage(ghost, Math.min(90, ghost.offsetWidth / 2), 32); } catch (_) {}
      setTimeout(() => ghost.remove(), 1000);
    }, true);
  }

  function installEvents() {
    document.addEventListener('click', async (event) => {
      if (event.target.closest('[data-prime-manager]')) {
        event.preventDefault();
        await syncSites();
        openSiteManager();
        return;
      }
      if (event.target.closest('[data-close-modal]') || event.target.classList.contains('modal-backdrop')) {
        $('.modal-backdrop')?.remove();
        return;
      }
      const edit = event.target.closest('[data-prime-edit]');
      if (edit) {
        const select = $('[data-site-select]');
        if (select) {
          select.value = edit.dataset.primeEdit;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        $('.modal-backdrop')?.remove();
        setTimeout(refreshManagerButton, 100);
        return;
      }
      const copy = event.target.closest('[data-prime-copy]');
      if (copy) {
        const sites = readSites();
        const original = sites[copy.dataset.primeCopy];
        if (original) {
          const nextKey = String((original.name || 'Johankarrd') + ' copy').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-4);
          sites[nextKey] = JSON.parse(JSON.stringify(original));
          sites[nextKey].name = (original.name || 'Johankarrd') + ' copy';
          sites[nextKey].slug = nextKey;
          writeSites(sites);
          location.href = '/johankarrdbuildr/?v=53';
        }
        return;
      }
      const del = event.target.closest('[data-prime-delete]');
      if (del) {
        const key = del.dataset.primeDelete;
        const sites = readSites();
        const before = JSON.parse(JSON.stringify(sites));
        delete sites[key];
        writeSites(sites);
        $('.modal-backdrop')?.remove();
        status('Deleted locally. Undo available for 5 seconds.');
        const toast = document.createElement('div');
        toast.className = 'undo-toast';
        toast.innerHTML = '<span>Deleted</span><button type="button">Undo</button>';
        let cancelled = false;
        toast.querySelector('button').onclick = () => { cancelled = true; writeSites(before); toast.remove(); location.href = '/johankarrdbuildr/?v=53'; };
        document.body.append(toast);
        setTimeout(async () => {
          toast.remove();
          if (cancelled) return;
          try {
            await api('/api/johankarrd/delete', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug: key, confirmation: `BORRAR ${key}` }) });
            await api('/api/johankarrd/drafts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sites }) });
          } catch (_) {
            writeSites(before);
            status('Delete failed. Restored.');
          }
          location.href = '/johankarrdbuildr/?v=53';
        }, 5000);
        return;
      }
      const search = event.target.closest('[data-prime-search]');
      if (search) return;
      if (event.target.closest('[data-mobile-sites]')) return openMobilePanel('sites');
      if (event.target.closest('[data-mobile-edit]')) return openMobilePanel('edit');
      if (event.target.closest('[data-mobile-assets]')) return openMobilePanel('assets');
      if (event.target.closest('[data-mobile-add]')) return dispatchNative('[data-act="add-block"]');
      if (event.target.closest('[data-mobile-publish]')) return dispatchNative('[data-action="publish-draft"]');
      if (event.target.closest('[data-mobile-close]')) return document.body.classList.remove('prime-show-sites', 'prime-show-edit');
    }, false);

    document.addEventListener('input', (event) => {
      if (!event.target.matches('[data-prime-search]')) return;
      const query = event.target.value.toLowerCase();
      $$('.prime-row').forEach((row) => { row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none'; });
    });

    $('[data-site-select]')?.addEventListener('change', () => setTimeout(refreshManagerButton, 100));
  }

  window.addEventListener('load', async () => {
    installCss();
    ensureManagerButton();
    installMobileDock();
    installFloatingDrag();
    installEvents();
    await syncSites({ reload: true });
    refreshManagerButton();
  });
})();
