(() => {
  if (window.__JOHANKA_CLOUD_LIVE__) return;
  if (!location.pathname.replace(/\/+$/, '').endsWith('/app/johanka/cloud')) return;
  window.__JOHANKA_CLOUD_LIVE__ = true;

  const INTERVAL_VISIBLE = 6000;
  const INTERVAL_HIDDEN = 20000;
  const MAX_ASSET_REQUESTS = 3;
  let timer = null;
  let syncing = false;
  let lastSignature = '';
  let activeAssetRequests = 0;
  const assetQueue = [];
  const nativeFetch = window.fetch.bind(window);

  const byId = (id) => document.getElementById(id);

  function assetRequestUrl(input) {
    const value = typeof input === 'string' ? input : input?.url;
    if (!value) return null;
    try {
      const url = new URL(value, location.origin);
      if (url.origin !== location.origin || url.pathname !== '/api/cloud' || !url.searchParams.get('key')) return null;
      url.pathname = '/api/cloud-asset';
      return url.href;
    } catch {
      return null;
    }
  }

  function pumpAssetQueue() {
    while (activeAssetRequests < MAX_ASSET_REQUESTS && assetQueue.length) {
      const job = assetQueue.shift();
      activeAssetRequests += 1;
      nativeFetch(job.url, job.init)
        .then(job.resolve, job.reject)
        .finally(() => {
          activeAssetRequests -= 1;
          pumpAssetQueue();
        });
    }
  }

  window.fetch = function boostrCloudFetch(input, init) {
    const rewritten = assetRequestUrl(input);
    if (!rewritten) return nativeFetch(input, init);
    return new Promise((resolve, reject) => {
      assetQueue.push({ url: rewritten, init, resolve, reject });
      pumpAssetQueue();
    });
  };

  function signature(list = []) {
    return list.map((item) => `${item.id}:${item.updated_at || item.created_at || ''}`).join('|');
  }

  function ensureLiveBadge() {
    let badge = byId('johankaCloudLiveBadge');
    if (badge) return badge;
    badge = document.createElement('span');
    badge.id = 'johankaCloudLiveBadge';
    badge.setAttribute('aria-live', 'polite');
    badge.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-left:8px;padding:5px 8px;border:1px solid rgba(143,232,238,.24);border-radius:999px;color:#8fe8ee;font:900 9px ui-monospace,Menlo,monospace;letter-spacing:.09em;text-transform:uppercase;background:rgba(143,232,238,.06)';
    badge.innerHTML = '<i style="width:7px;height:7px;border-radius:50%;background:#8fe8ee;box-shadow:0 0 12px rgba(143,232,238,.9)"></i><span>En vivo</span>';
    byId('countText')?.insertAdjacentElement('afterend', badge);
    return badge;
  }

  function setBadge(text, state = 'live') {
    const badge = ensureLiveBadge();
    if (!badge) return;
    const dot = badge.querySelector('i');
    const label = badge.querySelector('span');
    if (label) label.textContent = text;
    if (dot) {
      dot.style.background = state === 'error' ? '#ff9d94' : state === 'sync' ? '#f4ead2' : '#8fe8ee';
      dot.style.boxShadow = state === 'error' ? '0 0 10px rgba(255,157,148,.75)' : state === 'sync' ? '0 0 10px rgba(244,234,210,.7)' : '0 0 12px rgba(143,232,238,.9)';
    }
  }

  async function silentRefresh(force = false) {
    if (syncing || document.body.dataset.cloudUploading === 'true') return;
    if (typeof selectedWorkspace !== 'function' || typeof api !== 'function') return;
    const workspaceId = selectedWorkspace();
    if (!workspaceId) return;

    syncing = true;
    setBadge('Sincronizando', 'sync');
    try {
      const data = await api(`/api/cloud?workspace_id=${encodeURIComponent(workspaceId)}`);
      const nextAssets = data.assets || [];
      const nextSignature = signature(nextAssets);
      const changed = force || nextSignature !== lastSignature;
      if (changed) {
        assets = nextAssets;
        lastSignature = nextSignature;
        if (typeof renderGallery === 'function') renderGallery();
      }
      setBadge(changed ? 'Actualizado' : 'En vivo');
      setTimeout(() => setBadge('En vivo'), 1100);
    } catch {
      setBadge('Sin conexión', 'error');
    } finally {
      syncing = false;
    }
  }

  function schedule() {
    clearTimeout(timer);
    const delay = document.visibilityState === 'visible' ? INTERVAL_VISIBLE : INTERVAL_HIDDEN;
    timer = setTimeout(async () => {
      await silentRefresh(false);
      schedule();
    }, delay);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') silentRefresh(true);
    schedule();
  });
  window.addEventListener('focus', () => silentRefresh(true));
  window.addEventListener('online', () => silentRefresh(true));

  const progress = byId('progress');
  const uploadObserver = new MutationObserver(() => {
    const progressText = byId('progressText')?.textContent || '';
    const uploading = /Preparando|Subiendo|Reintentando/i.test(progressText);
    document.body.dataset.cloudUploading = String(uploading);
    if (/Listo|Subida:/i.test(progressText)) setTimeout(() => silentRefresh(true), 400);
  });
  if (progress) uploadObserver.observe(progress, { childList: true, subtree: true, characterData: true, attributes: true });

  setTimeout(() => {
    try { if (Array.isArray(assets)) lastSignature = signature(assets); } catch {}
    ensureLiveBadge();
    silentRefresh(true);
    schedule();
  }, 1200);

  window.addEventListener('pagehide', () => {
    clearTimeout(timer);
    uploadObserver.disconnect();
  }, { once: true });
})();
