(() => {
  if (window.__JOHANKA_CLOUD_LIVE__) return;
  if (!location.pathname.replace(/\/+$/, '').endsWith('/app/johanka/cloud')) return;
  window.__JOHANKA_CLOUD_LIVE__ = true;

  const INTERVAL_VISIBLE = 6000;
  const INTERVAL_HIDDEN = 20000;
  let timer = null;
  let syncing = false;
  let lastSignature = '';
  let lastUpdatedAt = null;

  const byId = (id) => document.getElementById(id);

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
        lastUpdatedAt = new Date();
        if (typeof renderGallery === 'function') renderGallery();
      }
      setBadge(changed ? 'Actualizado' : 'En vivo');
      setTimeout(() => setBadge('En vivo'), 1100);
    } catch (error) {
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

  function detectExistingAssets() {
    try {
      if (Array.isArray(assets)) lastSignature = signature(assets);
    } catch {}
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') silentRefresh(true);
    schedule();
  });
  window.addEventListener('focus', () => silentRefresh(true));
  window.addEventListener('online', () => silentRefresh(true));

  const uploadObserver = new MutationObserver(() => {
    const progressText = byId('progressText')?.textContent || '';
    const uploading = /Preparando|Subiendo|Reintentando/i.test(progressText);
    document.body.dataset.cloudUploading = String(uploading);
    if (/Listo|Subida:/i.test(progressText)) setTimeout(() => silentRefresh(true), 400);
  });
  const progress = byId('progress');
  if (progress) uploadObserver.observe(progress, { childList: true, subtree: true, characterData: true, attributes: true });

  setTimeout(() => {
    detectExistingAssets();
    ensureLiveBadge();
    silentRefresh(true);
    schedule();
  }, 1200);

  window.addEventListener('pagehide', () => {
    clearTimeout(timer);
    uploadObserver.disconnect();
  }, { once: true });
})();