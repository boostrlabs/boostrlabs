(() => {
  'use strict';
  const MOBILE = window.matchMedia('(max-width: 820px)');
  const $ = (selector, root = document) => root.querySelector(selector);
  let swipe = null;
  let replaying = false;

  function sheet() { return $('[data-mobile-sheet]'); }
  function backdrop() { return $('[data-motion-backdrop]'); }

  function down(event) {
    if (!MOBILE.matches || event.pointerType !== 'touch' || event.target.closest('button')) return;
    const head = event.target.closest('[data-mobile-sheet] .prime-sheet-head');
    const panel = sheet();
    if (!head || !panel?.classList.contains('open')) return;
    swipe = { id: event.pointerId, start: event.clientY, y: event.clientY };
    panel.style.setProperty('transition', 'none', 'important');
    head.setPointerCapture?.(event.pointerId);
  }

  function move(event) {
    if (!swipe || swipe.id !== event.pointerId) return;
    event.preventDefault();
    const delta = Math.max(0, event.clientY - swipe.start);
    swipe.y = event.clientY;
    sheet()?.style.setProperty('transform', `translate3d(0,${delta}px,0) scale(${1 - Math.min(delta, 280) / 9000})`, 'important');
    sheet()?.style.setProperty('opacity', String(Math.max(.45, 1 - delta / 420)), 'important');
    if (backdrop()) backdrop().style.opacity = String(Math.max(0, 1 - delta / 260));
  }

  function clearInline() {
    const panel = sheet();
    panel?.style.removeProperty('transition');
    panel?.style.removeProperty('transform');
    panel?.style.removeProperty('opacity');
    backdrop()?.style.removeProperty('opacity');
  }

  function up(event) {
    if (!swipe || swipe.id !== event.pointerId) return;
    const delta = Math.max(0, swipe.y - swipe.start);
    swipe = null;
    const panel = sheet();
    if (!panel) return;
    panel.style.setProperty('transition', 'transform .28s cubic-bezier(.22,1,.36,1),opacity .2s', 'important');
    if (delta > 88) {
      panel.style.setProperty('transform', 'translate3d(0,105%,0) scale(.985)', 'important');
      panel.style.setProperty('opacity', '0', 'important');
      backdrop()?.classList.remove('open');
      setTimeout(() => {
        panel.classList.remove('open');
        clearInline();
        $('[data-mobile-close]')?.click();
      }, 220);
    } else {
      panel.style.setProperty('transform', 'translate3d(0,0,0) scale(1)', 'important');
      panel.style.setProperty('opacity', '1', 'important');
      if (backdrop()) backdrop().style.opacity = '1';
      setTimeout(clearInline, 290);
    }
  }

  function smoothAction(event) {
    if (replaying || !MOBILE.matches) return;
    const button = event.target.closest('[data-mobile-add],[data-mobile-publish]');
    const panel = sheet();
    if (!button || !panel?.classList.contains('open')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    panel.classList.add('motion-closing');
    backdrop()?.classList.remove('open');
    setTimeout(() => {
      panel.classList.remove('motion-closing');
      replaying = true;
      button.click();
      replaying = false;
    }, 270);
  }

  function install() {
    document.addEventListener('click', smoothAction, true);
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('pointermove', move, { capture: true, passive: false });
    document.addEventListener('pointerup', up, { capture: true, passive: true });
    document.addEventListener('pointercancel', up, { capture: true, passive: true });
  }

  window.addEventListener('load', () => setTimeout(install, 90));
})();
