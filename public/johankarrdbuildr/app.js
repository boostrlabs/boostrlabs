(() => {
  'use strict';

  const KEY = 'johankarrd-buildr-v6';
  const OLD_KEYS = ['johankarrd-buildr', 'johankarrd-buildr-v2', 'johankarrd-buildr-v3', 'johankarrd-buildr-v4', 'johankarrd-buildr-v5'];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const E = {
    site: $('[data-site-select]'),
    secs: $('[data-section-list]'),
    edit: $('[data-editor]'),
    prev: $('[data-preview]'),
    code: $('[data-code]'),
    status: $('[data-status]')
  };

  const LIBRARY = [
    '/assets/link/82ngel/logo.png',
    '/assets/johankarrd/cafedelmar/logofull.png',
    '/assets/johankarrd/cafedelmar/logofullblue.png',
    '/assets/johankarrd/cafedelmar/image01.png',
    '/assets/johankarrd/cafedelmar/image04.jpg',
    '/assets/johankarrd/cafedelmar/image06.jpg',
    '/assets/johankarrd/cafedelmar/image07.jpg',
    '/assets/johankarrd/cafedelmar/image09.jpg',
    '/assets/johankarrd/cafedelmar/image16.jpg',
    '/assets/johankarrd/cafedelmar/image18.jpg',
    '/assets/johankarrd/cafedelmar/3299c2ea.jpg',
    '/assets/johankarrd/cafedelmar/2791d0e1.jpg',
    '/assets/johankarrd/cafedelmar/46493ee7.jpg',
    '/assets/johankarrd/solveinventory/inventory.jpg',
    '/assets/johankarrd/solveinventory/camaro.png',
    '/assets/johankarrd/solveinventory/supra.png',
    '/assets/johankarrd/solveinventory/typer.png',
    '/assets/johankarrd/solveinventory/challengersrt.png',
    '/assets/johankarrd/solveinventory/elantra.png',
    '/assets/johankarrd/solveinventory/toyota.jpg',
    '/assets/johankarrd/solveinventory/honda.jpg',
    '/assets/johankarrd/solveinventory/cdjr.jpg',
    '/assets/johankarrd/solveinventory/hyundai.jpg'
  ];

  const BLOCKS = [
    { type: 'title', label: 'Title', desc: 'Big text section label', icon: 'T' },
    { type: 'image', label: 'Image', desc: 'Photo, flyer, menu or car', icon: '◫' },
    { type: 'logo', label: 'Logo', desc: 'Brand mark or header logo', icon: '◎' },
    { type: 'links', label: 'Links', desc: 'Four-button action strip', icon: '↗' },
    { type: 'gallery', label: 'Gallery', desc: 'Image grid', icon: '▦' },
    { type: 'grid', label: 'Car Grid', desc: 'Inventory style grid', icon: '◇' }
  ];

  let S = { sites: {}, site: 'cafe', sec: 'home', mode: 'content', selectedItem: null };
  let dragIndex = null;
  let undoTimer = null;
  let undoSnapshot = null;

  const clone = (x) => JSON.parse(JSON.stringify(x));
  const esc = (x) => String(x ?? '').replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
  const attr = (x) => esc(x).replace(/"/g, '&quot;');
  const slugify = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `site-${Date.now()}`;
  const msg = (x) => { if (E.status) E.status.textContent = x; };
  const site = () => S.sites[S.site];
  const section = () => site().sections.find((x) => x.id === S.sec) || site().sections[0];

  function installExtraCss() {
    if ($('#johankarrd-buildr-extra-css')) return;
    const style = document.createElement('style');
    style.id = 'johankarrd-buildr-extra-css';
    style.textContent = `
      .undo-toast{position:fixed;left:50%;bottom:22px;z-index:120;transform:translateX(-50%);display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid rgba(254,237,185,.32);border-radius:999px;background:rgba(6,9,14,.86);backdrop-filter:blur(18px);box-shadow:0 24px 70px rgba(0,0,0,.52);font:900 11px/1 Arial;color:#fff;animation:popIn .2s}.undo-toast button{border:0;border-radius:999px;padding:9px 12px;background:linear-gradient(135deg,#fff5c7,#feedb9,#8be8ff);color:#061f3d;font:1000 10px/1 Arial;cursor:pointer}.preview-object{width:100%;display:grid;place-items:center;border:1px solid transparent;border-radius:14px;transition:.16s}.preview-object:hover,.preview-object.selected{border-color:rgba(254,237,185,.78);box-shadow:0 0 0 4px rgba(254,237,185,.08);cursor:pointer}.preview-stage.drop-ready{outline:2px dashed rgba(254,237,185,.8);outline-offset:-18px}.asset-card{cursor:grab}.item-editor.selected{border-color:rgba(254,237,185,.72);box-shadow:0 0 0 4px rgba(254,237,185,.08)}.live-link{display:inline-flex;align-items:center;gap:6px;margin-left:8px;color:#feedb9;text-decoration:none;font:900 10px Arial}.modal-actions .live-link{margin-left:0;padding:10px 14px;border:1px solid rgba(254,237,185,.35);border-radius:999px}`;
    document.head.append(style);
  }

  function bootData() {
    OLD_KEYS.forEach((key) => localStorage.removeItem(key));
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && saved.cafe && saved.inventory) return saved;
    } catch (_) {}
    return clone(window.JOHANKARRD_SEED || {});
  }

  function normalize() {
    if (!S.sites || !S.sites.cafe || !S.sites.inventory) S.sites = clone(window.JOHANKARRD_SEED || {});
    if (!S.sites[S.site]) S.site = Object.keys(S.sites)[0];
    if (!site().sections || !site().sections.length) site().sections = [{ id: 'home', label: 'Home', items: [] }];
    if (!site().sections.find((x) => x.id === S.sec)) S.sec = site().sections[0].id;
    const max = section().items.length - 1;
    if (S.selectedItem !== null && (S.selectedItem < 0 || S.selectedItem > max)) S.selectedItem = null;
  }

  function cacheLocal() {
    localStorage.setItem(KEY, JSON.stringify(S.sites));
  }

  function snapshot(label = 'Action') {
    undoSnapshot = { label, state: clone(S) };
  }

  function showUndo(label = 'Action') {
    $('.undo-toast')?.remove();
    clearTimeout(undoTimer);
    const toast = document.createElement('div');
    toast.className = 'undo-toast';
    toast.innerHTML = `<span>${esc(label)}</span><button type="button">Undo</button>`;
    $('button', toast).addEventListener('click', () => {
      if (undoSnapshot?.state) {
        S = clone(undoSnapshot.state);
        cacheLocal();
        render();
        msg('Undo aplicado.');
      }
      toast.remove();
      undoSnapshot = null;
      clearTimeout(undoTimer);
    });
    document.body.append(toast);
    undoTimer = setTimeout(() => {
      toast.remove();
      undoSnapshot = null;
    }, 5000);
  }

  function commitAction(label, fn) {
    snapshot(label);
    fn();
    cacheLocal();
    render();
    showUndo(label);
  }

  async function loadRemote() {
    try {
      const res = await fetch('/api/johankarrd/drafts', { cache: 'no-store' });
      if (!res.ok) throw new Error('drafts unavailable');
      const json = await res.json();
      if (json.sites && json.sites.cafe && json.sites.inventory) {
        S.sites = json.sites;
        normalize();
        cacheLocal();
        render();
        msg('Draft cloud loaded.');
      }
    } catch (_) {
      msg('Ready');
    }
  }

  async function saveDraft(show = true) {
    normalize();
    cacheLocal();
    try {
      const res = await fetch('/api/johankarrd/drafts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sites: S.sites })
      });
      if (!res.ok) throw new Error('cloud save failed');
      if (show) msg('Draft guardado en BOOSTR.');
      return true;
    } catch (_) {
      if (show) msg('Draft guardado en este navegador.');
      return false;
    }
  }

  async function publishDraft() {
    await saveDraft(false);
    const current = site();
    const slug = current.slug || S.site;
    try {
      const res = await fetch('/api/johankarrd/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, site: current, sites: S.sites })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'publish failed');
      const link = `/johankarrd/${data.slug || slug}/`;
      msg(`Publicado live: ${link}`);
      publishedModal(link);
    } catch (_) {
      msg('No se pudo publicar live. Draft guardado.');
    }
  }

  function render() {
    normalize();
    renderSites();
    renderSections();
    renderEditor();
    renderPreview();
  }

  function refreshAfterInput() {
    normalize();
    renderSites();
    renderSections();
    renderPreview();
    cacheLocal();
  }

  function renderSites() {
    E.site.innerHTML = Object.keys(S.sites).map((key) => `<option value="${attr(key)}" ${key === S.site ? 'selected' : ''}>${esc(S.sites[key].name || key)}</option>`).join('');
  }

  function renderSections() {
    E.secs.innerHTML = site().sections.map((item, index) => `<button class="item ${item.id === S.sec ? 'active' : ''}" type="button" draggable="true" data-sec="${attr(item.id)}" data-section-index="${index}"><b>${esc(item.label || item.id)}</b><span>#${esc(item.id)}</span></button>`).join('');
  }

  function field(label, value, target, key, index = '', multiline = false) {
    const common = `data-edit data-target="${target}" data-key="${key}" data-index="${index}"`;
    if (multiline) return `<label class="field"><span>${label}</span><textarea ${common}>${esc(value || '')}</textarea></label>`;
    return `<label class="field"><span>${label}</span><input value="${attr(value || '')}" ${common}></label>`;
  }

  function imageTools(item, index) {
    return `<div class="asset-row"><img class="thumb" src="${attr(item.src || '')}" alt=""><div class="image-tools"><button class="tiny shine" type="button" data-pick-image="${index}">Choose</button><label class="tiny upload-label">Upload<input type="file" accept="image/*" data-upload="${index}" hidden></label><button class="tiny danger" type="button" data-rm="${index}">Delete</button></div></div>`;
  }

  function renderEditor() {
    $$('[data-mode]').forEach((btn) => btn.classList.toggle('active', btn.dataset.mode === S.mode));
    const current = site();
    const currentSection = section();
    let html = '';

    if (S.mode === 'style') {
      html += field('Site name', current.name, 'site', 'name');
      html += field('Slug', current.slug, 'site', 'slug');
      html += field('Background', current.bg, 'site', 'bg');
      html += field('Accent', current.accent, 'site', 'accent');
      html += field('Card', current.card, 'site', 'card');
      html += `<div class="style-presets"><button class="preset" type="button" data-preset="dark">Dark</button><button class="preset" type="button" data-preset="cafe">Café</button><button class="preset" type="button" data-preset="82">82</button></div>`;
    } else if (S.mode === 'assets') {
      html += `<div class="row-actions"><button class="mini-btn premium" type="button" data-act="add-block">+ Add element</button><label class="mini-btn premium upload-label">Upload asset<input type="file" accept="image/*" data-upload-new hidden></label></div>`;
      html += `<div class="asset-grid">${LIBRARY.map((path) => `<button class="asset-card" draggable="true" type="button" data-asset="${attr(path)}"><img src="${attr(path)}" alt=""><span>${esc(path.split('/').pop())}</span></button>`).join('')}</div>`;
    } else {
      html += field('Section label', currentSection.label, 'sec', 'label');
      html += field('Hash ID', currentSection.id, 'sec', 'id');
      html += `<div class="row-actions"><button class="mini-btn premium" type="button" data-act="add-block">+ Add element</button><button class="mini-btn" type="button" data-act="add-section">+ Section</button><button class="mini-btn danger" type="button" data-act="delete-section">Delete section</button></div>`;
      currentSection.items.forEach((item, index) => {
        html += `<div class="item-editor ${S.selectedItem === index ? 'selected' : ''}" draggable="true" data-drag-index="${index}" data-item-card="${index}"><div class="item-head"><span class="drag-handle">⋮⋮</span><b>${esc(item.type)}</b><div><button class="tiny" type="button" data-up="${index}">↑</button><button class="tiny" type="button" data-down="${index}">↓</button><button class="tiny danger" type="button" data-rm="${index}">Remove</button></div></div>`;
        if ('src' in item) html += imageTools(item, index);
        if ('text' in item) html += field('Text', item.text, 'item', 'text', index);
        if ('link' in item) html += field('Click link', item.link, 'item', 'link', index);
        if ('links' in item) html += field('Links label|url', item.links.map((row) => row.join('|')).join('\n'), 'item', 'links', index, true);
        if ('imgs' in item) html += field('Gallery images', item.imgs.join('\n'), 'item', 'imgs', index, true);
        if ('tiles' in item) html += field('Grid tiles label|car|logo|href', item.tiles.map((row) => row.join('|')).join('\n'), 'item', 'tiles', index, true);
        html += '</div>';
      });
    }

    E.edit.innerHTML = html;
    $$('[data-edit]', E.edit).forEach((node) => node.addEventListener('input', onInput));
    $$('[data-upload]', E.edit).forEach((node) => node.addEventListener('change', onUploadItem));
    $$('[data-upload-new]', E.edit).forEach((node) => node.addEventListener('change', onUploadNewAsset));
  }

  function onInput(event) {
    const el = event.target;
    const target = el.dataset.target;
    const key = el.dataset.key;
    const value = el.value;
    if (target === 'site') site()[key] = value;
    if (target === 'sec') {
      const current = section();
      current[key] = value;
      if (key === 'id') S.sec = value;
    }
    if (target === 'item') {
      const item = section().items[Number(el.dataset.index)];
      if (!item) return;
      if (key === 'links') item.links = value.split('\n').filter(Boolean).map((row) => row.split('|'));
      else if (key === 'imgs') item.imgs = value.split('\n').filter(Boolean);
      else if (key === 'tiles') item.tiles = value.split('\n').filter(Boolean).map((row) => row.split('|'));
      else item[key] = value;
    }
    refreshAfterInput();
  }

  async function uploadToR2(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/johankarrd/assets', { method: 'POST', body: form });
    if (!res.ok) throw new Error('upload failed');
    const data = await res.json();
    if (!data.url) throw new Error('missing upload url');
    return data.url;
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function onUploadItem(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const index = Number(event.target.dataset.upload);
    const item = section().items[index];
    if (!item) return;
    snapshot('Image uploaded');
    msg('Uploading image…');
    try {
      item.src = await uploadToR2(file);
      msg('Imagen subida a BOOSTR Assets.');
    } catch (_) {
      item.src = await fileToDataUrl(file);
      msg('Imagen cargada en preview.');
    }
    await saveDraft(false);
    render();
    showUndo('Image uploaded');
  }

  async function onUploadNewAsset(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    msg('Uploading asset…');
    let url;
    try {
      url = await uploadToR2(file);
      LIBRARY.unshift(url);
      msg('Asset subido a BOOSTR Assets.');
    } catch (_) {
      url = await fileToDataUrl(file);
      msg('Asset cargado en preview.');
    }
    addItem({ type: 'image', src: url });
  }

  function addItem(item) {
    commitAction('Element added', () => {
      section().items.push(item);
      S.selectedItem = section().items.length - 1;
    });
  }

  function addSection(label = '') {
    const name = label || `Section ${site().sections.length + 1}`;
    commitAction('Section added', () => {
      const id = slugify(name);
      site().sections.push({ id, label: name, items: [{ type: 'title', text: name.toUpperCase() }] });
      S.sec = id;
      S.selectedItem = 0;
    });
  }

  function deleteSection() {
    if (site().sections.length < 2) return msg('Debe quedar al menos una sección.');
    commitAction('Section deleted', () => {
      site().sections = site().sections.filter((item) => item.id !== S.sec);
      S.sec = site().sections[0].id;
      S.selectedItem = null;
    });
  }

  function blankTemplate(name, type = 'cafe') {
    const slug = slugify(name);
    const cafeStyle = {
      bg: 'linear-gradient(142deg,#0a203d 0%,#2b4e72 57%,#a8b3b5 100%)',
      accent: '#feedb9',
      card: '#062040'
    };
    const inventoryStyle = { bg: '#000', accent: '#fff', card: '#050505' };
    const base = type === 'inventory' ? inventoryStyle : cafeStyle;
    const sections = type === 'inventory'
      ? [
          { id: 'home', label: 'Home', items: [{ type: 'title', text: name }] },
          { id: 'inventory', label: 'Inventory', items: [] },
          { id: 'contact', label: 'Contact', items: [{ type: 'links', links: [['CALL', '#'], ['TEXT', '#'], ['INSTA', '#'], ['MAP', '#']] }] }
        ]
      : [
          { id: 'home', label: 'Home', items: [{ type: 'title', text: name }] },
          { id: 'menu', label: 'Menu', items: [] },
          { id: 'contact', label: 'Contact', items: [{ type: 'links', links: [['MAIL', 'mailto:'], ['INSTA', '#'], ['ORDER', '#'], ['TIKTOK', '#']] }] },
          { id: 'gallery', label: 'Gallery', items: [] }
        ];
    return { name, slug, ...base, sections };
  }

  function createSite(name, base = 'cafe') {
    commitAction('Johankarrd created', () => {
      const slug = slugify(name);
      S.sites[slug] = blankTemplate(name, base);
      S.site = slug;
      S.sec = S.sites[slug].sections[0].id;
      S.selectedItem = 0;
    });
    msg(`Creada. Publish Live para verla en /johankarrd/${slugify(name)}/`);
  }

  function cycleImage(index, src) {
    const item = section().items[index];
    if (!item || !('src' in item)) return;
    commitAction('Image changed', () => {
      item.src = src;
      S.selectedItem = index;
    });
  }

  function removeItem(index) {
    commitAction('Element removed', () => {
      section().items.splice(index, 1);
      S.selectedItem = null;
    });
  }

  function moveItem(index, direction) {
    const items = section().items;
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    commitAction('Element moved', () => {
      const [item] = items.splice(index, 1);
      items.splice(target, 0, item);
      S.selectedItem = target;
    });
  }

  function itemHtml(item) {
    if (item.type === 'title') return `<div class="title">${esc(item.text)}</div>`;
    if (item.type === 'logo') return `<img class="logo" src="${attr(item.src)}" alt="">`;
    if (item.type === 'image') {
      const image = `<img class="shot" src="${attr(item.src)}" alt="">`;
      return item.link ? `<a href="${attr(item.link)}" target="_blank" rel="noopener">${image}</a>` : image;
    }
    if (item.type === 'links') return `<div class="links">${(item.links || []).map((row) => `<a href="${attr(row[1] || '#')}">${esc(row[0] || 'LINK')}</a>`).join('')}</div>`;
    if (item.type === 'gallery') return `<div class="gallery">${(item.imgs || []).map((src) => `<img src="${attr(src)}" alt="">`).join('')}</div>`;
    if (item.type === 'grid') return `<div class="cargrid">${(item.tiles || []).map((row) => `<a href="${attr(row[3] || '#')}"><img src="${attr(row[1])}" alt=""><img src="${attr(row[2])}" alt=""></a>`).join('')}</div>`;
    return '';
  }

  function pageCss(current, prefix = 'jb-') {
    return `.${prefix}site{width:100%;height:100%;position:relative;overflow:hidden;background:${current.bg};color:${current.accent};font-family:Arial,sans-serif}.${prefix}nav{position:absolute;top:22px;left:50%;transform:translateX(-50%);z-index:5;display:flex;gap:14px}.${prefix}nav button,.${prefix}nav a{border:0;background:transparent;color:${current.accent};font:900 10px Arial;text-decoration:underline;text-transform:uppercase}.${prefix}page{position:absolute;inset:0;display:grid;place-items:center;opacity:0;pointer-events:none;filter:blur(10px);transform:scale(.99);transition:.45s}.${prefix}page.active{opacity:1;pointer-events:auto;filter:blur(0);transform:none}.${prefix}card{width:min(86%,260px);max-height:84%;overflow:hidden;border-radius:20px;background:${current.card};padding:14px;display:grid;gap:9px;place-items:center;box-shadow:0 20px 38px #0008}.${prefix}card img{display:block;max-width:100%;height:auto}.logo{max-height:84px;object-fit:contain}.shot{border-radius:8px}.title{font:1000 34px/.85 Arial;text-align:center;text-transform:uppercase}.links{background:#feedb9;color:#061f3d;border-radius:12px;padding:12px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:100%}.links a{color:#061f3d;text-align:center;font:900 9px Arial;text-decoration:none}.gallery{display:grid;grid-template-columns:1fr 1fr;gap:7px}.gallery img{aspect-ratio:1/1;object-fit:cover;border-radius:6px}.cargrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cargrid a{display:grid;place-items:center}.${prefix}powered{position:absolute;bottom:10px;left:0;right:0;text-align:center;color:#ffffff5c;font:10px Arial}`;
  }

  function renderPreview() {
    const current = site();
    const nav = current.sections.map((item) => `<button type="button" data-view="${attr(item.id)}">${esc(item.label)}</button>`).join('');
    const pages = current.sections.map((item) => `<section class="jb-page ${item.id === S.sec ? 'active' : ''}"><div class="jb-card">${item.items.map((block, index) => `<div class="preview-object ${S.selectedItem === index && item.id === S.sec ? 'selected' : ''}" data-preview-item="${index}">${itemHtml(block)}</div>`).join('')}</div></section>`).join('');
    E.prev.innerHTML = `<style>${pageCss(current)}</style><div class="jb-site"><nav class="jb-nav">${nav}</nav>${pages}<div class="jb-powered">Powered by BOOSTR Labs</div></div>`;
    $$('[data-view]', E.prev).forEach((button) => button.addEventListener('click', () => { S.sec = button.dataset.view; S.selectedItem = null; render(); }));
    $$('[data-preview-item]', E.prev).forEach((node) => node.addEventListener('click', () => selectItem(Number(node.dataset.previewItem))));
    E.code.value = buildHtml(current);
  }

  function buildHtml(current = site()) {
    const css = `*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}body{font-family:Arial,sans-serif}.site{width:100vw;height:100vh;position:relative;overflow:hidden;background:${current.bg};color:${current.accent}}${pageCss(current, '').replace('.site{width:100%;height:100%;position:relative;overflow:hidden;background:' + current.bg + ';color:' + current.accent + ';font-family:Arial,sans-serif}', '')}`;
    const nav = current.sections.map((item) => `<a href="#${attr(item.id)}">${esc(item.label)}</a>`).join('');
    const pages = current.sections.map((item) => `<section class="page" id="${attr(item.id)}"><div class="card">${item.items.map(itemHtml).join('')}</div></section>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(current.name)}</title><style>${css}</style></head><body><div class="site"><nav class="nav">${nav}</nav>${pages}<div class="powered">Powered by BOOSTR Labs</div></div><script>const ids=${JSON.stringify(current.sections.map((item) => item.id))};function show(){let id=location.hash.slice(1)||ids[0];if(!ids.includes(id))id=ids[0];document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));}addEventListener('hashchange',show);show();<\/script></body></html>`;
  }

  function exportHtml() {
    const blob = new Blob([buildHtml()], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${site().slug || S.site}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
    msg('HTML exportado.');
  }

  function setPreset(name) {
    commitAction('Style changed', () => {
      const current = site();
      if (name === 'dark') Object.assign(current, { bg: '#000', accent: '#fff', card: '#050505' });
      if (name === 'cafe') Object.assign(current, { bg: 'linear-gradient(142deg,#0a203d 0%,#2b4e72 57%,#a8b3b5 100%)', accent: '#feedb9', card: '#062040' });
      if (name === '82') Object.assign(current, { bg: 'radial-gradient(circle at 50% 0,rgba(255,255,255,.14),transparent 32%),#000', accent: '#fff', card: '#08080b' });
    });
  }

  function modal(html) {
    const old = $('.modal-backdrop');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop"><div class="modal-card">${html}</div></div>`);
    const box = $('.modal-backdrop');
    box.addEventListener('click', (event) => { if (event.target === box || event.target.closest('[data-close-modal]')) box.remove(); });
    return box;
  }

  function newSiteModal() {
    const box = modal(`<div class="modal-head"><img src="/assets/link/82ngel/logo.png" alt=""><div><small>JOHANKA OS</small><h2>Crear Johankarrd</h2></div></div><label class="field"><span>Nombre</span><input data-new-name placeholder="Ej: New Drop, Café Menu, Booking"></label><div class="template-row"><button class="template active" data-template="cafe">Café layout</button><button class="template" data-template="inventory">Inventory layout</button></div><div class="modal-actions"><button class="btn" data-close-modal>Cancel</button><button class="btn gold" data-create-site>Create</button></div>`);
    let base = 'cafe';
    $$('[data-template]', box).forEach((btn) => btn.onclick = () => { base = btn.dataset.template; $$('[data-template]', box).forEach((b) => b.classList.toggle('active', b === btn)); });
    $('[data-create-site]', box).onclick = () => {
      const name = $('[data-new-name]', box).value.trim();
      if (!name) return $('[data-new-name]', box).focus();
      createSite(name, base);
      box.remove();
    };
    $('[data-new-name]', box).focus();
  }

  function sectionModal() {
    const box = modal(`<div class="modal-head"><div class="orb">#</div><div><small>NEW AREA</small><h2>Add section</h2></div></div><label class="field"><span>Section name</span><input data-section-name placeholder="Gallery, Contact, Menu, Offers"></label><div class="modal-actions"><button class="btn" data-close-modal>Cancel</button><button class="btn gold" data-create-section>Create</button></div>`);
    $('[data-create-section]', box).onclick = () => {
      const name = $('[data-section-name]', box).value.trim();
      if (!name) return $('[data-section-name]', box).focus();
      addSection(name);
      box.remove();
    };
    $('[data-section-name]', box).focus();
  }

  function addBlockModal() {
    const box = modal(`<div class="modal-head"><div class="orb">+</div><div><small>ADD ELEMENT</small><h2>Choose block</h2></div></div><div class="block-grid">${BLOCKS.map((b) => `<button class="block-choice" data-block="${b.type}"><i>${b.icon}</i><b>${b.label}</b><span>${b.desc}</span></button>`).join('')}</div>`);
    $$('[data-block]', box).forEach((btn) => btn.onclick = () => { box.remove(); configureBlockModal(btn.dataset.block); });
  }

  function configureBlockModal(type) {
    const block = BLOCKS.find((b) => b.type === type) || BLOCKS[0];
    let fields = '';
    if (type === 'title') fields = `<label class="field"><span>Text</span><input data-value="text" value="NEW SECTION"></label>`;
    if (type === 'image' || type === 'logo') fields = `<label class="field"><span>Image URL</span><input data-value="src" value="${attr(type === 'logo' ? LIBRARY[1] : LIBRARY[4])}"></label><label class="field"><span>Click link optional</span><input data-value="link" placeholder="https:// or #section"></label><label class="upload-drop">Upload image<input type="file" accept="image/*" data-config-upload hidden></label>`;
    if (type === 'links') fields = `<label class="field"><span>Links label|url</span><textarea data-value="links">MAIL|mailto:\nINSTA|#\nORDER|#\nTIKTOK|#</textarea></label>`;
    if (type === 'gallery') fields = `<label class="field"><span>Gallery images</span><textarea data-value="imgs">${LIBRARY.slice(4, 10).join('\n')}</textarea></label>`;
    if (type === 'grid') fields = `<label class="field"><span>Grid tiles label|car|logo|href</span><textarea data-value="tiles">Toyota|/assets/johankarrd/solveinventory/supra.png|/assets/johankarrd/solveinventory/toyota.jpg|#toyota\nHonda|/assets/johankarrd/solveinventory/typer.png|/assets/johankarrd/solveinventory/honda.jpg|#honda</textarea></label>`;
    const box = modal(`<div class="modal-head"><div class="orb">${block.icon}</div><div><small>${esc(block.label)}</small><h2>Set details</h2></div></div>${fields}<div class="modal-actions"><button class="btn" data-close-modal>Cancel</button><button class="btn gold" data-add-configured>Add</button></div>`);
    const upload = $('[data-config-upload]', box);
    if (upload) upload.addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try { $('[data-value="src"]', box).value = await uploadToR2(file); }
      catch (_) { $('[data-value="src"]', box).value = await fileToDataUrl(file); }
    });
    $('[data-add-configured]', box).onclick = () => {
      const get = (key) => $(`[data-value="${key}"]`, box)?.value || '';
      let item;
      if (type === 'title') item = { type, text: get('text') };
      if (type === 'image' || type === 'logo') item = { type, src: get('src') };
      if ((type === 'image' || type === 'logo') && get('link')) item.link = get('link');
      if (type === 'links') item = { type, links: get('links').split('\n').filter(Boolean).map((row) => row.split('|')) };
      if (type === 'gallery') item = { type, imgs: get('imgs').split('\n').filter(Boolean) };
      if (type === 'grid') item = { type, tiles: get('tiles').split('\n').filter(Boolean).map((row) => row.split('|')) };
      addItem(item);
      box.remove();
    };
  }

  function imagePickerModal(index) {
    const box = modal(`<div class="modal-head"><div class="orb">◫</div><div><small>IMAGE</small><h2>Choose asset</h2></div></div><div class="asset-grid modal-assets">${LIBRARY.map((path) => `<button class="asset-card" data-set-image="${attr(path)}"><img src="${attr(path)}"><span>${esc(path.split('/').pop())}</span></button>`).join('')}</div><label class="upload-drop">Upload new image<input type="file" accept="image/*" data-modal-upload hidden></label>`);
    $$('[data-set-image]', box).forEach((btn) => btn.onclick = () => { cycleImage(index, btn.dataset.setImage); box.remove(); });
    $('[data-modal-upload]', box).addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      let url;
      try { url = await uploadToR2(file); }
      catch (_) { url = await fileToDataUrl(file); }
      cycleImage(index, url);
      box.remove();
    });
  }

  function publishedModal(link) {
    modal(`<div class="modal-head"><img src="/assets/link/82ngel/logo.png" alt=""><div><small>LIVE</small><h2>Publicado</h2></div></div><p class="hint">La página está live en BOOSTR.</p><div class="modal-actions"><button class="btn" data-close-modal>Close</button><a class="live-link" href="${attr(link)}" target="_blank" rel="noopener">Open live ↗</a></div>`);
  }

  function selectItem(index) {
    S.mode = 'content';
    S.selectedItem = index;
    renderEditor();
    $$('[data-mode]').forEach((btn) => btn.classList.toggle('active', btn.dataset.mode === S.mode));
    setTimeout(() => {
      const card = $(`[data-item-card="${index}"]`, E.edit);
      card?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      card?.querySelector('input,textarea')?.focus({ preventScroll: true });
    }, 30);
  }

  document.addEventListener('click', (event) => {
    const mode = event.target.closest('[data-mode]');
    const secButton = event.target.closest('[data-sec]');
    const action = event.target.closest('[data-act],[data-action]');
    const asset = event.target.closest('[data-asset]');
    const rm = event.target.closest('[data-rm]');
    const pick = event.target.closest('[data-pick-image]');
    const up = event.target.closest('[data-up]');
    const down = event.target.closest('[data-down]');
    const preset = event.target.closest('[data-preset]');
    const itemCard = event.target.closest('[data-item-card]');

    if (mode) { S.mode = mode.dataset.mode; render(); }
    if (secButton) { S.sec = secButton.dataset.sec; S.selectedItem = null; render(); }
    if (asset && !event.defaultPrevented) { addItem({ type: 'image', src: asset.dataset.asset }); }
    if (rm) { removeItem(Number(rm.dataset.rm)); }
    if (pick) { imagePickerModal(Number(pick.dataset.pickImage)); }
    if (up) { moveItem(Number(up.dataset.up), -1); }
    if (down) { moveItem(Number(down.dataset.down), 1); }
    if (preset) { setPreset(preset.dataset.preset); }
    if (itemCard && !event.target.closest('input,textarea,button,label')) { S.selectedItem = Number(itemCard.dataset.itemCard); renderEditor(); }
    if (!action) return;

    const x = action.dataset.act || action.dataset.action;
    if (x === 'new-site') newSiteModal();
    if (x === 'save-draft') saveDraft(true);
    if (x === 'publish-draft') publishDraft();
    if (x === 'export-html') exportHtml();
    if (x === 'reset-local') {
      snapshot('Reset');
      localStorage.removeItem(KEY);
      S.sites = clone(window.JOHANKARRD_SEED);
      S.site = 'cafe';
      S.sec = 'home';
      S.selectedItem = null;
      render();
      showUndo('Reset');
      msg('Reset listo.');
    }
    if (x === 'reload-remote') loadRemote();
    if (x === 'add-section') sectionModal();
    if (x === 'delete-section') deleteSection();
    if (x === 'add-block') addBlockModal();
  });

  document.addEventListener('dragstart', (event) => {
    const asset = event.target.closest('[data-asset]');
    if (asset) {
      event.dataTransfer.setData('text/plain', asset.dataset.asset);
      event.dataTransfer.setData('application/x-johankarrd-asset', asset.dataset.asset);
      event.dataTransfer.effectAllowed = 'copy';
      E.prev.classList.add('drop-ready');
      return;
    }
    const card = event.target.closest('[data-drag-index]');
    if (!card) return;
    dragIndex = Number(card.dataset.dragIndex);
    card.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
  });

  document.addEventListener('dragend', () => {
    dragIndex = null;
    E.prev.classList.remove('drop-ready');
    $$('.dragging').forEach((el) => el.classList.remove('dragging'));
  });

  document.addEventListener('dragover', (event) => {
    if (event.target.closest('[data-drag-index]') || event.target.closest('[data-preview]')) {
      event.preventDefault();
      if (event.target.closest('[data-preview]')) E.prev.classList.add('drop-ready');
    }
  });

  document.addEventListener('drop', async (event) => {
    const preview = event.target.closest('[data-preview]');
    if (preview) {
      event.preventDefault();
      E.prev.classList.remove('drop-ready');
      const asset = event.dataTransfer.getData('application/x-johankarrd-asset') || event.dataTransfer.getData('text/plain');
      const file = event.dataTransfer.files && event.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        let url;
        try { url = await uploadToR2(file); }
        catch (_) { url = await fileToDataUrl(file); }
        addItem({ type: 'image', src: url });
      } else if (asset) {
        addItem({ type: 'image', src: asset });
      }
      return;
    }
    const target = event.target.closest('[data-drag-index]');
    if (!target || dragIndex === null) return;
    event.preventDefault();
    const to = Number(target.dataset.dragIndex);
    if (to === dragIndex) return;
    commitAction('Element moved', () => {
      const items = section().items;
      const [item] = items.splice(dragIndex, 1);
      items.splice(to, 0, item);
      S.selectedItem = to;
    });
  });

  E.site.addEventListener('change', () => {
    S.site = E.site.value;
    S.sec = site().sections[0].id;
    S.selectedItem = null;
    render();
  });

  window.addEventListener('DOMContentLoaded', async () => {
    try {
      installExtraCss();
      S.sites = bootData();
      render();
      msg('Ready');
      await loadRemote();
    } catch (error) {
      console.error(error);
      msg('Builder error: ' + error.message);
    }
  });
})();
