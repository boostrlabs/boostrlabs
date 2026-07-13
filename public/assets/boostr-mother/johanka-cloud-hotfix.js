(() => {
  if (window.__JOHANKA_CLOUD_RUNTIME__) return;
  if (!location.pathname.replace(/\/+$/, '').endsWith('/app/johanka/cloud')) return;
  window.__JOHANKA_CLOUD_RUNTIME__ = true;

  const byId = (id) => document.getElementById(id);
  const blobUrls = new Map();
  const fileInputEl = byId('fileInput');
  const chooseBtnEl = byId('chooseBtn');
  const dropZoneEl = byId('dropZone');
  const progressEl = byId('progress');
  const progressTextEl = byId('progressText');
  const progressFillEl = byId('progressFill');
  const categorySelectEl = byId('categorySelect');
  const galleryEl = byId('gallery');
  const countTextEl = byId('countText');
  const viewerImageEl = byId('viewerImage');
  const viewerTitleEl = byId('viewerTitle');
  const viewerMetaEl = byId('viewerMeta');
  const modalEl = byId('modal');
  const refreshBtnEl = byId('refreshBtn');
  let selectedFiles = [];

  const authHeaders = () => {
    const token = localStorage.getItem('boostr_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  function detail(error, fallback) {
    return [error?.message || error?.error || fallback, error?.stage ? `etapa: ${error.stage}` : '', error?.detail || '']
      .filter(Boolean)
      .join(' · ');
  }

  function ensureSelectionStatus() {
    let node = byId('cloudSelectionStatus');
    if (node) return node;
    node = document.createElement('div');
    node.id = 'cloudSelectionStatus';
    node.setAttribute('aria-live', 'polite');
    node.style.cssText = 'margin-top:10px;color:rgba(247,242,229,.72);font-size:12px;font-weight:800;line-height:1.4';
    dropZoneEl?.insertAdjacentElement('afterend', node);
    return node;
  }

  function renderSelection() {
    const node = ensureSelectionStatus();
    if (!node) return;
    if (!selectedFiles.length) {
      node.textContent = 'Ninguna imagen seleccionada.';
      return;
    }
    const names = selectedFiles.slice(0, 3).map((file) => file.name).join(', ');
    node.textContent = selectedFiles.length === 1
      ? `Lista para subir: ${names}`
      : `${selectedFiles.length} imágenes listas: ${names}${selectedFiles.length > 3 ? '…' : ''}`;
  }

  async function privateBlobUrl(url) {
    if (!url) throw new Error('El asset no tiene archivo asociado.');
    if (blobUrls.has(url)) return blobUrls.get(url);
    const response = await fetch(url, { headers: authHeaders(), credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(detail(error, `No se pudo abrir la imagen (${response.status})`));
    }
    const objectUrl = URL.createObjectURL(await response.blob());
    blobUrls.set(url, objectUrl);
    return objectUrl;
  }

  async function hydrateImage(image, url) {
    if (!image || !url || image.dataset.privateHydrating === 'true') return;
    image.dataset.privateHydrating = 'true';
    try {
      image.src = await privateBlobUrl(url);
      image.dataset.privateReady = 'true';
      image.removeAttribute('data-private-src');
    } catch (error) {
      image.removeAttribute('src');
      image.alt = detail(error, 'No se pudo abrir');
      image.closest('figure')?.classList.add('asset-load-error');
    } finally {
      delete image.dataset.privateHydrating;
    }
  }

  function hydrateImages(root = document) {
    root.querySelectorAll?.('#gallery img').forEach((image) => {
      const source = image.dataset.privateSrc || (image.getAttribute('src')?.startsWith('/api/cloud?key=') ? image.getAttribute('src') : '');
      if (source && image.dataset.privateReady !== 'true') hydrateImage(image, source);
    });
  }

  renderGallery = function renderGalleryStable() {
    const list = filteredAssets();
    countTextEl.textContent = `${assets.length} ${assets.length === 1 ? 'imagen' : 'imágenes'}`;
    galleryEl.innerHTML = list.length
      ? list.map((asset) => `<button class="asset" data-id="${asset.id}"><figure><img loading="lazy" data-private-src="${asset.file_url}" alt="${String(asset.title || 'Asset').replace(/"/g, '&quot;')}"></figure><div class="asset-meta"><b>${asset.title || 'Asset'}</b><span>${asset.metadata?.category || 'inbox'} · ${dateLabel(asset.created_at)}</span></div></button>`).join('')
      : '<div class="empty">No hay imágenes en esta vista. Toca “Subir imágenes” y manda la primera.</div>';
    galleryEl.querySelectorAll('.asset').forEach((button) => { button.onclick = () => openAsset(button.dataset.id); });
    hydrateImages(galleryEl);
  };

  loadAssets = async function loadAssetsStable() {
    galleryEl.innerHTML = '<div class="empty">Cargando tu piscina...</div>';
    try {
      const workspaceId = selectedWorkspace();
      if (!workspaceId) throw new Error('Selecciona un workspace antes de abrir la nube.');
      const data = await api(`/api/cloud?workspace_id=${encodeURIComponent(workspaceId)}`);
      assets = data.assets || [];
      renderGallery();
    } catch (error) {
      galleryEl.innerHTML = `<div class="empty"><b>No se pudo abrir la nube.</b><br><span>${detail(error, 'Error desconocido')}</span><br><button class="btn" id="cloudRetry" style="margin-top:12px">Intentar otra vez</button></div>`;
      byId('cloudRetry')?.addEventListener('click', loadAssets);
    }
  };

  openAsset = async function openAssetStable(id) {
    current = assets.find((asset) => asset.id === id);
    if (!current) return;
    viewerTitleEl.textContent = current.title || 'Asset';
    viewerMetaEl.textContent = 'Abriendo imagen privada...';
    viewerImageEl.removeAttribute('src');
    modalEl.classList.add('open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    try {
      viewerImageEl.src = await privateBlobUrl(current.file_url);
      viewerMetaEl.textContent = `${current.metadata?.category || 'inbox'} · ${formatBytes(current.metadata?.bytes)} · ${dateLabel(current.created_at)}`;
    } catch (error) {
      viewerMetaEl.textContent = detail(error, 'No se pudo abrir esta imagen.');
    }
  };

  async function imageViaElement(file) {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.decoding = 'async';
      image.src = url;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('El teléfono no pudo leer esta imagen.'));
      });
      return image;
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  compressImage = async function compressImageStable(file) {
    if (file.type === 'image/gif') return { file, width: null, height: null, original: file.size };
    let source;
    let width;
    let height;
    try {
      if ('createImageBitmap' in window) {
        source = await createImageBitmap(file);
        width = source.width;
        height = source.height;
      } else {
        source = await imageViaElement(file);
        width = source.naturalWidth;
        height = source.naturalHeight;
      }
    } catch {
      source = await imageViaElement(file);
      width = source.naturalWidth;
      height = source.naturalHeight;
    }
    const max = 2000;
    const scale = Math.min(1, max / Math.max(width, height));
    const nextWidth = Math.max(1, Math.round(width * scale));
    const nextHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = nextWidth;
    canvas.height = nextHeight;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('El navegador no pudo preparar la imagen.');
    context.drawImage(source, 0, 0, nextWidth, nextHeight);
    source.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84));
    if (!blob) throw new Error('No se pudo comprimir la imagen.');
    const base = file.name.replace(/\.[^.]+$/, '') || 'imagen';
    return {
      file: blob,
      filename: `${base}.webp`,
      width: nextWidth,
      height: nextHeight,
      original: file.size
    };
  };

  function buildForm(upload, original, packed) {
    const form = new FormData();
    const filename = upload.name || packed?.filename || original.name || 'imagen.webp';
    form.append('file', upload, filename);
    form.append('workspace_id', selectedWorkspace());
    form.append('category', categorySelectEl?.value || 'inbox');
    form.append('title', original.name.replace(/\.[^.]+$/, '') || 'Imagen');
    form.append('source', 'johanka_custom_cloud');
    form.append('original_bytes', String(packed?.original || original.size));
    if (packed?.width) form.append('width', String(packed.width));
    if (packed?.height) form.append('height', String(packed.height));
    return form;
  }

  async function sendUpload(upload, original, packed) {
    const response = await fetch('/api/cloud', {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'same-origin',
      body: buildForm(upload, original, packed)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw { ...data, status: response.status };
    return data;
  }

  uploadFiles = async function uploadFilesStable(fileList) {
    const files = [...(fileList || [])].filter((file) => file && file.type?.startsWith('image/'));
    if (!files.length) { say('Elige una imagen primero'); return; }
    if (!selectedWorkspace()) { say('Selecciona un workspace'); return; }

    selectedFiles = files;
    renderSelection();
    progressEl.classList.add('show');
    chooseBtnEl.disabled = true;
    let failures = 0;

    for (let index = 0; index < files.length; index += 1) {
      const original = files[index];
      progressTextEl.textContent = `Preparando ${index + 1} de ${files.length}: ${original.name}`;
      progressFillEl.style.width = `${Math.round((index / files.length) * 100)}%`;
      try {
        const packed = await compressImage(original);
        try {
          await sendUpload(packed.file, original, packed);
        } catch (error) {
          if (error?.error !== 'file_required' && error?.status !== 400) throw error;
          progressTextEl.textContent = `Reintentando ${original.name} sin compresión...`;
          await sendUpload(original, original, { original: original.size });
        }
        progressTextEl.textContent = `Subida: ${original.name} · ${formatBytes(packed.file.size)}`;
      } catch (error) {
        failures += 1;
        progressTextEl.textContent = detail(error, `Falló ${original.name}`);
        say(detail(error, `Falló ${original.name}`));
      }
    }

    progressFillEl.style.width = '100%';
    progressTextEl.textContent = failures
      ? `${files.length - failures} subidas · ${failures} con error. ${progressTextEl.textContent}`
      : 'Listo. Ya aparece en tu nube.';
    chooseBtnEl.disabled = false;
    selectedFiles = [];
    if (fileInputEl) fileInputEl.value = '';
    renderSelection();
    await loadAssets();
    if (!failures) setTimeout(() => progressEl.classList.remove('show'), 1800);
  };

  chooseBtnEl.onclick = () => fileInputEl?.click();
  refreshBtnEl.onclick = loadAssets;
  fileInputEl.onchange = (event) => {
    selectedFiles = [...(event.target.files || [])];
    renderSelection();
    uploadFiles(selectedFiles);
  };
  dropZoneEl.ondragover = (event) => { event.preventDefault(); dropZoneEl.classList.add('drag'); };
  dropZoneEl.ondragleave = () => dropZoneEl.classList.remove('drag');
  dropZoneEl.ondrop = (event) => {
    event.preventDefault();
    dropZoneEl.classList.remove('drag');
    selectedFiles = [...(event.dataTransfer.files || [])];
    renderSelection();
    uploadFiles(selectedFiles);
  };

  renderSelection();

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) hydrateImages(node);
      });
    }
  });
  observer.observe(galleryEl || document.body, { childList: true, subtree: true });

  const style = document.createElement('style');
  style.textContent = '.asset-load-error{display:grid;place-items:center;color:rgba(255,255,255,.55);font-size:11px;padding:12px}.asset-load-error:after{content:"No se pudo cargar"}';
  document.head.appendChild(style);

  const bootstrap = () => loadSession().then(loadAssets).catch((error) => {
    galleryEl.innerHTML = `<div class="empty"><b>No se pudo abrir la nube.</b><br><span>${detail(error, 'Error desconocido')}</span></div>`;
  });
  if (window.__JOHANKA_CLOUD_BOOTSTRAP_DEFERRED__) bootstrap();
  else setTimeout(() => {
    if (/Conectando|Cargando/i.test(galleryEl?.textContent || '')) bootstrap();
  }, 3500);

  addEventListener('pagehide', () => {
    observer.disconnect();
    blobUrls.forEach((url) => URL.revokeObjectURL(url));
    blobUrls.clear();
  }, { once: true });
})();