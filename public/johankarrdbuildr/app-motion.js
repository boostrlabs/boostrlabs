(() => {
  'use strict';

  const KEY = 'johankarrd-buildr-v6';
  const MOBILE = window.matchMedia('(max-width: 820px)');
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let drag = null;
  let pending = null;
  let suppressClickUntil = 0;
  let bypassSheetClick = false;

  const status = (text) => {
    const node = $('[data-status]');
    if (node) node.textContent = text;
  };

  const readSites = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
    catch (_) { return {}; }
  };
  const writeSites = (sites) => localStorage.setItem(KEY, JSON.stringify(sites || {}));
  const currentSlug = () => $('[data-site-select]')?.value || Object.keys(readSites())[0] || 'cafe';
  const currentSection = () => $('[data-sec].active')?.dataset.sec || $('[data-sec]')?.dataset.sec || 'home';

  function installCss() {
    if ($('#johankarrd-motion-v55')) return;
    document.head.insertAdjacentHTML('beforeend', `<style id="johankarrd-motion-v55">
      :root{--motion-spring:cubic-bezier(.22,1,.36,1)}
      .preview-object,.asset-card{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
      .prime-touch-ghost.motion-ghost{position:fixed!important;z-index:1700!important;pointer-events:none!important;margin:0!important;opacity:.98!important;overflow:hidden!important;border-radius:18px!important;background:#08090c!important;box-shadow:0 36px 120px rgba(0,0,0,.82),0 0 0 1px rgba(254,237,185,.42)!important;transform:translate3d(0,0,0) scale(1.035) rotate(-.7deg)!important;will-change:left,top,transform!important}
      .motion-source{opacity:.14!important;transform:scale(.97)!important;transition:opacity .16s,transform .2s var(--motion-spring)!important}
      .motion-placeholder{min-height:42px;border:1.5px dashed rgba(139,232,255,.9);border-radius:16px;background:linear-gradient(145deg,rgba(139,232,255,.13),rgba(254,237,185,.07));box-shadow:inset 0 0 0 1px rgba(255,255,255,.05);transition:height .2s var(--motion-spring),opacity .16s}
      .motion-settle{animation:motionSettle .36s var(--motion-spring)}
      @keyframes motionSettle{0%{transform:scale(.96);filter:brightness(1.2)}100%{transform:none;filter:none}}
      @media(max-width:820px){
        .prime-mobile-sheet{display:grid!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;transform:translate3d(0,105%,0) scale(.985)!important;transition:transform .42s var(--motion-spring),opacity .24s,visibility 0s linear .42s!important;animation:none!important;will-change:transform!important}
        .prime-mobile-sheet.open{opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:translate3d(0,0,0) scale(1)!important;transition-delay:0s!important}
        .prime-mobile-sheet.motion-closing{opacity:0!important;transform:translate3d(0,105%,0) scale(.985)!important;pointer-events:none!important}
        .prime-sheet-head{touch-action:none!important}.prime-sheet-head:before{content:"";position:absolute;top:7px;left:50%;width:42px;height:5px;border-radius:99px;background:rgba(255,255,255,.3);transform:translateX(-50%)}
        .motion-sheet-backdrop{position:fixed;inset:88px 0 0;z-index:875;background:rgba(0,0,0,.36);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .28s,visibility 0s linear .28s}.motion-sheet-backdrop.open{opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s}
        .prime-mobile-dock button{transition:transform .18s var(--motion-spring),background .2s,color .2s,box-shadow .2s!important}.prime-mobile-dock button.motion-active{background:linear-gradient(135deg,#fff5c7,#feedb9,#8be8ff)!important;color:#061f3d!important;box-shadow:0 10px 28px rgba(254,237,185,.22)!important}.prime-mobile-dock button:active{transform:scale(.94)!important}
      }
    </style>`);
  }

  function ensureBackdrop() {
    if (!MOBILE.matches || $('.motion-sheet-backdrop')) return;
    document.body.insertAdjacentHTML('beforeend', '<div class="motion-sheet-backdrop" data-motion-backdrop></div>');
  }

  function updateSheetState() {
    const sheet = $('[data-mobile-sheet]');
    const open = Boolean(sheet?.classList.contains('open'));
    $('.motion-sheet-backdrop')?.classList.toggle('open', open);
    const title = $('[data-sheet-title]')?.textContent || '';
    $$('[data-mobile-sites],[data-mobile-edit]').forEach((button) => {
      const active = open && ((button.hasAttribute('data-mobile-sites') && /sites/i.test(title)) || (button.hasAttribute('data-mobile-edit') && /edit/i.test(title)));
      button.classList.toggle('motion-active', active);
    });
  }

  function closeSheetImmediately() {
    const close = $('[data-mobile-close]');
    if (!close) return;
    bypassSheetClick = true;
    close.click();
    bypassSheetClick = false;
    updateSheetState();
  }

  function animateSheetThen(button) {
    const sheet = $('[data-mobile-sheet]');
    if (!sheet?.classList.contains('open')) {
      bypassSheetClick = true;
      button.click();
      bypassSheetClick = false;
      return;
    }
    sheet.classList.add('motion-closing');
    $('.motion-sheet-backdrop')?.classList.remove('open');
    setTimeout(() => {
      sheet.classList.remove('motion-closing');
      bypassSheetClick = true;
      button.click();
      bypassSheetClick = false;
      setTimeout(updateSheetState, 30);
    }, 270);
  }

  function flip(container, mutate) {
    const nodes = Array.from(container.children).filter((node) => node.nodeType === 1);
    const before = new Map(nodes.map((node) => [node, node.getBoundingClientRect()]));
    mutate();
    nodes.forEach((node) => {
      const first = before.get(node);
      if (!first) return;
      const last = node.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (!dx && !dy) return;
      node.animate([{ transform: `translate3d(${dx}px,${dy}px,0)` }, { transform: 'translate3d(0,0,0)' }], { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' });
    });
  }

  function clearPending() {
    if (!pending) return;
    clearTimeout(pending.timer);
    pending = null;
  }

  function beginDrag(source, event, kind) {
    const rect = source.getBoundingClientRect();
    const ghost = source.cloneNode(true);
    ghost.className = 'prime-touch-ghost motion-ghost';
    ghost.removeAttribute('data-preview-item');
    ghost.removeAttribute('data-asset');
    Object.assign(ghost.style, { width: `${rect.width}px`, height: `${rect.height}px`, left: `${rect.left}px`, top: `${rect.top}px` });
    document.body.append(ghost);
    source.classList.add('motion-source');
    source.setPointerCapture?.(event.pointerId);
    const placeholder = document.createElement('div');
    placeholder.className = 'motion-placeholder';
    placeholder.style.height = `${Math.max(42, rect.height)}px`;
    placeholder.style.width = `${rect.width}px`;
    if (kind === 'reorder') source.insertAdjacentElement('afterend', placeholder);
    drag = {
      kind,
      source,
      ghost,
      placeholder,
      pointerId: event.pointerId,
      from: Number(source.dataset.previewItem),
      targetIndex: Number(source.dataset.previewItem),
      asset: source.dataset.asset || '',
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      x: event.clientX,
      y: event.clientY,
      frame: 0,
      dropTarget: null
    };
    source.setPointerCapture?.(event.pointerId);
    if (kind === 'asset') closeSheetImmediately();
    suppressClickUntil = performance.now() + 800;
    navigator.vibrate?.(14);
  }

  function pointerDown(event) {
    if (!MOBILE.matches || event.pointerType !== 'touch') return;
    const source = event.target.closest('[data-preview-item],[data-asset]');
    if (!source || event.target.closest('button,a,input,textarea,label,select')) return;
    event.stopImmediatePropagation();
    pending = {
      source,
      kind: source.hasAttribute('data-preview-item') ? 'reorder' : 'asset',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      timer: setTimeout(() => {
        const item = pending;
        pending = null;
        if (item) beginDrag(item.source, event, item.kind);
      }, 170)
    };
  }

  function moveGhost() {
    if (!drag) return;
    drag.ghost.style.left = `${drag.x - drag.offsetX}px`;
    drag.ghost.style.top = `${drag.y - drag.offsetY}px`;
    drag.frame = 0;
  }

  function updatePlaceholder(event) {
    const card = drag?.source.closest('.jb-card');
    if (!card || !drag?.placeholder) return;
    const candidates = $$('[data-preview-item]', card).filter((node) => node !== drag.source);
    let before = null;
    for (const node of candidates) {
      const rect = node.getBoundingClientRect();
      if (event.clientY < rect.top + rect.height / 2) { before = node; break; }
    }
    const mutate = () => { if (before) card.insertBefore(drag.placeholder, before); else card.append(drag.placeholder); };
    if ((before && drag.placeholder.nextElementSibling !== before) || (!before && drag.placeholder !== card.lastElementChild)) flip(card, mutate);
    const ordered = Array.from(card.children).filter((node) => node === drag.placeholder || node.matches?.('[data-preview-item]'));
    const p = ordered.indexOf(drag.placeholder);
    const s = ordered.indexOf(drag.source);
    drag.targetIndex = Math.max(0, p > s ? p - 1 : p);
  }

  function pointerMove(event) {
    if (pending && pending.pointerId === event.pointerId) {
      const distance = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
      if (distance > 10) clearPending();
    }
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    drag.x = event.clientX;
    drag.y = event.clientY;
    if (!drag.frame) drag.frame = requestAnimationFrame(moveGhost);
    if (drag.kind === 'reorder') updatePlaceholder(event);
    else {
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-preview],.preview-stage,.device');
      drag.dropTarget = target || null;
      $('.prime-touch-target')?.classList.remove('prime-touch-target');
      target?.classList.add('prime-touch-target');
    }
  }

  async function coreMove(from, to) {
    $('[data-mode="content"]')?.click();
    await nextFrame();
    let current = from;
    const direction = to < from ? -1 : 1;
    while (current !== to) {
      const button = $(direction < 0 ? `[data-up="${current}"]` : `[data-down="${current}"]`);
      if (!button) return false;
      button.click();
      current += direction;
      await nextFrame();
    }
    return true;
  }

  async function settleGhost(index, ghost) {
    await nextFrame();
    const target = $(`[data-preview-item="${index}"]`);
    if (!target) { ghost.remove(); return; }
    const a = ghost.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const dx = b.left - a.left;
    const dy = b.top - a.top;
    const sx = b.width / Math.max(1, a.width);
    const sy = b.height / Math.max(1, a.height);
    const animation = ghost.animate([
      { transform: 'translate3d(0,0,0) scale(1.035) rotate(-.7deg)', opacity: .98 },
      { transform: `translate3d(${dx}px,${dy}px,0) scale(${sx},${sy}) rotate(0deg)`, opacity: .84 }
    ], { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
    await animation.finished.catch(() => {});
    ghost.remove();
    target.classList.add('motion-settle');
    setTimeout(() => target.classList.remove('motion-settle'), 380);
  }

  async function addAsset(asset, ghost) {
    const sites = readSites();
    const section = sites?.[currentSlug()]?.sections?.find((item) => item.id === currentSection());
    if (!section?.items) { ghost.remove(); return; }
    section.items.push({ type: 'image', src: asset });
    const index = section.items.length - 1;
    writeSites(sites);
    try {
      await fetch('/api/johankarrd/drafts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sites }) });
      $('[data-action="reload-remote"]')?.click();
      await wait(260);
    } catch (_) {}
    await settleGhost(index, ghost);
    status('Asset added.');
  }

  async function pointerUp(event) {
    if (pending && pending.pointerId === event.pointerId) {
      clearPending();
      return;
    }
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const active = drag;
    drag = null;
    if (active.frame) cancelAnimationFrame(active.frame);
    active.source.classList.remove('motion-source');
    active.placeholder?.remove();
    $('.prime-touch-target')?.classList.remove('prime-touch-target');
    suppressClickUntil = performance.now() + 700;
    if (active.kind === 'reorder') {
      const count = $$('[data-preview-item]').length;
      const to = Math.max(0, Math.min(active.targetIndex, count - 1));
      if (to !== active.from) await coreMove(active.from, to);
      await settleGhost(to, active.ghost);
      status('Element moved.');
      return;
    }
    if (active.kind === 'asset' && active.asset && active.dropTarget) {
      await addAsset(active.asset, active.ghost);
      return;
    }
    active.ghost.remove();
  }

  function interceptClick(event) {
    if (performance.now() < suppressClickUntil && event.target.closest('[data-preview-item],[data-asset]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (!MOBILE.matches || bypassSheetClick) return;
    const close = event.target.closest('[data-mobile-close],[data-motion-backdrop]');
    if (close) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const real = close.hasAttribute('data-mobile-close') ? close : $('[data-mobile-close]');
      if (real) animateSheetThen(real);
      return;
    }
    const dock = event.target.closest('[data-mobile-sites],[data-mobile-edit]');
    const sheet = $('[data-mobile-sheet]');
    if (dock && sheet?.classList.contains('open')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      animateSheetThen(dock);
    }
  }

  function install() {
    installCss();
    ensureBackdrop();
    const sheet = $('[data-mobile-sheet]');
    if (sheet) new MutationObserver(updateSheetState).observe(sheet, { attributes: true, attributeFilter: ['class'] });
    updateSheetState();
    document.addEventListener('click', interceptClick, true);
    document.addEventListener('pointerdown', pointerDown, true);
    document.addEventListener('pointermove', pointerMove, { capture: true, passive: false });
    document.addEventListener('pointerup', pointerUp, { capture: true, passive: false });
    document.addEventListener('pointercancel', pointerUp, { capture: true, passive: false });
    document.addEventListener('scroll', clearPending, true);
  }

  window.addEventListener('load', () => setTimeout(install, 60));
})();
