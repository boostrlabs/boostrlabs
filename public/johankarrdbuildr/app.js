(() => {
  const STORAGE_KEY = 'johankarrd-buildr-v2';
  const LEGACY_KEY = 'johankarrd-buildr';
  const $ = (selector) => document.querySelector(selector);
  const els = {
    siteSelect: $('[data-site-select]'),
    sectionList: $('[data-section-list]'),
    editor: $('[data-editor]'),
    preview: $('[data-preview]'),
    code: $('[data-code]'),
    status: $('[data-status]')
  };

  const state = {
    sites: {},
    currentSite: 'cafe',
    currentSection: 'home',
    mode: 'content'
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function seed() {
    return clone(window.JOHANKARRD_SEED || {});
  }

  function isValidSites(value) {
    return value && typeof value === 'object' && value.cafe && value.inventory && Array.isArray(value.cafe.sections) && Array.isArray(value.inventory.sections);
  }

  function loadLocal() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (isValidSites(saved)) return saved;
    } catch (_) {}
    localStorage.removeItem(LEGACY_KEY);
    return seed();
  }

  async function loadRemote() {
    try {
      const res = await fetch('/api/johankarrd/drafts');
      if (!res.ok) throw new Error('remote unavailable');
      const json = await res.json();
      if (isValidSites(json.sites)) {
        state.sites = json.sites;
        saveLocal(false);
        normalizeSelection();
        render();
        setStatus('Loaded remote draft');
      }
    } catch (_) {
      setStatus('Local draft mode');
    }
  }

  function saveLocal(show = true) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.sites));
    if (show) setStatus('Draft saved locally');
  }

  async function publishDraft() {
    saveLocal(false);
    try {
      const res = await fetch('/api/johankarrd/drafts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sites: state.sites })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'backend unavailable');
      setStatus('Draft published to BOOSTR backend');
    } catch (error) {
      setStatus('Backend not ready; saved locally');
    }
  }

  function normalizeSelection() {
    const keys = Object.keys(state.sites);
    if (!keys.length) state.sites = seed();
    if (!state.sites[state.currentSite]) state.currentSite = Object.keys(state.sites)[0];
    const current = site();
    if (!current.sections || !current.sections.length) current.sections = [{ id: 'home', label: 'Home', items: [] }];
    if (!section()) state.currentSection = current.sections[0].id;
  }

  function site() {
    return state.sites[state.currentSite];
  }

  function section() {
    const current = site();
    return current.sections.find((item) => item.id === state.currentSection);
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
  }

  function attr(value) {
    return esc(value).replace(/"/g, '&quot;');
  }

  function bindActions() {
    document.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      const mode = event.target.closest('[data-mode]')?.dataset.mode;
      const siteKey = event.target.closest('[data-site-key]')?.dataset.siteKey;
      const sectionId = event.target.closest('[data-section-id]')?.dataset.sectionId;
      if (mode) {
        state.mode = mode;
        renderEditor();
      }
      if (siteKey) {
        state.currentSite = siteKey;
        state.currentSection = site().sections[0].id;
        render();
      }
      if (sectionId) {
        state.currentSection = sectionId;
        render();
      }
      if (!action) return;
      if (action === 'new-site') newSite();
      if (action === 'save-draft') saveLocal(true);
      if (action === 'publish-draft') publishDraft();
      if (action === 'export-html') downloadHtml();
      if (action === 'reset-local') resetLocal();
      if (action === 'reload-remote') loadRemote();
      if (action === 'add-section') addSection();
      if (action === 'add-title') addItem({ type: 'title', text: 'NEW SECTION' });
      if (action === 'add-image') addItem({ type: 'image', src: '/assets/johankarrd/cafedelmar/image04.jpg' });
      if (action === 'add-logo') addItem({ type: 'logo', src: '/assets/johankarrd/cafedelmar/logofull.png' });
    });

    els.siteSelect.addEventListener('change', () => {
      state.currentSite = els.siteSelect.value;
      state.currentSection = site().sections[0].id;
      render();
    });
  }

  function render() {
    normalizeSelection();
    renderSites();
    renderSections();
    renderEditor();
    renderPreview();
  }

  function renderSites() {
    els.siteSelect.innerHTML = Object.keys(state.sites)
      .map((key) => `<option value="${attr(key)}" ${key === state.currentSite ? 'selected' : ''}>${esc(state.sites[key].name || key)}</option>`)
      .join('');
  }

  function renderSections() {
    els.sectionList.innerHTML = site().sections
      .map((item) => `<div class="item ${item.id === state.currentSection ? 'active' : ''}" data-section-id="${attr(item.id)}"><b>${esc(item.label || item.id)}</b><span>#${esc(item.id)}</span></div>`)
      .join('');
  }

  function field(label, value, key, options = {}) {
    const target = options.target || 'site';
    const index = options.index ?? '';
    const multiline = options.multiline;
    const valueText = attr(value || '');
    if (multiline) {
      return `<label class="field"><span>${label}</span><textarea data-edit-target="${target}" data-edit-key="${key}" data-edit-index="${index}">${esc(value || '')}</textarea></label>`;
    }
    return `<label class="field"><span>${label}</span><input value="${valueText}" data-edit-target="${target}" data-edit-key="${key}" data-edit-index="${index}"></label>`;
  }

  function renderEditor() {
    document.querySelectorAll('[data-mode]').forEach((btn) => btn.classList.toggle('active', btn.dataset.mode === state.mode));
    const currentSite = site();
    const currentSection = section();
    let html = '';

    if (state.mode === 'style') {
      html += field('Site Name', currentSite.name, 'name', { target: 'site' });
      html += field('Slug', currentSite.slug, 'slug', { target: 'site' });
      html += field('Background', currentSite.bg, 'bg', { target: 'site' });
      html += field('Accent', currentSite.accent, 'accent', { target: 'site' });
      html += field('Card', currentSite.card, 'card', { target: 'site' });
    } else if (state.mode === 'assets') {
      html += `<div class="row-actions"><button class="mini-btn" data-action="add-title">+ Title</button><button class="mini-btn" data-action="add-image">+ Image</button><button class="mini-btn" data-action="add-logo">+ Logo</button></div>`;
      html += `<p class="hint">Use repo asset paths like /assets/johankarrd/cafedelmar/image04.jpg or /assets/johankarrd/solveinventory/typer.png.</p>`;
    } else {
      html += field('Section Label', currentSection.label, 'label', { target: 'section' });
      html += field('Hash ID', currentSection.id, 'id', { target: 'section' });
      currentSection.items.forEach((item, index) => {
        html += `<div class="item"><b>${esc(item.type)}</b>`;
        if ('src' in item) {
          html += `<div class="asset-row"><img class="thumb" src="${attr(item.src)}" alt=""><input value="${attr(item.src)}" data-edit-target="item" data-edit-key="src" data-edit-index="${index}"></div>`;
        }
        if ('text' in item) html += field('Text', item.text, 'text', { target: 'item', index });
        if ('link' in item) html += field('Link', item.link, 'link', { target: 'item', index });
        if ('links' in item) html += field('Links label|url', item.links.map((row) => row.join('|')).join('\n'), 'links', { target: 'item', index, multiline: true });
        if ('imgs' in item) html += field('Gallery images', item.imgs.join('\n'), 'imgs', { target: 'item', index, multiline: true });
        html += '</div>';
      });
    }

    els.editor.innerHTML = html;
    els.editor.querySelectorAll('[data-edit-target]').forEach((input) => input.addEventListener('input', handleEdit));
  }

  function handleEdit(event) {
    const input = event.target;
    const target = input.dataset.editTarget;
    const key = input.dataset.editKey;
    const value = input.value;
    if (target === 'site') site()[key] = value;
    if (target === 'section') {
      if (key === 'id') state.currentSection = value;
      section()[key] = value;
    }
    if (target === 'item') {
      const item = section().items[Number(input.dataset.editIndex)];
      if (key === 'links') item.links = value.split('\n').filter(Boolean).map((row) => row.split('|'));
      else if (key === 'imgs') item.imgs = value.split('\n').filter(Boolean);
      else item[key] = value;
    }
    renderSites();
    renderSections();
    renderPreview();
  }

  function addSection() {
    const id = `section${site().sections.length + 1}`;
    site().sections.push({ id, label: `Section ${site().sections.length + 1}`, items: [{ type: 'title', text: 'NEW SECTION' }] });
    state.currentSection = id;
    render();
  }

  function addItem(item) {
    section().items.push(item);
    render();
  }

  function newSite() {
    const name = prompt('New Johankarrd name?');
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `site-${Date.now()}`;
    state.sites[slug] = clone(window.JOHANKARRD_SEED.cafe);
    state.sites[slug].name = name;
    state.sites[slug].slug = slug;
    state.currentSite = slug;
    state.currentSection = 'home';
    render();
  }

  function resetLocal() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
    state.sites = seed();
    state.currentSite = 'cafe';
    state.currentSection = 'home';
    render();
    setStatus('Local state reset');
  }

  function itemHtml(item) {
    if (item.type === 'title') return `<div class="title">${esc(item.text)}</div>`;
    if (item.type === 'logo') return `<img class="logo" src="${attr(item.src)}" alt="">`;
    if (item.type === 'image') {
      const image = `<img class="shot" src="${attr(item.src)}" alt="">`;
      return item.link ? `<a href="${attr(item.link)}">${image}</a>` : image;
    }
    if (item.type === 'links') return `<div class="links">${(item.links || []).map((row) => `<a href="${attr(row[1] || '#')}">${esc(row[0] || 'LINK')}</a>`).join('')}</div>`;
    if (item.type === 'gallery') return `<div class="gallery">${(item.imgs || []).map((src) => `<img src="${attr(src)}" alt="">`).join('')}</div>`;
    if (item.type === 'grid') return `<div class="cargrid">${(item.tiles || []).map((tile) => `<a href="${attr(tile[3] || '#')}"><img src="${attr(tile[1])}" alt=""><img src="${attr(tile[2])}" alt=""></a>`).join('')}</div>`;
    return '';
  }

  function buildHtml(current = site()) {
    const nav = current.sections.map((item) => `<a href="#${attr(item.id)}">${esc(item.label)}</a>`).join('');
    const sections = current.sections.map((item) => `<section class="page" id="${attr(item.id)}"><div class="card">${item.items.map(itemHtml).join('')}</div></section>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(current.name)}</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}body{background:${current.bg};color:${current.accent};font-family:Arial,sans-serif}.nav{position:fixed;top:28px;left:50%;transform:translateX(-50%);z-index:9;display:flex;gap:18px}.nav a{color:${current.accent};font:bold 10px Arial;text-transform:uppercase}.page{position:fixed;inset:0;display:grid;place-items:center;opacity:0;pointer-events:none;filter:blur(10px);transform:scale(.99);transition:1.5s}.page.active{opacity:1;pointer-events:auto;filter:blur(0);transform:none}.card{width:min(88vw,260px);max-height:86vh;overflow:hidden;border-radius:20px;background:${current.card};padding:14px;display:grid;gap:9px;place-items:center;box-shadow:0 20px 38px rgba(0,0,0,.42)}img{display:block;max-width:100%;height:auto}.logo{max-height:84px;object-fit:contain}.shot{border-radius:8px}.title{font:1000 34px/.85 Arial;text-align:center;text-transform:uppercase}.links{background:#feedb9;color:#061f3d;border-radius:12px;padding:12px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.links a{color:#061f3d;text-align:center;font:900 10px Arial;text-decoration:none}.gallery{display:grid;grid-template-columns:1fr 1fr;gap:7px}.gallery img{aspect-ratio:1/1;object-fit:cover;border-radius:6px}.cargrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cargrid a{display:grid;place-items:center}.powered{position:fixed;bottom:10px;left:0;right:0;text-align:center;color:rgba(255,255,255,.36);font:10px Arial}</style></head><body><nav class="nav">${nav}</nav>${sections}<div class="powered">Powered by BOOSTR Labs</div><script>const ids=${JSON.stringify(current.sections.map((item) => item.id))};function show(){let id=location.hash.slice(1)||ids[0];if(!ids.includes(id))id=ids[0];document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));}addEventListener('hashchange',show);show();<\/script></body></html>`;
  }

  function renderPreview() {
    const html = buildHtml();
    els.preview.srcdoc = html;
    els.code.value = html;
  }

  function downloadHtml() {
    const html = buildHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${site().slug || state.currentSite}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function boot() {
    if (!window.JOHANKARRD_SEED) {
      setStatus('Seed data missing');
      return;
    }
    state.sites = loadLocal();
    normalizeSelection();
    bindActions();
    render();
    setStatus('Ready');
    loadRemote();
  }

  window.addEventListener('DOMContentLoaded', boot);
})();
