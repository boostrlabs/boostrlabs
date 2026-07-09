(() => {
  const KEY = 'johankarrd-buildr-v6';
  const protectedSlugs = new Set(['cafe', 'inventory', 'cafedelmar', 'solveinventory']);
  let previewDragIndex = null;
  let pendingDeleteTimer = null;

  const setStatus = (text) => {
    const el = document.querySelector('[data-status]');
    if (el) el.textContent = text;
  };
  const esc = (x = '') => String(x).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  const seed = () => JSON.parse(JSON.stringify(window.JOHANKARRD_SEED || {}));
  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null') || seed(); }
    catch (_) { return seed(); }
  };
  const write = (sites) => localStorage.setItem(KEY, JSON.stringify(sites || {}));
  const currentSlug = () => document.querySelector('[data-site-select]')?.value || '';
  const currentSectionId = () => document.querySelector('[data-sec].active')?.dataset.sec || document.querySelector('[data-sec]')?.dataset.sec || 'home';
  const currentName = () => {
    const sites = read();
    const slug = currentSlug();
    return sites?.[slug]?.name || slug;
  };

  function installPatchCss() {
    if (document.getElementById('johankarrd-v47-patch-css')) return;
    const style = document.createElement('style');
    style.id = 'johankarrd-v47-patch-css';
    style.textContent = `.delete-carrd-btn{border-color:rgba(255,106,125,.35)!important;color:#ffb7c0!important}.delete-warning{border:1px solid rgba(255,106,125,.3);background:rgba(255,106,125,.08);border-radius:18px;padding:13px;color:#ffd2d8;font-size:13px;line-height:1.35}.danger-title{color:#ffb7c0!important}.final-delete{background:linear-gradient(135deg,#ff6a7d,#feedb9)!important;color:#140406!important}.preview-object{cursor:grab}.preview-object:active{cursor:grabbing}.preview-object.preview-dragging{opacity:.42;transform:scale(.98)}.preview-object.drop-target{border-color:rgba(139,232,255,.9)!important;box-shadow:0 0 0 5px rgba(139,232,255,.10)!important}.delete-undo-toast{position:fixed;left:50%;bottom:22px;z-index:140;transform:translateX(-50%);display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid rgba(255,106,125,.32);border-radius:999px;background:rgba(6,9,14,.9);backdrop-filter:blur(18px);box-shadow:0 24px 70px rgba(0,0,0,.55);font:900 11px/1 Arial;color:#fff}.delete-undo-toast button{border:0;border-radius:999px;padding:9px 12px;background:linear-gradient(135deg,#fff5c7,#feedb9,#8be8ff);color:#061f3d;font:1000 10px/1 Arial;cursor:pointer}`;
    document.head.append(style);
  }

  function addDeleteButton() {
    const tools = document.querySelector('.site-tools');
    if (!tools || tools.querySelector('[data-delete-carrd]')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mini-btn delete-carrd-btn';
    btn.dataset.deleteCarrd = '1';
    btn.textContent = 'Delete Carrd';
    tools.append(btn);
  }

  function markPreviewDraggables() {
    document.querySelectorAll('[data-preview-item]').forEach((node) => {
      node.setAttribute('draggable', 'true');
      node.title = 'Drag to reorder';
    });
  }

  async function syncLivePages() {
    const sites = read();
    let changed = false;
    try {
      const res = await fetch('/api/johankarrd/list', { cache: 'no-store' });
      const data = res.ok ? await res.json() : { pages: [] };
      for (const page of (data.pages || [])) {
        if (!page || !page.slug || sites[page.slug]) continue;
        try {
          const live = await fetch('/api/johankarrd/live?slug=' + encodeURIComponent(page.slug), { cache: 'no-store' });
          const dataLive = live.ok ? await live.json() : null;
          if (dataLive && dataLive.payload && Array.isArray(dataLive.payload.sections)) {
            sites[page.slug] = dataLive.payload;
            sites[page.slug].slug = page.slug;
            sites[page.slug].name = dataLive.payload.name || page.name || page.slug;
            changed = true;
          }
        } catch (_) {}
      }
      if (changed) write(sites);
      return changed;
    } catch (_) { return false; }
  }

  function modal(html) {
    document.querySelector('.modal-backdrop')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop"><div class="modal-card">${html}</div></div>`);
    const box = document.querySelector('.modal-backdrop');
    box.addEventListener('click', (event) => {
      if (event.target === box || event.target.closest('[data-close-modal]')) box.remove();
    });
    return box;
  }

  function deleteStepOne(slug, name) {
    const box = modal(`<div class="modal-head"><img src="/assets/link/82ngel/logo.png" alt=""><div><small>DELETE</small><h2 class="danger-title">Borrar Johankarrd</h2></div></div><div class="delete-warning">Segura que quieres borrar esta Johankarrd?<br><br><b>${esc(name)}</b><br><span>#${esc(slug)}</span></div><div class="modal-actions"><button class="btn" data-close-modal>Cancel</button><button class="btn danger" data-delete-step-two>Continuar</button></div>`);
    box.querySelector('[data-delete-step-two]').onclick = () => deleteStepTwo(slug, name);
  }

  function deleteStepTwo(slug, name) {
    const box = modal(`<div class="modal-head"><div class="orb">!</div><div><small>FINAL CHECK</small><h2 class="danger-title">Borrado permanente</h2></div></div><div class="delete-warning"><b>SEGURA QUE QUIERES BORRARLA PERMANENTEMENTE?</b><br><br>Después de confirmar tendrás 5 segundos para deshacer.</div><div class="modal-actions"><button class="btn" data-close-modal>No</button><button class="btn final-delete" data-delete-final>Borrar</button></div>`);
    box.querySelector('[data-delete-final]').onclick = () => {
      box.remove();
      startDeleteWithUndo(slug, name);
    };
  }

  function startDeleteWithUndo(slug, name) {
    clearTimeout(pendingDeleteTimer);
    document.querySelector('.delete-undo-toast')?.remove();
    const before = read();
    const next = JSON.parse(JSON.stringify(before));
    delete next[slug];
    write(next);
    const toast = document.createElement('div');
    toast.className = 'delete-undo-toast';
    toast.innerHTML = `<span>${esc(name)} borrada.</span><button type="button">Undo</button>`;
    toast.querySelector('button').onclick = () => {
      clearTimeout(pendingDeleteTimer);
      write(before);
      toast.remove();
      setStatus('Delete cancelado.');
      location.href = '/johankarrdbuildr/?v=47';
    };
    document.body.append(toast);
    setStatus('Johankarrd removida. 5 segundos para Undo.');
    pendingDeleteTimer = setTimeout(async () => {
      toast.remove();
      try {
        const res = await fetch('/api/johankarrd/delete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ slug, confirmation: `BORRAR ${slug}` })
        });
        if (!res.ok) throw new Error('Delete failed');
        setStatus('Johankarrd borrada permanentemente.');
        location.href = '/johankarrdbuildr/?v=47';
      } catch (_) {
        write(before);
        setStatus('No se pudo borrar en cloud. Restaurada localmente.');
        location.href = '/johankarrdbuildr/?v=47';
      }
    }, 5000);
  }

  async function uploadBlob(blob, filename = 'asset.png') {
    const form = new FormData();
    form.append('file', blob, filename);
    const res = await fetch('/api/johankarrd/assets', { method: 'POST', body: form });
    if (!res.ok) throw new Error('asset upload failed');
    const data = await res.json();
    if (!data.url) throw new Error('asset url missing');
    return data.url;
  }

  async function remoteizeValue(value) {
    if (typeof value !== 'string' || !value.startsWith('data:image/')) return value;
    const blob = await fetch(value).then((r) => r.blob());
    const ext = (blob.type || 'image/png').split('/')[1] || 'png';
    return uploadBlob(blob, `johankarrd-upload.${ext}`);
  }

  async function remoteizeSiteAssets(site) {
    for (const section of (site.sections || [])) {
      for (const item of (section.items || [])) {
        if (item.src) item.src = await remoteizeValue(item.src);
        if (Array.isArray(item.imgs)) {
          for (let i = 0; i < item.imgs.length; i++) item.imgs[i] = await remoteizeValue(item.imgs[i]);
        }
        if (Array.isArray(item.tiles)) {
          for (const row of item.tiles) {
            if (row[1]) row[1] = await remoteizeValue(row[1]);
            if (row[2]) row[2] = await remoteizeValue(row[2]);
          }
        }
      }
    }
    return site;
  }

  async function publishCurrent() {
    const slug = currentSlug();
    const sites = read();
    const site = sites[slug];
    if (!slug || !site) return setStatus('No Johankarrd selected.');
    try {
      setStatus('Preparing images for live publish…');
      await remoteizeSiteAssets(site);
      sites[slug] = site;
      write(sites);
      await fetch('/api/johankarrd/drafts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sites })
      });
      const res = await fetch('/api/johankarrd/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, site, sites })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'publish failed');
      const link = `/johankarrd/${data.slug || slug}/`;
      setStatus(`Publicado live: ${link}`);
      modal(`<div class="modal-head"><img src="/assets/link/82ngel/logo.png" alt=""><div><small>LIVE</small><h2>Publicado</h2></div></div><p class="hint">La página está live con imágenes remotas.</p><div class="modal-actions"><button class="btn" data-close-modal>Close</button><a class="live-link" href="${esc(link)}" target="_blank" rel="noopener">Open live ↗</a></div>`);
    } catch (error) {
      setStatus(error.message || 'No se pudo publicar.');
    }
  }

  function movePreviewItem(from, to) {
    if (from === to || from === null || to === null) return;
    const sites = read();
    const slug = currentSlug();
    const sec = currentSectionId();
    const items = sites?.[slug]?.sections?.find((s) => s.id === sec)?.items;
    if (!Array.isArray(items) || !items[from] || !items[to]) return;
    const [item] = items.splice(from, 1);
    items.splice(to, 0, item);
    write(sites);
    setStatus('Element moved. Reloading preview…');
    location.href = '/johankarrdbuildr/?v=47';
  }

  document.addEventListener('click', (event) => {
    const asset = event.target.closest('[data-asset]');
    if (asset && !event.target.closest('.modal-card')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setStatus('Drag the asset into the phone preview. Click does not duplicate it.');
      return;
    }
    const publish = event.target.closest('[data-action="publish-draft"]');
    if (publish) {
      event.preventDefault();
      event.stopImmediatePropagation();
      publishCurrent();
      return;
    }
    const reset = event.target.closest('[data-action="reset-local"]');
    if (reset) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setStatus('Reloading cloud state without deleting published Carrds.');
      syncLivePages().then(() => { location.href = '/johankarrdbuildr/?v=47'; });
      return;
    }
    const del = event.target.closest('[data-delete-carrd]');
    if (del) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const slug = currentSlug();
      const name = currentName();
      if (!slug) return setStatus('No Johankarrd selected.');
      if (protectedSlugs.has(slug)) return setStatus('Esta Johankarrd base está protegida.');
      deleteStepOne(slug, name);
    }
  }, true);

  document.addEventListener('dragstart', (event) => {
    const previewItem = event.target.closest('[data-preview-item]');
    if (previewItem) {
      previewDragIndex = Number(previewItem.dataset.previewItem);
      previewItem.classList.add('preview-dragging');
      event.dataTransfer.setData('application/x-johankarrd-preview-index', String(previewDragIndex));
      event.dataTransfer.effectAllowed = 'move';
    }
  }, true);

  document.addEventListener('dragover', (event) => {
    if (previewDragIndex === null) return;
    const target = event.target.closest('[data-preview-item]');
    if (!target) return;
    event.preventDefault();
    target.classList.add('drop-target');
  }, true);

  document.addEventListener('dragleave', (event) => {
    event.target.closest('[data-preview-item]')?.classList.remove('drop-target');
  }, true);

  document.addEventListener('drop', (event) => {
    if (previewDragIndex === null) return;
    const target = event.target.closest('[data-preview-item]');
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const to = Number(target.dataset.previewItem);
    document.querySelectorAll('.drop-target,.preview-dragging').forEach((n) => n.classList.remove('drop-target', 'preview-dragging'));
    const from = previewDragIndex;
    previewDragIndex = null;
    movePreviewItem(from, to);
  }, true);

  document.addEventListener('dragend', () => {
    previewDragIndex = null;
    document.querySelectorAll('.drop-target,.preview-dragging').forEach((n) => n.classList.remove('drop-target', 'preview-dragging'));
  }, true);

  window.addEventListener('load', () => {
    installPatchCss();
    addDeleteButton();
    markPreviewDraggables();
    new MutationObserver(() => { addDeleteButton(); markPreviewDraggables(); }).observe(document.body, { childList: true, subtree: true });
    setTimeout(() => syncLivePages().then((changed) => {
      if (changed && !sessionStorage.getItem('johankarrd-synced-v47')) {
        sessionStorage.setItem('johankarrd-synced-v47', '1');
        location.href = '/johankarrdbuildr/?v=47';
      }
    }), 1000);
  });
})();
