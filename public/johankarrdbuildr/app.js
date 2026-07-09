(() => {
  'use strict';

  const KEY = 'johankarrd-buildr-v5';
  const OLD_KEYS = ['johankarrd-buildr', 'johankarrd-buildr-v2', 'johankarrd-buildr-v3', 'johankarrd-buildr-v4'];
  const $ = (selector) => document.querySelector(selector);
  const E = {
    site: $('[data-site-select]'),
    secs: $('[data-section-list]'),
    edit: $('[data-editor]'),
    prev: $('[data-preview]'),
    code: $('[data-code]'),
    status: $('[data-status]')
  };

  const LIBRARY = [
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

  let S = { sites: {}, site: 'cafe', sec: 'home', mode: 'content' };

  const clone = (x) => JSON.parse(JSON.stringify(x));
  const esc = (x) => String(x ?? '').replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
  const attr = (x) => esc(x).replace(/"/g, '&quot;');
  const msg = (x) => { if (E.status) E.status.textContent = x; };
  const site = () => S.sites[S.site];
  const section = () => site().sections.find((x) => x.id === S.sec) || site().sections[0];

  function load() {
    OLD_KEYS.forEach((key) => localStorage.removeItem(key));
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && saved.cafe && saved.inventory) return saved;
    } catch (_) {}
    return clone(window.JOHANKARRD_SEED || {});
  }

  function normalize() {
    if (!S.sites.cafe || !S.sites.inventory) S.sites = clone(window.JOHANKARRD_SEED || {});
    if (!S.sites[S.site]) S.site = Object.keys(S.sites)[0];
    if (!site().sections || !site().sections.length) site().sections = [{ id: 'home', label: 'Home', items: [] }];
    if (!section()) S.sec = site().sections[0].id;
  }

  function saveLocal(show = true) {
    normalize();
    localStorage.setItem(KEY, JSON.stringify(S.sites));
    if (show) msg('Draft guardado en este navegador.');
  }

  async function publishDraft() {
    saveLocal(false);
    try {
      const res = await fetch('/api/johankarrd/drafts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sites: S.sites })
      });
      msg(res.ok ? 'Draft publicado.' : 'Draft guardado localmente.');
    } catch (_) {
      msg('Draft guardado localmente.');
    }
  }

  function render() {
    normalize();
    renderSites();
    renderSections();
    renderEditor();
    renderPreview();
  }

  function renderSites() {
    E.site.innerHTML = Object.keys(S.sites).map((key) => `<option value="${attr(key)}" ${key === S.site ? 'selected' : ''}>${esc(S.sites[key].name || key)}</option>`).join('');
  }

  function renderSections() {
    E.secs.innerHTML = site().sections.map((item) => `<button class="item ${item.id === S.sec ? 'active' : ''}" type="button" data-sec="${attr(item.id)}"><b>${esc(item.label || item.id)}</b><span>#${esc(item.id)}</span></button>`).join('');
  }

  function field(label, value, target, key, index = '', multiline = false) {
    if (multiline) {
      return `<label class="field"><span>${label}</span><textarea data-edit data-target="${target}" data-key="${key}" data-index="${index}">${esc(value || '')}</textarea></label>`;
    }
    return `<label class="field"><span>${label}</span><input value="${attr(value || '')}" data-edit data-target="${target}" data-key="${key}" data-index="${index}"></label>`;
  }

  function imageTools(item, index) {
    return `<div class="asset-row">
      <img class="thumb" src="${attr(item.src || '')}" alt="">
      <div class="image-tools">
        <button class="tiny" type="button" data-cycle="${index}">Cambiar</button>
        <label class="tiny upload-label">Upload<input type="file" accept="image/*" data-upload="${index}" hidden></label>
        <button class="tiny danger" type="button" data-rm="${index}">Borrar</button>
      </div>
    </div>`;
  }

  function renderEditor() {
    document.querySelectorAll('[data-mode]').forEach((btn) => btn.classList.toggle('active', btn.dataset.mode === S.mode));
    const current = site();
    const currentSection = section();
    let html = '';

    if (S.mode === 'style') {
      html += field('Site name', current.name, 'site', 'name');
      html += field('Slug', current.slug, 'site', 'slug');
      html += field('Background', current.bg, 'site', 'bg');
      html += field('Accent', current.accent, 'site', 'accent');
      html += field('Card', current.card, 'site', 'card');
    } else if (S.mode === 'assets') {
      html += `<div class="row-actions">
        <button class="mini-btn" type="button" data-act="title">+ Title</button>
        <button class="mini-btn" type="button" data-act="image">+ Image</button>
        <button class="mini-btn" type="button" data-act="logo">+ Logo</button>
        <button class="mini-btn" type="button" data-act="links">+ Links</button>
        <button class="mini-btn" type="button" data-act="gallery">+ Gallery</button>
      </div>`;
      html += `<div class="asset-grid">${LIBRARY.map((path) => `<button class="asset-card" type="button" data-asset="${attr(path)}"><img src="${attr(path)}" alt=""><span>${esc(path.split('/').pop())}</span></button>`).join('')}</div>`;
    } else {
      html += field('Section label', currentSection.label, 'sec', 'label');
      html += field('Hash ID', currentSection.id, 'sec', 'id');
      html += `<div class="row-actions"><button class="mini-btn" type="button" data-act="add-section">+ Section</button><button class="mini-btn danger" type="button" data-act="delete-section">Delete section</button></div>`;
      currentSection.items.forEach((item, index) => {
        html += `<div class="item-editor"><div class="item-head"><b>${esc(item.type)}</b><button class="tiny danger" type="button" data-rm="${index}">Remove</button></div>`;
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
    E.edit.querySelectorAll('[data-edit]').forEach((node) => node.addEventListener('input', onInput));
    E.edit.querySelectorAll('[data-upload]').forEach((node) => node.addEventListener('change', onUpload));
  }

  function onInput(event) {
    const el = event.target;
    const target = el.dataset.target;
    const key = el.dataset.key;
    const value = el.value;
    if (target === 'site') site()[key] = value;
    if (target === 'sec') {
      section()[key] = value;
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
    render();
  }

  function onUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const index = Number(event.target.dataset.upload);
    const reader = new FileReader();
    reader.onload = () => {
      const item = section().items[index];
      if (item) item.src = reader.result;
      msg('Imagen cargada localmente.');
      render();
    };
    reader.readAsDataURL(file);
  }

  function addItem(item) {
    section().items.push(item);
    render();
  }

  function addSection() {
    const n = site().sections.length + 1;
    const id = `section${n}`;
    site().sections.push({ id, label: `Section ${n}`, items: [{ type: 'title', text: 'NEW SECTION' }] });
    S.sec = id;
    render();
  }

  function deleteSection() {
    if (site().sections.length < 2) return msg('Debe quedar al menos una sección.');
    site().sections = site().sections.filter((item) => item.id !== S.sec);
    S.sec = site().sections[0].id;
    render();
  }

  function newSite() {
    const name = prompt('Nombre del nuevo Johankarrd');
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `site-${Date.now()}`;
    S.sites[slug] = clone(S.sites.cafe || window.JOHANKARRD_SEED.cafe);
    S.sites[slug].name = name;
    S.sites[slug].slug = slug;
    S.site = slug;
    S.sec = S.sites[slug].sections[0].id;
    render();
  }

  function cycleImage(index) {
    const item = section().items[index];
    if (!item || !('src' in item)) return;
    const current = LIBRARY.indexOf(item.src);
    item.src = LIBRARY[(current + 1 + LIBRARY.length) % LIBRARY.length];
    render();
  }

  function removeItem(index) {
    section().items.splice(index, 1);
    render();
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

  function style(current, prefix = 'jb-') {
    return `<style>.${prefix}site{width:100%;height:100%;position:relative;overflow:hidden;background:${current.bg};color:${current.accent};font-family:Arial,sans-serif}.${prefix}nav{position:absolute;top:22px;left:50%;transform:translateX(-50%);z-index:5;display:flex;gap:14px}.${prefix}nav button,.${prefix}nav a{border:0;background:transparent;color:${current.accent};font:900 10px Arial;text-decoration:underline;text-transform:uppercase}.${prefix}page{position:absolute;inset:0;display:grid;place-items:center;opacity:0;pointer-events:none;filter:blur(10px);transform:scale(.99);transition:.45s}.${prefix}page.active{opacity:1;pointer-events:auto;filter:blur(0);transform:none}.${prefix}card{width:min(86%,260px);max-height:84%;overflow:hidden;border-radius:20px;background:${current.card};padding:14px;display:grid;gap:9px;place-items:center;box-shadow:0 20px 38px #0008}.${prefix}card img{display:block;max-width:100%;height:auto}.logo{max-height:84px;object-fit:contain}.shot{border-radius:8px}.title{font:1000 34px/.85 Arial;text-align:center;text-transform:uppercase}.links{background:#feedb9;color:#061f3d;border-radius:12px;padding:12px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:100%}.links a{color:#061f3d;text-align:center;font:900 9px Arial;text-decoration:none}.gallery{display:grid;grid-template-columns:1fr 1fr;gap:7px}.gallery img{aspect-ratio:1/1;object-fit:cover;border-radius:6px}.cargrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cargrid a{display:grid;place-items:center}.${prefix}powered{position:absolute;bottom:10px;left:0;right:0;text-align:center;color:#ffffff5c;font:10px Arial}</style>`;
  }

  function renderPreview() {
    const current = site();
    const nav = current.sections.map((item) => `<button type="button" data-view="${attr(item.id)}">${esc(item.label)}</button>`).join('');
    const pages = current.sections.map((item) => `<section class="jb-page ${item.id === S.sec ? 'active' : ''}"><div class="jb-card">${item.items.map(itemHtml).join('')}</div></section>`).join('');
    E.prev.innerHTML = style(current) + `<div class="jb-site"><nav class="jb-nav">${nav}</nav>${pages}<div class="jb-powered">Powered by BOOSTR Labs</div></div>`;
    E.prev.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => { S.sec = button.dataset.view; render(); }));
    E.code.value = buildHtml(current);
  }

  function buildHtml(current = site()) {
    const css = style(current, '').replace(/<style>|<\/style>/g, '');
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

  document.addEventListener('click', (event) => {
    const mode = event.target.closest('[data-mode]');
    const secButton = event.target.closest('[data-sec]');
    const action = event.target.closest('[data-act],[data-action]');
    const asset = event.target.closest('[data-asset]');
    const rm = event.target.closest('[data-rm]');
    const cycle = event.target.closest('[data-cycle]');

    if (mode) { S.mode = mode.dataset.mode; render(); }
    if (secButton) { S.sec = secButton.dataset.sec; render(); }
    if (asset) { addItem({ type: 'image', src: asset.dataset.asset }); }
    if (rm) { removeItem(Number(rm.dataset.rm)); }
    if (cycle) { cycleImage(Number(cycle.dataset.cycle)); }
    if (!action) return;

    const x = action.dataset.act || action.dataset.action;
    if (x === 'new-site') newSite();
    if (x === 'save-draft') saveLocal(true);
    if (x === 'publish-draft') publishDraft();
    if (x === 'export-html') exportHtml();
    if (x === 'reset-local') { localStorage.removeItem(KEY); S.sites = clone(window.JOHANKARRD_SEED); S.site = 'cafe'; S.sec = 'home'; render(); msg('Reset listo.'); }
    if (x === 'reload-remote') msg('Remote draft no configurado todavía.');
    if (x === 'add-section') addSection();
    if (x === 'delete-section') deleteSection();
    if (x === 'title') addItem({ type: 'title', text: 'NEW SECTION' });
    if (x === 'image') addItem({ type: 'image', src: LIBRARY[3] });
    if (x === 'logo') addItem({ type: 'logo', src: LIBRARY[0] });
    if (x === 'links') addItem({ type: 'links', links: [['MAIL', 'mailto:'], ['INSTA', '#'], ['ORDER', '#'], ['TIKTOK', '#']] });
    if (x === 'gallery') addItem({ type: 'gallery', imgs: LIBRARY.slice(3, 7) });
  });

  E.site.addEventListener('change', () => { S.site = E.site.value; S.sec = site().sections[0].id; render(); });

  window.addEventListener('DOMContentLoaded', () => {
    try {
      S.sites = load();
      render();
      msg('Ready');
    } catch (error) {
      console.error(error);
      msg('Builder error: ' + error.message);
    }
  });
})();
