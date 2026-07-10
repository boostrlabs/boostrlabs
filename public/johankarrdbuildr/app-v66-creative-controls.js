(() => {
  'use strict';

  const KEY = 'johankarrd-buildr-v6';
  const CURRENT_KEY = 'johankarrd-current-v60';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));

  const FONTS = [
    ['cormorant-sc', 'Cormorant SC', '"Cormorant SC", Georgia, serif'],
    ['playfair-display', 'Playfair Display', '"Playfair Display", Georgia, serif'],
    ['cinzel', 'Cinzel', 'Cinzel, Georgia, serif'],
    ['bodoni-moda', 'Bodoni Moda', '"Bodoni Moda", Georgia, serif']
  ];

  const DIVIDER_SHAPES = [
    ['line', '—', 'Línea'], ['dots', '•••', 'Puntos'], ['diamond', '◆', 'Diamante'],
    ['heart', '♥', 'Corazón'], ['star', '✦', 'Estrella'], ['sparkle', '✧ ✦ ✧', 'Brillos'],
    ['flower', '❀', 'Flor'], ['ornament', '❦', 'Adorno']
  ];

  function readContext() {
    try {
      const sites = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
      const current = JSON.parse(localStorage.getItem(CURRENT_KEY) || '{}') || {};
      const siteKey = current.site && sites[current.site] ? current.site : Object.keys(sites)[0];
      const site = sites[siteKey];
      const section = site?.sections?.find((entry) => entry.id === current.section) || site?.sections?.[0];
      const selectedId = $('.canvas-item.selected')?.dataset.itemId || '';
      const item = section?.items?.find((entry) => entry.id === selectedId) || null;
      return { sites, siteKey, site, section, item };
    } catch (_) {
      return { sites: {}, siteKey: '', site: null, section: null, item: null };
    }
  }

  function dispatchInspectorValue(key, value) {
    let input = $(`[data-edit-key="${CSS.escape(key)}"]`);
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.dataset.editKey = key;
      $('[data-inspector]')?.append(input);
    }
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function segmented(key, value, options) {
    return `<div class="v66-control"><span>${key === 'item.align' ? 'Alineación' : 'Distribución'}</span><div class="v66-segmented">${options.map(([id, label]) => `<button type="button" data-v66-set="${key}" data-v66-value="${id}" class="${value === id ? 'active' : ''}">${label}</button>`).join('')}</div></div>`;
  }

  function range(label, key, value, min, max, step = 1, suffix = '') {
    return `<label class="v66-range"><span>${label}<b data-v66-output="${key}">${value}${suffix}</b></span><input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-v66-range="${key}" data-v66-suffix="${suffix}"></label>`;
  }

  function decorateInspector() {
    const inspector = $('[data-inspector]');
    const { item, section } = readContext();
    if (!inspector || !item || inspector.querySelector('[data-v66-panel]')) return;

    let html = '';
    if (item.type === 'text' || item.type === 'title') {
      html = `<div class="inspector-card v66-panel" data-v66-panel><h4>Controles visuales</h4>
        ${segmented('item.align', item.align || 'center', [['left','Izq.'],['center','Centro'],['right','Der.']])}
        ${range('Tamaño de letra', 'item.fontSize', item.fontSize || (item.type === 'title' ? 34 : 15), 8, 140, 1, ' px')}
        ${range('Espaciado entre letras', 'item.letterSpacing', item.letterSpacing || 0, -2, 20, .25, ' px')}
        ${range('Altura de línea', 'item.lineHeight', item.lineHeight || 1.2, .7, 2.4, .05, '')}
        ${range('Ancho del bloque', 'item.width', item.width || 100, 20, 100, 1, '%')}
      </div>`;
    }

    if (item.type === 'links') {
      html = `<div class="inspector-card v66-panel" data-v66-panel><h4>Diseño de botones</h4>
        ${segmented('item.align', item.align || 'center', [['left','Izq.'],['center','Centro'],['right','Der.']])}
        ${segmented('item.layout', item.layout || 'auto', [['auto','Auto'],['stack','Columna'],['row','Fila']])}
        ${range('Tamaño de letra', 'item.fontSize', item.fontSize || 12, 8, 42, 1, ' px')}
        ${range('Espaciado', 'item.letterSpacing', item.letterSpacing || 0, -1, 12, .25, ' px')}
        ${range('Alto del botón', 'item.buttonHeight', item.buttonHeight || 42, 30, 96, 1, ' px')}
        ${range('Redondez', 'item.radius', item.radius || 14, 0, 48, 1, ' px')}
        <div class="v66-note">En los enlaces puedes usar <b>#${section?.id || 'seccion'}</b> o cualquier otro hashtag de sección para navegar dentro de la misma Johankarrd.</div>
      </div>`;
    }

    if (item.type === 'image' || item.type === 'logo') {
      html = `<div class="inspector-card v66-panel" data-v66-panel><h4>Tamaño y posición</h4>
        ${range('Ancho', 'item.width', item.width || 100, 10, 100, 1, '%')}
        ${range('Altura máxima', 'item.maxHeight', item.maxHeight || (item.type === 'logo' ? 120 : 640), 40, 900, 5, ' px')}
        ${segmented('item.align', item.align || 'center', [['left','Izq.'],['center','Centro'],['right','Der.']])}
        <div class="v66-note">También puedes arrastrar el control azul sobre la imagen para expandirla o reducirla.</div>
      </div>`;
    }

    if (item.type === 'divider') {
      html = `<div class="inspector-card v66-panel" data-v66-panel><h4>Divisor creativo</h4>
        <div class="v66-shapes">${DIVIDER_SHAPES.map(([id, symbol, label]) => `<button type="button" data-v66-shape="${id}" class="${(item.shape || 'line') === id ? 'active' : ''}"><i>${symbol}</i><span>${label}</span></button>`).join('')}</div>
        ${range('Tamaño', 'item.symbolSize', item.symbolSize || 18, 8, 64, 1, ' px')}
        ${range('Espaciado vertical', 'item.space', item.space || 20, 0, 120, 1, ' px')}
        <div class="v66-note">El hashtag del divisor puede actuar como marcador visual y el destino puede apuntar a cualquier <b>#sección</b>.</div>
      </div>`;
    }

    if (html) inspector.insertAdjacentHTML('beforeend', html);
  }

  function getItemMap() {
    const { section } = readContext();
    const map = new Map();
    (section?.items || []).forEach((item) => map.set(item.id, item));
    return map;
  }

  function applyCanvasStyles() {
    const map = getItemMap();
    $$('.canvas-item[data-item-id]').forEach((wrapper) => {
      const item = map.get(wrapper.dataset.itemId);
      if (!item) return;
      wrapper.style.width = `${clamp(item.width || 100, 10, 100)}%`;
      wrapper.style.justifySelf = item.align === 'left' ? 'start' : item.align === 'right' ? 'end' : 'center';
      const text = wrapper.querySelector('.canvas-title,.canvas-text');
      if (text) {
        text.style.letterSpacing = `${Number(item.letterSpacing || 0)}px`;
        text.style.lineHeight = String(item.lineHeight || 1.2);
      }
      const links = wrapper.querySelector('.canvas-links');
      if (links) {
        links.style.gridTemplateColumns = item.layout === 'stack' ? '1fr' : item.layout === 'row' ? 'repeat(auto-fit,minmax(0,1fr))' : '';
        links.style.justifyItems = item.align === 'left' ? 'start' : item.align === 'right' ? 'end' : 'stretch';
        links.querySelectorAll('a').forEach((node) => {
          node.style.fontSize = `${item.fontSize || 12}px`;
          node.style.letterSpacing = `${item.letterSpacing || 0}px`;
          node.style.minHeight = `${item.buttonHeight || 42}px`;
          node.style.borderRadius = `${item.radius || 14}px`;
        });
      }
      const image = wrapper.querySelector('.canvas-image,.canvas-logo');
      if (image) {
        image.style.width = '100%';
        image.style.maxHeight = `${item.maxHeight || 640}px`;
      }
      const divider = wrapper.querySelector('.canvas-divider');
      if (divider && item.shape && item.shape !== 'line') {
        divider.classList.add('v66-symbol-divider');
        divider.style.setProperty('--v66-symbol-size', `${item.symbolSize || 18}px`);
        divider.style.paddingBlock = `${item.space || 20}px`;
        divider.dataset.symbol = DIVIDER_SHAPES.find(([id]) => id === item.shape)?.[1] || '◆';
      }
    });
    installResizeGrip(map);
    decorateSectionTags();
  }

  function installResizeGrip(map) {
    $$('.canvas-item.selected[data-item-id]').forEach((wrapper) => {
      const item = map.get(wrapper.dataset.itemId);
      if (!item || !['image','logo','text','title'].includes(item.type) || wrapper.querySelector('[data-v66-resize]')) return;
      const grip = document.createElement('button');
      grip.type = 'button';
      grip.className = 'v66-resize-grip';
      grip.dataset.v66Resize = '1';
      grip.setAttribute('aria-label', 'Cambiar tamaño');
      wrapper.append(grip);
      grip.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const startX = event.clientX;
        const startWidth = wrapper.getBoundingClientRect().width;
        const parentWidth = wrapper.parentElement.getBoundingClientRect().width;
        grip.setPointerCapture?.(event.pointerId);
        const move = (moveEvent) => {
          const next = clamp(((startWidth + (moveEvent.clientX - startX)) / parentWidth) * 100, 10, 100);
          wrapper.style.width = `${next}%`;
          dispatchInspectorValue('item.width', Math.round(next));
        };
        const end = () => {
          grip.removeEventListener('pointermove', move);
          grip.removeEventListener('pointerup', end);
          grip.removeEventListener('pointercancel', end);
        };
        grip.addEventListener('pointermove', move);
        grip.addEventListener('pointerup', end);
        grip.addEventListener('pointercancel', end);
      });
    });
  }

  function decorateSectionTags() {
    $$('.section-row').forEach((row) => {
      const small = row.querySelector('small');
      if (small && !small.classList.contains('v66-tag')) small.classList.add('v66-tag');
    });
  }

  document.addEventListener('click', (event) => {
    const setter = event.target.closest('[data-v66-set]');
    if (setter) dispatchInspectorValue(setter.dataset.v66Set, setter.dataset.v66Value);
    const shape = event.target.closest('[data-v66-shape]');
    if (shape) dispatchInspectorValue('item.shape', shape.dataset.v66Shape);
  }, true);

  document.addEventListener('input', (event) => {
    const slider = event.target.closest('[data-v66-range]');
    if (!slider) return;
    const key = slider.dataset.v66Range;
    $('[data-v66-output="' + key + '"]')?.replaceChildren(document.createTextNode(slider.value + (slider.dataset.v66Suffix || '')));
    dispatchInspectorValue(key, slider.value);
  }, true);

  const observer = new MutationObserver(() => {
    requestAnimationFrame(() => {
      decorateInspector();
      applyCanvasStyles();
    });
  });

  window.addEventListener('DOMContentLoaded', () => {
    FONTS.forEach(([key, name, stack]) => {
      document.documentElement.style.setProperty(`--font-${key}`, stack);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    decorateInspector();
    applyCanvasStyles();
  });
})();