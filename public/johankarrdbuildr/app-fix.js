(() => {
  const KEY = 'johankarrd-buildr-v6';
  const protectedSlugs = new Set(['cafe', 'inventory', 'cafedelmar', 'solveinventory']);
  const setStatus = (text) => {
    const el = document.querySelector('[data-status]');
    if (el) el.textContent = text;
  };
  const seed = () => JSON.parse(JSON.stringify(window.JOHANKARRD_SEED || {}));
  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null') || seed(); }
    catch (_) { return seed(); }
  };
  const write = (sites) => localStorage.setItem(KEY, JSON.stringify(sites || {}));
  const currentSlug = () => document.querySelector('[data-site-select]')?.value || '';
  const currentName = () => {
    const sites = read();
    const slug = currentSlug();
    return sites?.[slug]?.name || slug;
  };

  function installPatchCss() {
    if (document.getElementById('johankarrd-delete-patch-css')) return;
    const style = document.createElement('style');
    style.id = 'johankarrd-delete-patch-css';
    style.textContent = `.delete-carrd-btn{border-color:rgba(255,106,125,.35)!important;color:#ffb7c0!important}.delete-carrd-btn:hover{border-color:rgba(255,106,125,.75)!important;box-shadow:0 12px 28px rgba(255,106,125,.12)!important}.delete-warning{border:1px solid rgba(255,106,125,.3);background:rgba(255,106,125,.08);border-radius:18px;padding:13px;color:#ffd2d8;font-size:13px;line-height:1.35}.confirm-code{font-weight:1000;color:#feedb9}.danger-title{color:#ffb7c0!important}.final-delete{background:linear-gradient(135deg,#ff6a7d,#feedb9)!important;color:#140406!important}`;
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
    const box = modal(`<div class="modal-head"><img src="/assets/link/82ngel/logo.png" alt=""><div><small>DELETE</small><h2 class="danger-title">Borrar Johankarrd</h2></div></div><div class="delete-warning">Segura que quieres borrar esta Johankarrd?<br><br><b>${name}</b><br><span>#${slug}</span></div><div class="modal-actions"><button class="btn" data-close-modal>Cancel</button><button class="btn danger" data-delete-step-two>Continuar</button></div>`);
    box.querySelector('[data-delete-step-two]').onclick = () => deleteStepTwo(slug, name);
  }

  function deleteStepTwo(slug, name) {
    const box = modal(`<div class="modal-head"><div class="orb">!</div><div><small>PERMANENT</small><h2 class="danger-title">Última advertencia</h2></div></div><div class="delete-warning"><b>SEGURA QUE QUIERES BORRARLA PERMANENTEMENTE?</b><br><br>Esto borra el draft local, el live page y la entrada del hub.</div><div class="modal-actions"><button class="btn" data-close-modal>No</button><button class="btn danger" data-delete-step-three>Sí, permanente</button></div>`);
    box.querySelector('[data-delete-step-three]').onclick = () => deleteStepThree(slug, name);
  }

  function deleteStepThree(slug, name) {
    const code = `BORRAR ${slug}`;
    const box = modal(`<div class="modal-head"><div class="orb">✕</div><div><small>CONFIRM</small><h2 class="danger-title">Confirmar borrado</h2></div></div><div class="delete-warning">Escribe exactamente:<br><br><span class="confirm-code">${code}</span></div><label class="field"><span>Confirmación</span><input data-delete-code placeholder="${code}"></label><div class="modal-actions"><button class="btn" data-close-modal>Cancel</button><button class="btn final-delete" data-delete-final>Borrar definitivo</button></div>`);
    const input = box.querySelector('[data-delete-code]');
    const final = box.querySelector('[data-delete-final]');
    final.onclick = async () => {
      if ((input.value || '').trim() !== code) {
        input.focus();
        setStatus('Confirmación incorrecta.');
        return;
      }
      final.disabled = true;
      final.textContent = 'Deleting…';
      await deleteCarrd(slug, input.value.trim());
    };
    input.focus();
  }

  async function deleteCarrd(slug, confirmation) {
    try {
      const res = await fetch('/api/johankarrd/delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, confirmation })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      const sites = read();
      delete sites[slug];
      write(sites);
      setStatus('Johankarrd borrada permanentemente.');
      location.href = '/johankarrdbuildr/?v=46';
    } catch (error) {
      setStatus(error.message || 'No se pudo borrar.');
    }
  }

  document.addEventListener('click', (event) => {
    const asset = event.target.closest('[data-asset]');
    if (asset && !event.target.closest('.modal-card')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setStatus('Drag the asset into the phone preview. Click does not duplicate it.');
      return;
    }
    const reset = event.target.closest('[data-action="reset-local"]');
    if (reset) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setStatus('Reloading cloud state without deleting published Carrds.');
      syncLivePages().then(() => { location.href = '/johankarrdbuildr/?v=46'; });
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

  window.addEventListener('load', () => {
    installPatchCss();
    addDeleteButton();
    new MutationObserver(addDeleteButton).observe(document.body, { childList: true, subtree: true });
    setTimeout(() => syncLivePages().then((changed) => {
      if (changed && !sessionStorage.getItem('johankarrd-synced-v46')) {
        sessionStorage.setItem('johankarrd-synced-v46', '1');
        location.href = '/johankarrdbuildr/?v=46';
      }
    }), 1000);
  });
})();
