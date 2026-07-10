(() => {
  'use strict';

  const KEY = 'johankarrd-buildr-v6';
  const CURRENT_KEY = 'johankarrd-current-v60';
  const CUSTOM_FONT_KEY = 'johankarrd-custom-fonts-v66';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));

  const FONTS = [
    ['cormorant-sc', 'Cormorant SC', '"Cormorant SC", Georgia, serif', 'Editorial clásica y delicada'],
    ['playfair-display', 'Playfair Display', '"Playfair Display", Georgia, serif', 'Moda, lujo y titulares'],
    ['cinzel', 'Cinzel', 'Cinzel, Georgia, serif', 'Elegante y ceremonial'],
    ['bodoni-moda', 'Bodoni Moda', '"Bodoni Moda", Georgia, serif', 'Fashion y alto contraste']
  ];
  const FONT_MAP = Object.fromEntries(FONTS.map(([key, name, stack, note]) => [key, { name, stack, note }]));

  const DIVIDER_SHAPES = [
    ['line', '—', 'Línea'], ['dots', '•••', 'Puntos'], ['diamond', '◆', 'Diamante'],
    ['heart', '♥', 'Corazón'], ['star', '✦', 'Estrella'], ['sparkle', '✧ ✦ ✧', 'Brillos'],
    ['flower', '❀', 'Flor'], ['ornament', '❦', 'Adorno']
  ];

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch (_) { return fallback; }
  }

  function readContext() {
    try {
      const sites = readJson(KEY, {});
      const current = readJson(CURRENT_KEY, {});
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

  function customFonts() { return readJson(CUSTOM_FONT_KEY, {}); }
  function setCustomFont(siteKey, fontKey) {
    const map = customFonts();
    if (fontKey) map[siteKey] = fontKey;
    else delete map[siteKey];
    localStorage.setItem(CUSTOM_FONT_KEY, JSON.stringify(map));
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
  }

  function segmented(key, value, options, title = '') {
    const label = title || (key === 'item.align' ? 'Alineación' : 'Distribución');
    return `<div class="v66-control"><span>${label}</span><div class="v66-segmented">${options.map(([id, text]) => `<button type="button" data-v66-set="${key}" data-v66-value="${id}" class="${value === id ? 'active' : ''}">${text}</button>`).join('')}</div></div>`;
  }

  function range(label, key, value, min, max, step = 1, suffix = '') {
    return `<label class="v66-range"><span>${label}<b data-v66-output="${key}">${value}${suffix}</b></span><input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-v66-range="${key}" data-v66-suffix="${suffix}"></label>`;
  }

  function sectionChips(site) {
    return `<div class="v66-section-chips">${(site?.sections || []).map((entry) => `<button type="button" data-v66-copy-hash="#${entry.id}" title="Copiar #${entry.id}">#${entry.id}</button>`).join('')}</div>`;
  }

  function decorateContentInspector() {
    const inspector = $('[data-inspector]');
    const { item, section, site } = readContext();
    if (!inspector || !item || inspector.querySelector('[data-v66-panel]')) return;

    let html = '';
    if (item.type === 'text' || item.type === 'title') {
      html = `<div class="inspector-card v66-panel" data-v66-panel><div class="v66-panel-head"><h4>Controles visuales</h4><span>En vivo</span></div>
        ${segmented('item.align', item.align || 'center', [['left','Izq.'],['center','Centro'],['right','Der.']])}
        ${range('Tamaño de letra', 'item.fontSize', item.fontSize || (item.type === 'title' ? 34 : 15), 8, 160, 1, ' px')}
        ${range('Espaciado entre letras', 'item.letterSpacing', item.letterSpacing || 0, -2, 20, .25, ' px')}
        ${range('Altura de línea', 'item.lineHeight', item.lineHeight || 1.2, .7, 2.4, .05, '')}
        ${range('Ancho del bloque', 'item.width', item.width || 100, 20, 100, 1, '%')}
        <div class="v66-note">También puedes tocar el elemento y arrastrar el control azul para cambiar su ancho directamente.</div>
      </div>`;
    }

    if (item.type === 'links') {
      html = `<div class="inspector-card v66-panel" data-v66-panel><div class="v66-panel-head"><h4>Diseño de botones</h4><span>Visual</span></div>
        ${segmented('item.align', item.align || 'center', [['left','Izq.'],['center','Centro'],['right','Der.']])}
        ${segmented('item.layout', item.layout || 'auto', [['auto','Auto'],['stack','Columna'],['row','Fila']])}
        ${range('Tamaño de letra', 'item.fontSize', item.fontSize || 12, 8, 42, 1, ' px')}
        ${range('Espaciado', 'item.letterSpacing', item.letterSpacing || 0, -1, 12, .25, ' px')}
        ${range('Alto del botón', 'item.buttonHeight', item.buttonHeight || 42, 30, 96, 1, ' px')}
        ${range('Redondez', 'item.radius', item.radius || 14, 0, 48, 1, ' px')}
        <div class="v66-note">En cualquier enlace puedes escribir un hashtag de sección, por ejemplo <b>#${section?.id || 'seccion'}</b>, para navegar dentro de la misma página.</div>
        ${sectionChips(site)}
      </div>`;
    }

    if (item.type === 'image' || item.type === 'logo') {
      html = `<div class="inspector-card v66-panel" data-v66-panel><div class="v66-panel-head"><h4>Tamaño y posición</h4><span>Arrastra</span></div>
        ${range('Ancho', 'item.width', item.width || 100, 10, 100, 1, '%')}
        ${range('Altura máxima', 'item.maxHeight', item.maxHeight || (item.type === 'logo' ? 120 : 640), 40, 1200, 5, ' px')}
        ${segmented('item.align', item.align || 'center', [['left','Izq.'],['center','Centro'],['right','Der.']])}
        <div class="v66-note">Arrastra el control azul de la esquina para expandir o reducir el objeto. El enlace de la imagen también acepta <b>#secciones</b>.</div>
        ${sectionChips(site)}
      </div>`;
    }

    if (item.type === 'divider') {
      html = `<div class="inspector-card v66-panel" data-v66-panel><div class="v66-panel-head"><h4>Divisor creativo</h4><span>8 estilos</span></div>
        <div class="v66-shapes">${DIVIDER_SHAPES.map(([id, symbol, label]) => `<button type="button" data-v66-shape="${id}" class="${(item.shape || 'line') === id ? 'active' : ''}"><i>${symbol}</i><span>${label}</span></button>`).join('')}</div>
        ${range('Tamaño', 'item.symbolSize', item.symbolSize || 18, 8, 64, 1, ' px')}
        ${range('Espaciado vertical', 'item.space', item.space ?? 20, 0, 120, 1, ' px')}
        <label class="v66-text"><span>Etiqueta de organización (#)</span><input type="text" value="${String(item.anchor || '').replace(/"/g, '&quot;')}" placeholder="ej: menu-postres" data-v66-text="item.anchor"></label>
        <div class="v66-note">La etiqueta crea un punto <b>#propio</b> dentro de la página. El destino “Al tocar” puede llevar a cualquier otra sección.</div>
        ${sectionChips(site)}
      </div>`;
    }

    if (html) inspector.insertAdjacentHTML('beforeend', html);
  }

  function decorateDesignInspector() {
    const inspector = $('[data-inspector]');
    const fontGrid = $('.font-grid', inspector || document);
    const { siteKey, site } = readContext();
    if (!inspector || !fontGrid || !site) return;

    const remembered = customFonts()[siteKey] || '';
    for (const [key, name, stack, note] of FONTS) {
      if (fontGrid.querySelector(`[data-v66-font="${key}"]`)) continue;
      fontGrid.insertAdjacentHTML('beforeend', `<button type="button" class="font-card ${remembered === key ? 'active' : ''}" data-v66-font="${key}" style="font-family:${stack}"><b>${name}</b><span>${note}</span></button>`);
    }

    if (!inspector.querySelector('[data-v66-shell-panel]')) {
      const mode = site.shellMode === 'boostr' ? 'boostr' : 'clean';
      inspector.insertAdjacentHTML('beforeend', `<div class="inspector-card v66-panel" data-v66-shell-panel>
        <div class="v66-panel-head"><h4>Presentación pública</h4><span>Cliente</span></div>
        ${segmented('site.shellMode', mode, [['clean','Página limpia'],['boostr','Con barra BOOSTR']], 'Barra del ecosistema')}
        <div class="v66-note"><b>Página limpia</b> es la opción correcta para clientes. La barra BOOSTR solo debe activarse cuando esta Johankarrd funcione como módulo interno del ecosistema.</div>
      </div>`);
    }
  }

  function getItemMap() {
    const { section } = readContext();
    return new Map((section?.items || []).map((item) => [item.id, item]));
  }

  function currentFont() {
    const { siteKey, site } = readContext();
    const remembered = customFonts()[siteKey];
    return FONT_MAP[remembered] ? remembered : (FONT_MAP[site?.fontFamily] ? site.fontFamily : '');
  }

  function applyCurrentFont() {
    const key = currentFont();
    const font = FONT_MAP[key];
    if (!font) return;
    const preview = $('.site-preview');
    if (preview) preview.style.fontFamily = font.stack;
    $$('.site-preview .canvas-title,.site-preview .canvas-text,.site-preview .canvas-links a').forEach((node) => { node.style.fontFamily = font.stack; });
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
        image.style.maxHeight = `${item.maxHeight || (item.type === 'logo' ? 120 : 640)}px`;
      }

      const divider = wrapper.querySelector('.canvas-divider');
      if (divider) {
        if (item.anchor) divider.id = String(item.anchor).replace(/^#/, '');
        if (item.shape && item.shape !== 'line') {
          divider.classList.add('v66-symbol-divider');
          divider.style.setProperty('--v66-symbol-size', `${item.symbolSize || 18}px`);
          divider.style.paddingBlock = `${item.space ?? 20}px`;
          divider.dataset.symbol = DIVIDER_SHAPES.find(([id]) => id === item.shape)?.[1] || '◆';
        }
      }
    });
    installResizeGrip(map);
    decorateSectionTags();
    applyCurrentFont();
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
        const startY = event.clientY;
        const startWidth = wrapper.getBoundingClientRect().width;
        const parentWidth = Math.max(1, wrapper.parentElement.getBoundingClientRect().width);
        const startHeight = Number(item.maxHeight) || (item.type === 'logo' ? 120 : 640);
        let nextWidth = clamp((startWidth / parentWidth) * 100, 10, 100);
        let nextHeight = startHeight;
        grip.setPointerCapture?.(event.pointerId);
        document.documentElement.classList.add('v66-resizing');

        const move = (moveEvent) => {
          moveEvent.preventDefault();
          nextWidth = clamp(((startWidth + (moveEvent.clientX - startX)) / parentWidth) * 100, 10, 100);
          wrapper.style.width = `${nextWidth}%`;
          if (item.type === 'image' || item.type === 'logo') {
            nextHeight = clamp(startHeight + (moveEvent.clientY - startY), 40, 1200);
            const image = wrapper.querySelector('.canvas-image,.canvas-logo');
            if (image) image.style.maxHeight = `${nextHeight}px`;
          }
        };

        const end = () => {
          document.documentElement.classList.remove('v66-resizing');
          grip.removeEventListener('pointermove', move);
          grip.removeEventListener('pointerup', end);
          grip.removeEventListener('pointercancel', end);
          dispatchInspectorValue('item.width', Math.round(nextWidth));
          if (item.type === 'image' || item.type === 'logo') dispatchInspectorValue('item.maxHeight', Math.round(nextHeight));
        };
        grip.addEventListener('pointermove', move, { passive: false });
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

  function restoreRememberedFont() {
    const { siteKey, site } = readContext();
    const remembered = customFonts()[siteKey];
    if (!site || !FONT_MAP[remembered] || site.fontFamily === remembered) return;
    dispatchInspectorValue('site.fontFamily', remembered);
  }

  document.addEventListener('click', async (event) => {
    const setter = event.target.closest('[data-v66-set]');
    if (setter) {
      event.preventDefault();
      dispatchInspectorValue(setter.dataset.v66Set, setter.dataset.v66Value);
      return;
    }

    const shape = event.target.closest('[data-v66-shape]');
    if (shape) {
      event.preventDefault();
      dispatchInspectorValue('item.shape', shape.dataset.v66Shape);
      return;
    }

    const customFont = event.target.closest('[data-v66-font]');
    if (customFont) {
      event.preventDefault();
      const { siteKey } = readContext();
      setCustomFont(siteKey, customFont.dataset.v66Font);
      dispatchInspectorValue('site.fontFamily', customFont.dataset.v66Font);
      return;
    }

    const baseFont = event.target.closest('[data-font]');
    if (baseFont) {
      const { siteKey } = readContext();
      setCustomFont(siteKey, '');
    }

    const chip = event.target.closest('[data-v66-copy-hash]');
    if (chip) {
      event.preventDefault();
      try { await navigator.clipboard.writeText(chip.dataset.v66CopyHash); } catch (_) {}
      chip.classList.add('copied');
      const old = chip.textContent;
      chip.textContent = 'Copiado';
      setTimeout(() => { chip.textContent = old; chip.classList.remove('copied'); }, 900);
    }
  }, true);

  document.addEventListener('input', (event) => {
    const slider = event.target.closest('[data-v66-range]');
    if (slider) {
      const key = slider.dataset.v66Range;
      $('[data-v66-output="' + key + '"]')?.replaceChildren(document.createTextNode(slider.value + (slider.dataset.v66Suffix || '')));
      dispatchInspectorValue(key, slider.value);
      return;
    }
    const text = event.target.closest('[data-v66-text]');
    if (text) dispatchInspectorValue(text.dataset.v66Text, text.value.replace(/^#/, ''));
  }, true);

  const observer = new MutationObserver(() => {
    requestAnimationFrame(() => {
      decorateContentInspector();
      decorateDesignInspector();
      applyCanvasStyles();
      restoreRememberedFont();
    });
  });

  window.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
    decorateContentInspector();
    decorateDesignInspector();
    applyCanvasStyles();
    restoreRememberedFont();
  });
})();
