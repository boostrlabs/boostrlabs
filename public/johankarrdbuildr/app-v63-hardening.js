(() => {
  'use strict';

  const KEY = 'johankarrd-buildr-v6';
  const CURRENT_KEY = 'johankarrd-current-v60';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  let inlineEditor = null;
  let inlineOriginal = '';
  let lastTextTap = { id: '', at: 0 };
  let modalReturnFocus = null;
  let statusTimer = null;

  function status(text, hold = 2200) {
    const node = $('[data-status]');
    if (!node) return;
    clearTimeout(statusTimer);
    node.textContent = text;
    node.classList.add('status-visible');
    statusTimer = setTimeout(() => node.classList.remove('status-visible'), hold);
  }

  function readState() {
    try {
      const sites = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
      const current = JSON.parse(localStorage.getItem(CURRENT_KEY) || '{}') || {};
      const key = current.site && sites[current.site] ? current.site : Object.keys(sites)[0];
      return { sites, current, key, site: sites[key] || null };
    } catch (_) {
      return { sites: {}, current: {}, key: '', site: null };
    }
  }

  async function exportSite() {
    const { site } = readState();
    if (!site) return status('No hay una Johankarrd seleccionada.');
    status('Preparando descarga…', 6000);
    try {
      const response = await fetch('/api/johankarrd/render', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ site })
      });
      if (!response.ok) throw new Error('No se pudo generar el archivo.');
      const html = await response.text();
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${site.slug || 'johankarrd'}.html`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1200);
      status('HTML descargado.');
    } catch (error) {
      status(error.message || 'No se pudo descargar.');
    }
  }

  function endInlineEdit({ cancel = false } = {}) {
    const text = inlineEditor;
    if (!text) return;
    const next = cancel ? inlineOriginal : text.textContent.trim();
    text.textContent = next || inlineOriginal;
    text.contentEditable = 'false';
    text.removeAttribute('role');
    text.removeAttribute('aria-label');
    inlineEditor = null;

    if (!cancel && next && next !== inlineOriginal) {
      const input = $('[data-edit-key="item.text"]');
      if (input) {
        input.value = next;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        status('Texto actualizado.');
      }
    }
  }

  function beginInlineEdit(wrapper) {
    if (!wrapper || document.querySelector('.drag-ghost')) return;
    const text = wrapper.querySelector('.canvas-title,.canvas-text');
    if (!text) return;

    if (inlineEditor === text) return;
    endInlineEdit();
    inlineEditor = text;
    inlineOriginal = text.textContent;
    text.contentEditable = 'true';
    text.spellcheck = true;
    text.setAttribute('role', 'textbox');
    text.setAttribute('aria-label', text.classList.contains('canvas-title') ? 'Editar título' : 'Editar texto');
    text.focus({ preventScroll: true });

    const range = document.createRange();
    range.selectNodeContents(text);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    text.addEventListener('blur', () => endInlineEdit(), { once: true });
    text.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        endInlineEdit({ cancel: true });
      }
      if (text.classList.contains('canvas-title') && event.key === 'Enter') {
        event.preventDefault();
        endInlineEdit();
      }
    });
  }

  function handleFastTextTap(event) {
    if (event.pointerType !== 'touch' || document.querySelector('.drag-ghost')) return;
    const wrapper = event.target.closest('[data-item-id]');
    if (!wrapper?.querySelector('.canvas-title,.canvas-text')) return;
    const now = performance.now();
    const id = wrapper.dataset.itemId || '';
    if (lastTextTap.id === id && now - lastTextTap.at < 330) {
      event.preventDefault();
      beginInlineEdit(wrapper);
      lastTextTap = { id: '', at: 0 };
    } else {
      lastTextTap = { id, at: now };
    }
  }

  function ensureSiteSearch() {
    const list = $('.modal .site-list');
    if (!list || $('[data-site-search]', list.parentElement)) return;
    const label = document.createElement('label');
    label.className = 'field site-search-field';
    label.innerHTML = '<span>Buscar</span><input type="search" data-site-search placeholder="Buscar Johankarrd" autocomplete="off">';
    list.insertAdjacentElement('beforebegin', label);
  }

  function filterSites(input) {
    const query = input.value.trim().toLowerCase();
    $$('.site-row', input.closest('.modal')).forEach((row) => {
      row.hidden = !row.textContent.toLowerCase().includes(query);
    });
  }

  function modalFocusables(modal) {
    return $$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', modal)
      .filter((node) => !node.disabled && node.offsetParent !== null);
  }

  function hardenModal() {
    const backdrop = $('[data-modal-backdrop]');
    const modal = backdrop?.querySelector('.modal');
    if (!backdrop || !modal || modal.dataset.hardened) return;
    modal.dataset.hardened = '1';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modalReturnFocus = document.activeElement;
    const first = modalFocusables(modal)[0];
    setTimeout(() => first?.focus({ preventScroll: true }), 30);
  }

  function restoreModalFocus() {
    if ($('[data-modal-backdrop]')) return;
    if (modalReturnFocus?.isConnected) modalReturnFocus.focus({ preventScroll: true });
    modalReturnFocus = null;
  }

  function trapModalFocus(event) {
    if (event.key !== 'Tab') return;
    const modal = $('[data-modal-backdrop] .modal');
    if (!modal) return;
    const nodes = modalFocusables(modal);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function labelControls() {
    const labels = [
      ['[data-mobile-sites]', 'Abrir Johankarrds'],
      ['[data-mobile-edit]', 'Abrir editor'],
      ['[data-mobile-add]', 'Agregar elemento'],
      ['[data-mobile-publish]', 'Publicar Johankarrd'],
      ['[data-sheet-close]', 'Cerrar panel'],
      ['[data-undo]', 'Deshacer'],
      ['[data-redo]', 'Rehacer']
    ];
    for (const [selector, label] of labels) {
      $$(selector).forEach((node) => node.setAttribute('aria-label', label));
    }
  }

  function guardActiveDrag(event) {
    if (!document.querySelector('.drag-ghost')) return;
    if (event.target.closest('[data-preview-section],[data-section-id],[data-site-switch],[data-mobile-sites],[data-mobile-edit]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      status('Termina de mover el elemento primero.');
    }
  }

  function keyboardActions(event) {
    trapModalFocus(event);
    if (event.defaultPrevented) return;

    if (event.key === 'Escape' && inlineEditor) {
      event.preventDefault();
      event.stopImmediatePropagation();
      endInlineEdit({ cancel: true });
      return;
    }

    const typing = event.target.matches?.('input,textarea,select,[contenteditable="true"]');
    if (typing) return;

    if ((event.key === 'Delete' || event.key === 'Backspace') && $('[data-item-id].selected')) {
      event.preventDefault();
      $('[data-toolbar-delete]')?.click();
      return;
    }

    if (event.key === 'Enter') {
      const selected = $('[data-item-id].selected');
      if (selected?.querySelector('.canvas-title,.canvas-text')) {
        event.preventDefault();
        beginInlineEdit(selected);
      } else if (selected) {
        event.preventDefault();
        $('[data-toolbar-edit]')?.click();
      }
    }
  }

  function installSheetSnap() {
    const sheet = $('[data-mobile-sheet]');
    const head = $('.sheet-head');
    if (!sheet || !head || head.dataset.snapV63) return;
    head.dataset.snapV63 = '1';
    let gesture = null;

    head.addEventListener('pointerdown', (event) => {
      if (event.target.closest('button')) return;
      gesture = { id: event.pointerId, startY: event.clientY, lastY: event.clientY, startedAt: performance.now() };
    }, true);

    head.addEventListener('pointermove', (event) => {
      if (!gesture || gesture.id !== event.pointerId) return;
      gesture.lastY = event.clientY;
    }, true);

    const end = () => {
      if (!gesture) return;
      const dy = gesture.lastY - gesture.startY;
      const elapsed = performance.now() - gesture.startedAt;
      gesture = null;
      if (Math.abs(dy) < 12 && elapsed < 280) {
        sheet.classList.toggle('full');
        navigator.vibrate?.(8);
      } else if (dy < -70) {
        sheet.classList.add('full');
      } else if (dy > 70 && sheet.classList.contains('full')) {
        sheet.classList.remove('full');
      }
    };

    head.addEventListener('pointerup', end, true);
    head.addEventListener('pointercancel', () => { gesture = null; }, true);
  }

  function decorateStatus() {
    const node = $('[data-status]');
    if (!node || node.dataset.v63) return;
    node.dataset.v63 = '1';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    setTimeout(() => node.classList.remove('status-visible'), 1800);
  }

  function inspectUi() {
    ensureSiteSearch();
    hardenModal();
    restoreModalFocus();
    labelControls();
    installSheetSnap();
    decorateStatus();
  }

  document.addEventListener('click', (event) => {
    guardActiveDrag(event);
    if (event.defaultPrevented) return;
    if (event.target.closest('[data-export]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      exportSite();
    }
  }, true);

  document.addEventListener('dblclick', (event) => {
    const wrapper = event.target.closest('[data-item-id]');
    if (wrapper?.querySelector('.canvas-title,.canvas-text')) {
      event.preventDefault();
      beginInlineEdit(wrapper);
    }
  }, true);

  document.addEventListener('pointerup', handleFastTextTap, true);
  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-site-search]')) filterSites(event.target);
  }, true);
  document.addEventListener('keydown', keyboardActions, true);

  window.addEventListener('DOMContentLoaded', () => {
    inspectUi();
    const observer = new MutationObserver(inspectUi);
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();