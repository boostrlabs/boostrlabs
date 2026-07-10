(() => {
  'use strict';

  const KEY = 'johankarrd-buildr-v6';
  const CURRENT_KEY = 'johankarrd-current-v60';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let inlineEditor = null;

  function installCss() {
    if ($('#prime-v62-css')) return;
    const style = document.createElement('style');
    style.id = 'prime-v62-css';
    style.textContent = `
      [data-site-search]{min-height:46px!important;font-size:16px!important}
      .canvas-title[contenteditable="true"],.canvas-text[contenteditable="true"]{outline:2px solid #8be8ff;outline-offset:6px;border-radius:8px;caret-color:#feedb9;cursor:text;user-select:text;-webkit-user-select:text}
      .drag-index-compensator{display:none!important;width:0!important;height:0!important;overflow:hidden!important}
      .mobile-sheet.full{height:calc(100dvh - 62px)!important}
      @media(max-width:820px){
        .canvas-item.selected{box-shadow:0 0 0 5px rgba(254,237,185,.09)!important}
        .canvas-item:active{transform:scale(.985)}
        .sheet-head{touch-action:none}
        .site-switch{max-width:48vw!important;min-width:0!important}
      }
    `;
    document.head.append(style);
  }

  function status(text) {
    const node = $('[data-status]');
    if (node) node.textContent = text;
  }

  function getCurrentSite() {
    try {
      const sites = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
      const current = JSON.parse(localStorage.getItem(CURRENT_KEY) || '{}') || {};
      const key = current.site && sites[current.site] ? current.site : Object.keys(sites)[0];
      return sites[key] || null;
    } catch (_) {
      return null;
    }
  }

  async function exportSite() {
    const site = getCurrentSite();
    if (!site) return status('No hay una Johankarrd seleccionada.');
    status('Preparando descarga…');
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

  function beginInlineEdit(event) {
    const wrapper = event.target.closest('[data-item-id]');
    if (!wrapper) return;
    const text = wrapper.querySelector('.canvas-title,.canvas-text');
    if (!text) return;

    inlineEditor?.blur?.();
    inlineEditor = text;
    text.contentEditable = 'true';
    text.spellcheck = true;
    text.focus();

    const range = document.createRange();
    range.selectNodeContents(text);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    const original = text.textContent;
    const finish = () => {
      text.contentEditable = 'false';
      inlineEditor = null;
      const input = $('[data-edit-key="item.text"]');
      const value = text.textContent.trim();
      if (input && value && value !== original) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        status('Texto actualizado.');
      }
    };

    text.addEventListener('blur', finish, { once: true });
    text.addEventListener('keydown', (keyEvent) => {
      if (keyEvent.key === 'Escape') {
        keyEvent.preventDefault();
        text.textContent = original;
        text.blur();
      }
      if (text.classList.contains('canvas-title') && keyEvent.key === 'Enter') {
        keyEvent.preventDefault();
        text.blur();
      }
    });
    event.preventDefault();
  }

  function ensureSiteSearch() {
    const list = $('.modal .site-list');
    if (!list || $('[data-site-search]', list.parentElement)) return;
    const label = document.createElement('label');
    label.className = 'field';
    label.innerHTML = '<span>Buscar</span><input type="search" data-site-search placeholder="Buscar Johankarrd">';
    list.insertAdjacentElement('beforebegin', label);
  }

  function filterSites(input) {
    const query = input.value.trim().toLowerCase();
    $$('.site-row', input.closest('.modal')).forEach((row) => {
      row.hidden = !row.textContent.toLowerCase().includes(query);
    });
  }

  // The unified drag engine calculates its placeholder against the remaining
  // elements and then compensates once more on downward moves. This invisible
  // marker makes that legacy compensation resolve to the correct final index.
  function compensateDragIndex() {
    const source = $('.canvas-item.drag-source');
    const placeholder = $('.drag-placeholder');
    const card = placeholder?.parentElement;
    if (!source || !placeholder || !card) return;

    let marker = $('.drag-index-compensator', card);
    const children = Array.from(card.children).filter((node) => node !== marker);
    const sourcePosition = children.indexOf(source);
    const placeholderPosition = children.indexOf(placeholder);
    const movingDown = sourcePosition >= 0 && placeholderPosition > sourcePosition;

    if (movingDown) {
      if (!marker) {
        marker = document.createElement('div');
        marker.className = 'drag-index-compensator';
        marker.dataset.itemId = '__drag_index_compensator__';
      }
      placeholder.insertAdjacentElement('beforebegin', marker);
    } else {
      marker?.remove();
    }
  }

  function clearDragMarker() {
    setTimeout(() => $$('.drag-index-compensator').forEach((node) => node.remove()), 40);
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-export]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      exportSite();
    }
  }, true);

  document.addEventListener('dblclick', beginInlineEdit, true);
  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-site-search]')) filterSites(event.target);
  }, true);
  document.addEventListener('pointermove', () => requestAnimationFrame(compensateDragIndex), false);
  document.addEventListener('pointerup', clearDragMarker, false);
  document.addEventListener('pointercancel', clearDragMarker, false);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && inlineEditor) {
      event.preventDefault();
      event.stopImmediatePropagation();
      inlineEditor.blur();
    }
  }, true);

  window.addEventListener('DOMContentLoaded', () => {
    installCss();
    const observer = new MutationObserver(ensureSiteSearch);
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
