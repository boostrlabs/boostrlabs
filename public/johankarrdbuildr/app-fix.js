(() => {
  const KEY = 'johankarrd-buildr-v6';
  const setStatus = (text) => {
    const el = document.querySelector('[data-status]');
    if (el) el.textContent = text;
  };
  const seed = () => JSON.parse(JSON.stringify(window.JOHANKARRD_SEED || {}));
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null') || seed();
    } catch (_) {
      return seed();
    }
  };
  const write = (sites) => localStorage.setItem(KEY, JSON.stringify(sites || {}));
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
    } catch (_) {
      return false;
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
      syncLivePages().then(() => { location.href = '/johankarrdbuildr/?v=45'; });
    }
  }, true);
  window.addEventListener('load', () => {
    setTimeout(() => syncLivePages().then((changed) => {
      if (changed && !sessionStorage.getItem('johankarrd-synced-v45')) {
        sessionStorage.setItem('johankarrd-synced-v45', '1');
        location.href = '/johankarrdbuildr/?v=45';
      }
    }), 1000);
  });
})();
