(() => {
  'use strict';

  const KEY = 'johankarrd-buildr-v6';
  const CURRENT_SITE_KEY = 'johankarrd-current-site';
  const CURRENT_SECTION_KEY = 'johankarrd-current-section';
  const MOBILE = window.matchMedia('(max-width: 820px)');
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));

  let sheet = null;
  let activePanel = null;
  let panelAnchor = null;
  let touchDrag = null;

  const status = (text) => {
    const node = $('[data-status]');
    if (node) node.textContent = text;
  };

  const readSites = () => {
    try {
      const sites = JSON.parse(localStorage.getItem(KEY) || 'null');
      return sites && typeof sites === 'object' ? sites : {};
    } catch (_) {
      return {};
    }
  };

  const writeSites = (sites) => localStorage.setItem(KEY, JSON.stringify(sites || {}));
  const currentSlug = () => $('[data-site-select]')?.value || Object.keys(readSites())[0] || 'cafe';
  const currentSection = () => $('[data-sec].active')?.dataset.sec || $('[data-sec]')?.dataset.sec || 'home';

  function thumbnail(site = {}) {
    const first = (site.sections || []).flatMap((section) => section.items || []).find((item) => item?.src || item?.imgs?.[0]);
    const src = first?.src || first?.imgs?.[0];
    return src ? `<img src="${esc(src)}" alt="">` : `<span>${esc((site.name || 'J').slice(0, 1))}</span>`;
  }

  function installCss() {
    if ($('#prime-safe-css-v54')) return;
    document.head.insertAdjacentHTML('beforeend', `<style id="prime-safe-css-v54">
      .prime-manager-btn{width:100%;display:grid;grid-template-columns:52px 1fr auto;gap:12px;align-items:center;text-align:left;border:1px solid rgba(255,255,255,.15);background:linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.035));color:#fff;border-radius:23px;padding:10px;cursor:pointer;box-shadow:0 18px 42px rgba(0,0,0,.22);margin:10px 0;transition:.18s}
      .prime-manager-btn:hover{transform:translateY(-1px);border-color:rgba(254,237,185,.55)}
      .prime-manager-btn .p-thumb,.prime-row .p-thumb{border-radius:16px;background:#000;border:1px solid rgba(255,255,255,.12);overflow:hidden;display:grid;place-items:center;color:#feedb9;font-weight:1000}
      .prime-manager-btn .p-thumb{width:52px;height:66px}.prime-manager-btn img,.prime-row img{width:100%;height:100%;object-fit:cover}.prime-manager-btn b{display:block;font-size:14px}.prime-manager-btn small{display:block;color:rgba(255,255,255,.52);font-size:10px;margin-top:3px}.prime-manager-btn i{font-style:normal;color:#feedb9;font-size:18px}
      .prime-love-badge{margin:12px 0;padding:12px;border-radius:18px;border:1px solid rgba(254,237,185,.28);background:linear-gradient(135deg,rgba(254,237,185,.14),rgba(139,232,255,.08));color:rgba(255,255,255,.75);font:800 12px/1.35 Arial}
      .prime-search{width:100%;border:1px solid rgba(255,255,255,.13);background:rgba(0,0,0,.35);color:#fff;border-radius:16px;padding:12px;outline:none;margin:0 0 12px}.prime-rows{display:grid;gap:10px;max-height:56vh;overflow:auto}.prime-row{display:grid;grid-template-columns:62px 1fr;gap:12px;align-items:center;padding:11px;border:1px solid rgba(255,255,255,.11);border-radius:22px;background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.025))}.prime-row .p-thumb{width:62px;height:78px}.prime-row b,.prime-row span,.prime-row small{display:block}.prime-row span,.prime-row small{color:rgba(255,255,255,.5);font-size:11px;margin-top:3px}.prime-row-actions{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap}.prime-row-actions button,.prime-row-actions a{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;border-radius:999px;padding:8px 11px;font:900 10px/1 Arial;text-decoration:none}.prime-row-actions .danger{border-color:rgba(255,106,125,.38);color:#ffb7c0}
      .prime-mobile-dock,.prime-mobile-sheet{display:none}.prime-touch-ghost{position:fixed;z-index:1300;pointer-events:none;opacity:.94;border-radius:18px;overflow:hidden;background:#08090c;box-shadow:0 28px 90px rgba(0,0,0,.72);transform:scale(1.04) rotate(-1deg)}.prime-touch-source{opacity:.28!important}.prime-touch-target{outline:2px solid #8be8ff!important;outline-offset:3px!important}
      @media(max-width:820px){
        html,body{height:100%;min-height:100%;overflow:hidden}.app{height:100dvh;grid-template-rows:88px 1fr;padding-bottom:0}.topbar{height:88px;padding:8px 9px;gap:8px}.brand{min-width:172px}.brand strong{font-size:23px;line-height:1.02;max-width:120px}.brand small{font-size:10px}.actions{overflow-x:auto;gap:8px;scrollbar-width:none}.actions::-webkit-scrollbar{display:none}.actions .btn{padding:13px 16px;font-size:14px;white-space:nowrap}.actions .btn:nth-child(3),.actions .btn:nth-child(4),.actions .btn:nth-child(5){display:none}
        .workspace{display:block!important;padding:0!important;height:calc(100dvh - 88px)!important;overflow:hidden!important}.workspace>.left-panel,.workspace>.editor-panel{display:none!important}.preview-panel{height:calc(100dvh - 88px);border-radius:0!important;padding:10px 10px calc(76px + env(safe-area-inset-bottom))!important;display:grid;place-items:center;background:linear-gradient(145deg,rgba(64,95,130,.28),rgba(255,255,255,.035));box-shadow:none!important}.device{width:100%!important;height:100%!important;max-height:none!important;border-width:7px!important;border-radius:30px!important}.preview-stage{touch-action:pan-y}
        .prime-mobile-dock{position:fixed;left:10px;right:92px;bottom:calc(9px + env(safe-area-inset-bottom));z-index:1000;display:grid;grid-template-columns:repeat(4,1fr);gap:7px;padding:7px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:rgba(5,7,10,.9);backdrop-filter:blur(22px);box-shadow:0 18px 60px rgba(0,0,0,.56)}.prime-mobile-dock button{border:0;border-radius:999px;background:rgba(255,255,255,.08);color:#fff;padding:12px 5px;font:900 10px/1 Arial;min-width:0}.prime-mobile-dock button:nth-child(3),.prime-mobile-dock button:nth-child(4){background:linear-gradient(135deg,#fff5c7,#feedb9,#8be8ff);color:#061f3d}
        .prime-mobile-sheet{position:fixed;display:none;left:8px;right:8px;top:94px;bottom:calc(72px + env(safe-area-inset-bottom));z-index:900;border:1px solid rgba(255,255,255,.16);border-radius:28px;background:linear-gradient(155deg,rgba(22,28,40,.985),rgba(7,9,14,.985));box-shadow:0 30px 100px rgba(0,0,0,.78);overflow:hidden}.prime-mobile-sheet.open{display:grid;grid-template-rows:auto 1fr;animation:primeSheetIn .2s ease}.prime-sheet-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.1);background:rgba(8,10,15,.94);backdrop-filter:blur(18px)}.prime-sheet-head b{font-size:14px}.prime-sheet-head button{border:0;border-radius:999px;padding:10px 14px;background:linear-gradient(135deg,#fff5c7,#feedb9,#8be8ff);color:#061f3d;font-weight:1000}.prime-sheet-body{overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:0 0 24px}.prime-sheet-body>.panel{display:block!important;position:static!important;width:100%!important;max-width:none!important;height:auto!important;min-height:100%!important;max-height:none!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;padding:14px!important;overflow:visible!important}.prime-sheet-body .codebox{min-height:180px}.prime-row{grid-template-columns:54px 1fr}.prime-row .p-thumb{width:54px;height:68px}.modal-backdrop{z-index:1200!important}.modal-card{max-height:82dvh!important;overflow:auto!important}.status{left:18px;right:100px;bottom:calc(70px + env(safe-area-inset-bottom));z-index:850}.undo-toast,.delete-undo-toast{bottom:calc(76px + env(safe-area-inset-bottom))!important;z-index:1250!important}
      }
      @keyframes primeSheetIn{from{opacity:0;transform:translateY(18px) scale(.985)}to{opacity:1;transform:none}}
    </style>`);
  }

  function ensureManagerButton() {
    const field = $('[data-site-select]')?.closest('.field');
    if (!field || $('[data-prime-manager]')) return;
    const sites = readSites();
    const site = sites[currentSlug()] || {};
    field.insertAdjacentHTML('afterend', `<button type="button" class="prime-manager-btn" data-prime-manager><span class="p-thumb">${thumbnail(site)}</span><span><b>${esc(site.name || currentSlug())}</b><small>Open visual site manager</small></span><i>⌄</i></button>`);
  }

  function refreshManagerButton() {
    ensureManagerButton();
    const button = $('[data-prime-manager]');
    if (!button) return;
    const site = readSites()[currentSlug()] || {};
    button.innerHTML = `<span class="p-thumb">${thumbnail(site)}</span><span><b>${esc(site.name || currentSlug())}</b><small>Open visual site manager</small></span><i>⌄</i>`;
  }

  function openModal(html) {
    $('.modal-backdrop')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop"><div class="modal-card">${html}</div></div>`);
  }

  function openSiteManager() {
    const sites = readSites();
    const rows = Object.entries(sites).sort((a, b) => String(a[1]?.name || a[0]).localeCompare(String(b[1]?.name || b[0]))).map(([key, site]) => {
      const slug = site.slug || key;
      const protectedSite = ['cafe', 'cafedelmar', 'inventory', 'solveinventory'].includes(key) || ['cafedelmar', 'solveinventory'].includes(slug);
      return `<article class="prime-row"><div class="p-thumb">${thumbnail(site)}</div><div><b>${esc(site.name || key)}</b><span>/${esc(slug)}/</span><small>${protectedSite ? 'Protected template' : 'Draft / Published'}</small></div><div class="prime-row-actions"><button type="button" data-prime-edit="${esc(key)}">Edit</button><a href="/johankarrd/${esc(slug)}/" target="_blank" rel="noopener">Live</a><button type="button" data-prime-copy="${esc(key)}">Duplicate</button>${protectedSite ? '' : `<button type="button" class="danger" data-prime-delete="${esc(key)}">Delete</button>`}</div></article>`;
    }).join('');
    openModal(`<div class="modal-head"><img src="/assets/link/82ngel/logo.png" alt=""><div><small>JOHANKA OS PRIME</small><h2>Johankarrds</h2></div></div><input class="prime-search" data-prime-search placeholder="Search Carrds"><div class="prime-love-badge">Unlimited forever. Free because she is Janko Diorr’s wife.</div><div class="prime-rows">${rows}</div><div class="modal-actions"><button class="btn" data-close-modal>Close</button><button class="btn gold" data-action="new-site">New</button></div>`);
  }

  function installMobileUi() {
    if (!MOBILE.matches || $('.prime-mobile-dock')) return;
    document.body.insertAdjacentHTML('beforeend', `<nav class="prime-mobile-dock" aria-label="Builder tools"><button type="button" data-mobile-sites>Sites</button><button type="button" data-mobile-edit>Edit</button><button type="button" data-mobile-add>+ Add</button><button type="button" data-mobile-publish>Publish</button></nav><section class="prime-mobile-sheet" data-mobile-sheet><header class="prime-sheet-head"><b data-sheet-title>Edit</b><button type="button" data-mobile-close>Done</button></header><div class="prime-sheet-body" data-sheet-body></div></section>`);
    sheet = $('[data-mobile-sheet]');
  }

  function restorePanel() {
    if (!activePanel || !panelAnchor) return;
    panelAnchor.parentNode?.insertBefore(activePanel, panelAnchor);
    panelAnchor.remove();
    activePanel.classList.remove('prime-mobile-panel-active');
    activePanel = null;
    panelAnchor = null;
  }

  function closeSheet() {
    restorePanel();
    sheet?.classList.remove('open');
  }

  function openSheet(panel, title) {
    if (!MOBILE.matches || !panel || !sheet) return;
    closeSheet();
    panelAnchor = document.createComment('prime-panel-anchor');
    panel.parentNode?.insertBefore(panelAnchor, panel);
    activePanel = panel;
    panel.classList.add('prime-mobile-panel-active');
    $('[data-sheet-body]', sheet)?.append(panel);
    $('[data-sheet-title]', sheet).textContent = title;
    sheet.classList.add('open');
  }

  function dispatchNative(selector) {
    const target = $(selector);
    if (target) target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  }

  function preserveCurrentAndReload() {
    sessionStorage.setItem(CURRENT_SITE_KEY, currentSlug());
    sessionStorage.setItem(CURRENT_SECTION_KEY, currentSection());
    location.href = '/johankarrdbuildr/?v=54';
  }

  async function saveSites(sites) {
    writeSites(sites);
    try {
      await fetch('/api/johankarrd/drafts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sites }) });
    } catch (_) {}
  }

  function beginTouchDrag(event, source, kind) {
    if (!MOBILE.matches || event.pointerType !== 'touch') return;
    if (event.target.closest('button,a,input,textarea,label,select')) return;
    const point = { x: event.clientX, y: event.clientY };
    const timer = setTimeout(() => {
      const rect = source.getBoundingClientRect();
      const ghost = source.cloneNode(true);
      ghost.className = 'prime-touch-ghost';
      Object.assign(ghost.style, { width: `${Math.min(rect.width, 240)}px`, height: `${Math.min(rect.height, 190)}px`, left: `${point.x - Math.min(rect.width, 240) / 2}px`, top: `${point.y - 34}px` });
      document.body.append(ghost);
      source.classList.add('prime-touch-source');
      touchDrag = { kind, source, ghost, pointerId: event.pointerId, from: Number(source.dataset.previewItem), asset: source.dataset.asset || '', target: null };
      source.setPointerCapture?.(event.pointerId);
      navigator.vibrate?.(20);
    }, 230);
    source.__primeTouchTimer = timer;
  }

  function moveTouchDrag(event) {
    if (!touchDrag || touchDrag.pointerId !== event.pointerId) return;
    event.preventDefault();
    touchDrag.ghost.style.left = `${event.clientX - touchDrag.ghost.offsetWidth / 2}px`;
    touchDrag.ghost.style.top = `${event.clientY - 34}px`;
    $$('.prime-touch-target').forEach((node) => node.classList.remove('prime-touch-target'));
    const beneath = document.elementFromPoint(event.clientX, event.clientY);
    const target = touchDrag.kind === 'reorder' ? beneath?.closest('[data-preview-item]') : beneath?.closest('[data-preview], .preview-stage, .device');
    if (target && target !== touchDrag.source) {
      target.classList.add('prime-touch-target');
      touchDrag.target = target;
    } else {
      touchDrag.target = null;
    }
  }

  async function endTouchDrag(event) {
    const source = event.target.closest?.('[data-preview-item], [data-asset]');
    if (source?.__primeTouchTimer) {
      clearTimeout(source.__primeTouchTimer);
      source.__primeTouchTimer = null;
    }
    if (!touchDrag || touchDrag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const drag = touchDrag;
    touchDrag = null;
    drag.source.classList.remove('prime-touch-source');
    drag.ghost.remove();
    $$('.prime-touch-target').forEach((node) => node.classList.remove('prime-touch-target'));
    if (!drag.target) return;

    const sites = readSites();
    const slug = currentSlug();
    const secId = currentSection();
    const section = sites?.[slug]?.sections?.find((item) => item.id === secId);
    if (!section || !Array.isArray(section.items)) return;

    if (drag.kind === 'reorder') {
      const to = Number(drag.target.dataset.previewItem);
      if (!Number.isInteger(to) || to === drag.from || !section.items[drag.from]) return;
      const [item] = section.items.splice(drag.from, 1);
      section.items.splice(to, 0, item);
      status('Element moved.');
    } else if (drag.kind === 'asset' && drag.asset) {
      section.items.push({ type: 'image', src: drag.asset });
      status('Asset added.');
    }
    await saveSites(sites);
    preserveCurrentAndReload();
  }

  function cancelTouchTimer(event) {
    const source = event.target.closest?.('[data-preview-item], [data-asset]');
    if (source?.__primeTouchTimer && !touchDrag) {
      clearTimeout(source.__primeTouchTimer);
      source.__primeTouchTimer = null;
    }
  }

  function restoreSelection() {
    const wantedSite = sessionStorage.getItem(CURRENT_SITE_KEY);
    const wantedSection = sessionStorage.getItem(CURRENT_SECTION_KEY);
    if (!wantedSite) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const select = $('[data-site-select]');
      if (select && Array.from(select.options).some((option) => option.value === wantedSite)) {
        select.value = wantedSite;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        clearInterval(timer);
        sessionStorage.removeItem(CURRENT_SITE_KEY);
        setTimeout(() => {
          const sectionButton = wantedSection && $(`[data-sec="${CSS.escape(wantedSection)}"]`);
          sectionButton?.click();
          sessionStorage.removeItem(CURRENT_SECTION_KEY);
          refreshManagerButton();
        }, 120);
      } else if (attempts > 20) {
        clearInterval(timer);
      }
    }, 150);
  }

  function installEvents() {
    document.addEventListener('click', async (event) => {
      if (event.target.closest('[data-prime-manager]')) {
        event.preventDefault();
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
          sessionStorage.setItem(CURRENT_SITE_KEY, edit.dataset.primeEdit);
        }
        $('.modal-backdrop')?.remove();
        refreshManagerButton();
        if (MOBILE.matches) openSheet($('.left-panel'), 'Sites & Sections');
        return;
      }
      const copy = event.target.closest('[data-prime-copy]');
      if (copy) {
        const sites = readSites();
        const original = sites[copy.dataset.primeCopy];
        if (!original) return;
        const key = `${String(original.name || 'Johankarrd').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-copy-${Date.now().toString(36).slice(-4)}`;
        sites[key] = JSON.parse(JSON.stringify(original));
        sites[key].name = `${original.name || 'Johankarrd'} copy`;
        sites[key].slug = key;
        await saveSites(sites);
        sessionStorage.setItem(CURRENT_SITE_KEY, key);
        preserveCurrentAndReload();
        return;
      }
      if (event.target.closest('[data-mobile-sites]')) {
        const panel = $('.left-panel');
        if (activePanel === panel) closeSheet(); else openSheet(panel, 'Sites & Sections');
        return;
      }
      if (event.target.closest('[data-mobile-edit]')) {
        dispatchNative('[data-mode="content"]');
        const panel = $('.editor-panel');
        if (activePanel === panel && sheet?.classList.contains('open')) closeSheet(); else openSheet(panel, 'Edit');
        return;
      }
      if (event.target.closest('[data-mobile-add]')) {
        closeSheet();
        dispatchNative('[data-act="add-block"]');
        return;
      }
      if (event.target.closest('[data-mobile-publish]')) {
        closeSheet();
        dispatchNative('[data-action="publish-draft"]');
        return;
      }
      if (event.target.closest('[data-mobile-close]')) {
        closeSheet();
        return;
      }
      if (MOBILE.matches && event.target.closest('[data-preview-item]')) {
        setTimeout(() => openSheet($('.editor-panel'), 'Edit element'), 40);
      }
    });

    document.addEventListener('input', (event) => {
      if (!event.target.matches('[data-prime-search]')) return;
      const query = event.target.value.toLowerCase();
      $$('.prime-row').forEach((row) => { row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none'; });
    });

    document.addEventListener('pointerdown', (event) => {
      const preview = event.target.closest('[data-preview-item]');
      if (preview) return beginTouchDrag(event, preview, 'reorder');
      const asset = event.target.closest('[data-asset]');
      if (asset) return beginTouchDrag(event, asset, 'asset');
    }, { passive: true });
    document.addEventListener('pointermove', moveTouchDrag, { passive: false });
    document.addEventListener('pointerup', endTouchDrag, { passive: false });
    document.addEventListener('pointercancel', (event) => { cancelTouchTimer(event); if (touchDrag) endTouchDrag(event); }, { passive: false });
    document.addEventListener('scroll', cancelTouchTimer, true);
    $('[data-site-select]')?.addEventListener('change', () => {
      sessionStorage.setItem(CURRENT_SITE_KEY, currentSlug());
      setTimeout(refreshManagerButton, 80);
    });
  }

  function init() {
    installCss();
    ensureManagerButton();
    installMobileUi();
    installEvents();
    restoreSelection();
    setTimeout(refreshManagerButton, 800);
  }

  window.addEventListener('load', init);
  MOBILE.addEventListener?.('change', () => location.reload());
})();