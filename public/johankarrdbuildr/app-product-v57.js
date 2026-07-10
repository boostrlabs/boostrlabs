(() => {
  'use strict';

  const KEY = 'johankarrd-buildr-v6';
  const FONT_KEY = window.JOHANKARRD_PREFLIGHT?.fontKey || 'johankarrd-fonts-v1';
  const MOBILE = window.matchMedia('(max-width: 820px)');
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const canonicalSlug = window.JOHANKARRD_PREFLIGHT?.canonicalSlug || ((value) => String(value || '').toLowerCase());

  const FONTS = {
    system: { label: 'Apple / System', stack: '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif' },
    inter: { label: 'Inter / Modern', stack: 'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
    arial: { label: 'Arial', stack: 'Arial,Helvetica,sans-serif' },
    trebuchet: { label: 'Trebuchet', stack: '"Trebuchet MS",Arial,sans-serif' },
    verdana: { label: 'Verdana', stack: 'Verdana,Geneva,sans-serif' },
    georgia: { label: 'Georgia', stack: 'Georgia,"Times New Roman",serif' },
    times: { label: 'Times New Roman', stack: '"Times New Roman",Times,serif' },
    courier: { label: 'Courier New', stack: '"Courier New",Courier,monospace' },
    impact: { label: 'Impact', stack: 'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif' }
  };

  let saveFontTimer = null;

  const status = (text) => {
    const node = $('[data-status]');
    if (node) node.textContent = text;
  };

  function readSites() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
    catch (_) { return {}; }
  }

  function readFonts() {
    try { return JSON.parse(localStorage.getItem(FONT_KEY) || '{}') || {}; }
    catch (_) { return {}; }
  }

  function currentSite() {
    const select = $('[data-site-select]');
    const sites = readSites();
    const key = select?.value || Object.keys(sites)[0] || 'cafe';
    return { key, site: sites[key] || {} };
  }

  function currentCanonicalSlug() {
    const { key, site } = currentSite();
    return canonicalSlug(site.slug || key, site.name);
  }

  function selectedFontKey() {
    return readFonts()[currentCanonicalSlug()] || 'system';
  }

  function fontStack() {
    return FONTS[selectedFontKey()]?.stack || FONTS.system.stack;
  }

  function installCss() {
    if ($('#product-v57-css')) return;
    document.head.insertAdjacentHTML('beforeend', `<style id="product-v57-css">
      .prime-native-site-field{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;opacity:0!important;pointer-events:none!important;margin:0!important;padding:0!important}
      .prime-manager-btn{margin-top:0!important}
      .prime-font-control{border:1px solid rgba(254,237,185,.22);background:linear-gradient(145deg,rgba(254,237,185,.10),rgba(139,232,255,.055));border-radius:22px;padding:14px;margin:0 0 14px;box-shadow:0 18px 45px rgba(0,0,0,.18)}
      .prime-font-control .field{margin:0}.prime-font-control small{display:block;color:rgba(255,255,255,.48);font-size:10px;line-height:1.45;margin-top:8px}
      .prime-mobile-more{display:none}
      .prime-quick-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.prime-quick-grid button,.prime-quick-grid a{min-height:76px;border:1px solid rgba(255,255,255,.13);border-radius:22px;background:linear-gradient(145deg,rgba(255,255,255,.09),rgba(255,255,255,.03));color:#fff;text-decoration:none;display:grid;place-items:center;font:900 13px/1.1 Arial;cursor:pointer}.prime-quick-grid .accent{background:linear-gradient(135deg,#fff5c7,#feedb9,#8be8ff);color:#061f3d;border-color:transparent}
      .preview-stage .jb-site,.preview-stage .jb-card,.preview-stage .jb-nav button,.preview-stage .title,.preview-stage .links a,.preview-stage .jb-powered{font-family:var(--prime-site-font,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif)!important}
      @media(max-width:820px){
        html,body{overscroll-behavior:none}.app{grid-template-rows:64px 1fr!important}.topbar{height:64px!important;padding:7px 12px!important}.brand{min-width:0!important;gap:9px!important}.mark{width:42px!important;height:42px!important;border-radius:15px!important}.brand strong{font-size:17px!important;line-height:1!important;max-width:none!important;white-space:nowrap}.brand small{font-size:8px!important}.actions{display:none!important}.prime-mobile-more{margin-left:auto;width:42px;height:42px;border-radius:15px;border:1px solid rgba(255,255,255,.15);background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(255,255,255,.035));color:#fff;display:grid;place-items:center;font-size:21px;line-height:1;box-shadow:0 15px 36px rgba(0,0,0,.28)}
        .workspace{height:calc(100dvh - 64px)!important}.preview-panel{height:calc(100dvh - 64px)!important;padding:8px 8px calc(82px + env(safe-area-inset-bottom))!important}.device{border-width:5px!important;border-radius:26px!important;box-shadow:0 28px 80px rgba(0,0,0,.72)!important}
        .prime-mobile-sheet{left:0!important;right:0!important;top:auto!important;bottom:0!important;height:min(72dvh,680px)!important;border-radius:32px 32px 0 0!important;border-bottom:0!important;padding-bottom:env(safe-area-inset-bottom)!important;background:linear-gradient(165deg,rgba(27,34,48,.995),rgba(7,9,14,.995))!important}
        .prime-sheet-head{min-height:62px!important;padding:18px 16px 10px!important}.prime-sheet-head b{font-size:16px!important}.prime-sheet-head button{padding:10px 16px!important}
        .prime-sheet-body>.panel{padding:12px 14px 32px!important}.prime-sheet-body .panel h2{font-size:22px!important}.prime-sheet-body .field input,.prime-sheet-body .field textarea,.prime-sheet-body .field select{min-height:48px!important;font-size:16px!important}.prime-sheet-body .mini-btn,.prime-sheet-body .tiny,.prime-sheet-body .wide-btn{min-height:42px!important}
        .prime-mobile-dock{left:12px!important;right:88px!important;bottom:calc(10px + env(safe-area-inset-bottom))!important;gap:5px!important;padding:6px!important;border-radius:23px!important;background:rgba(7,9,13,.88)!important;-webkit-backdrop-filter:blur(28px) saturate(1.3)!important;backdrop-filter:blur(28px) saturate(1.3)!important}.prime-mobile-dock button{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;min-height:50px!important;border-radius:18px!important;padding:7px 3px!important;font-size:9px!important}.prime-mobile-dock svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.8}.prime-mobile-dock button:nth-child(3),.prime-mobile-dock button:nth-child(4){background:rgba(255,255,255,.07)!important;color:#fff!important}.prime-mobile-dock button.motion-active,.prime-mobile-dock button[data-mobile-add]:active,.prime-mobile-dock button[data-mobile-publish]:active{background:linear-gradient(135deg,#fff5c7,#feedb9,#8be8ff)!important;color:#061f3d!important}
        .status{left:15px!important;right:96px!important;bottom:calc(72px + env(safe-area-inset-bottom))!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.prime-mobile-hide{display:none!important}.hint{font-size:11px}.modal-card{border-radius:28px!important;padding:18px!important}.prime-quick-grid{grid-template-columns:1fr 1fr}
      }
    </style>`);
  }

  function hideNativeSelector() {
    const field = $('[data-site-select]')?.closest('.field');
    field?.classList.add('prime-native-site-field');
  }

  function applyFont() {
    const preview = $('[data-preview]');
    if (preview) preview.style.setProperty('--prime-site-font', fontStack());
    const control = $('[data-prime-font]');
    if (control && control.value !== selectedFontKey()) control.value = selectedFontKey();
  }

  function installFontControl() {
    const editor = $('[data-editor]');
    if (!editor || !$('[data-mode="style"]')?.classList.contains('active')) return;
    if ($('[data-prime-font]', editor)) return applyFont();
    const options = Object.entries(FONTS).map(([key, item]) => `<option value="${key}">${item.label}</option>`).join('');
    editor.insertAdjacentHTML('afterbegin', `<section class="prime-font-control"><label class="field"><span>Font family</span><select data-prime-font>${options}</select></label><small>Built-in, license-safe system fonts. Custom uploaded font packs can be connected to BOOSTR Assets next.</small></section>`);
    $('[data-prime-font]', editor).value = selectedFontKey();
    applyFont();
  }

  function setFont(key) {
    if (!FONTS[key]) return;
    const fonts = readFonts();
    fonts[currentCanonicalSlug()] = key;
    localStorage.setItem(FONT_KEY, JSON.stringify(fonts));
    applyFont();
    status(`Font changed to ${FONTS[key].label}.`);
    clearTimeout(saveFontTimer);
    saveFontTimer = setTimeout(() => $('[data-action="save-draft"]')?.click(), 500);
  }

  function decorateMobileDock() {
    const icons = {
      sites: '<svg viewBox="0 0 24 24"><path d="M5 6.5h14M5 12h14M5 17.5h14"/></svg><span>Sites</span>',
      edit: '<svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M7 14v6"/></svg><span>Edit</span>',
      add: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span>Add</span>',
      publish: '<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg><span>Publish</span>'
    };
    const map = [['[data-mobile-sites]', icons.sites], ['[data-mobile-edit]', icons.edit], ['[data-mobile-add]', icons.add], ['[data-mobile-publish]', icons.publish]];
    map.forEach(([selector, html]) => { const button = $(selector); if (button && !button.querySelector('svg')) button.innerHTML = html; });
  }

  function installMobileMore() {
    if (!MOBILE.matches || $('[data-mobile-more]')) return;
    $('.topbar')?.insertAdjacentHTML('beforeend', '<button class="prime-mobile-more" type="button" data-mobile-more aria-label="More actions">•••</button>');
  }

  function openQuickMenu() {
    $('.modal-backdrop')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop"><div class="modal-card"><div class="modal-head"><img src="/assets/link/82ngel/logo.png" alt=""><div><small>JOHANKA OS</small><h2>Quick actions</h2></div></div><div class="prime-quick-grid"><button class="accent" type="button" data-quick="new">New Carrd</button><button type="button" data-quick="save">Save Draft</button><button type="button" data-quick="export">Export HTML</button><a href="/johankarrd/">Open Carrds</a></div><div class="modal-actions"><button class="btn" data-close-modal>Close</button></div></div></div>`);
  }

  function closeTopLayer() {
    const modal = $('.modal-backdrop');
    if (modal) {
      modal.remove();
      return true;
    }
    const sheet = $('[data-mobile-sheet].open');
    if (sheet) {
      $('[data-mobile-close]')?.click();
      return true;
    }
    return false;
  }

  function exportWithFont() {
    const code = $('[data-code]')?.value;
    if (!code) return status('Nothing to export.');
    const stack = fontStack();
    const fontCss = `<style>body,.site,.card,.nav a,.title,.links a,.powered{font-family:${stack}!important}</style>`;
    const html = code.includes('</head>') ? code.replace('</head>', `${fontCss}</head>`) : `${fontCss}${code}`;
    const { key, site } = currentSite();
    const slug = canonicalSlug(site.slug || key, site.name) || 'johankarrd';
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug}.html`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status('HTML exported with selected font.');
  }

  function markMobileNoise() {
    if (!MOBILE.matches) return;
    const code = $('.codebox');
    code?.classList.add('prime-mobile-hide');
    if (code?.previousElementSibling?.tagName === 'H2') code.previousElementSibling.classList.add('prime-mobile-hide');
  }

  function installEvents() {
    document.addEventListener('change', (event) => {
      if (event.target.matches('[data-prime-font]')) setFont(event.target.value);
      if (event.target.matches('[data-site-select]')) setTimeout(() => { applyFont(); installFontControl(); }, 40);
    }, true);

    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-mobile-more]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openQuickMenu();
        return;
      }
      const quick = event.target.closest('[data-quick]');
      if (quick) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const action = quick.dataset.quick;
        $('.modal-backdrop')?.remove();
        if (action === 'new') $('[data-action="new-site"]')?.click();
        if (action === 'save') $('[data-action="save-draft"]')?.click();
        if (action === 'export') exportWithFont();
        return;
      }
      const exportButton = event.target.closest('[data-action="export-html"]');
      if (exportButton) {
        event.preventDefault();
        event.stopImmediatePropagation();
        exportWithFont();
      }
    }, true);

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (closeTopLayer()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      } else if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
    }, true);
  }

  function observeUi() {
    const observer = new MutationObserver(() => {
      hideNativeSelector();
      installFontControl();
      applyFont();
      decorateMobileDock();
      markMobileNoise();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    installCss();
    hideNativeSelector();
    installMobileMore();
    decorateMobileDock();
    installEvents();
    observeUi();
    setTimeout(() => { installFontControl(); applyFont(); markMobileNoise(); }, 500);
  }

  window.addEventListener('load', init);
})();
