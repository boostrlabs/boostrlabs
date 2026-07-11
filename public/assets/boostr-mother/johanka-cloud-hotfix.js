(() => {
  if (window.__JOHANKA_CLOUD_RUNTIME__) return;
  if (!location.pathname.replace(/\/+$/, '').endsWith('/app/johanka/cloud')) return;
  window.__JOHANKA_CLOUD_RUNTIME__ = true;

  const blobUrls = new Map();
  const authHeaders = () => {
    const token = localStorage.getItem('boostr_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  function detail(error, fallback) {
    return [error?.message || error?.error || fallback, error?.stage ? `etapa: ${error.stage}` : '', error?.detail || '']
      .filter(Boolean)
      .join(' · ');
  }

  async function privateBlobUrl(url) {
    if (!url) throw new Error('El asset no tiene archivo asociado.');
    if (blobUrls.has(url)) return blobUrls.get(url);
    const response = await fetch(url, {
      headers: authHeaders(),
      credentials: 'same-origin',
      cache: 'no-store'
    });
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
    countText.textContent = `${assets.length} ${assets.length === 1 ? 'imagen' : 'imágenes'}`;
    gallery.innerHTML = list.length
      ? list.map((asset) => `<button class="asset" data-id="${asset.id}"><figure><img loading="lazy" data-private-src="${asset.file_url}" alt="${String(asset.title || 'Asset').replace(/"/g, '&quot;')}"></figure><div class="asset-meta"><b>${asset.title || 'Asset'}</b><span>${asset.metadata?.category || 'inbox'} · ${dateLabel(asset.created_at)}</span></div></button>`).join('')
      : '<div class="empty">No hay imágenes en esta vista. Toca “Subir imágenes” y manda la primera.</div>';
    gallery.querySelectorAll('.asset').forEach((button) => { button.onclick = () => openAsset(button.dataset.id); });
    hydrateImages(gallery);
  };

  loadAssets = async function loadAssetsStable() {
    gallery.innerHTML = '<div class="empty">Cargando tu piscina...</div>';
    try {
      const workspaceId = selectedWorkspace();
      if (!workspaceId) throw new Error('Selecciona un workspace antes de abrir la nube.');
      const data = await api(`/api/cloud?workspace_id=${encodeURIComponent(workspaceId)}`);
      assets = data.assets || [];
      renderGallery();
    } catch (error) {
      gallery.innerHTML = `<div class="empty"><b>No se pudo abrir la nube.</b><br><span>${detail(error, 'Error desconocido')}</span><br><button class="btn" id="cloudRetry" style="margin-top:12px">Intentar otra vez</button></div>`;
      document.getElementById('cloudRetry')?.addEventListener('click', loadAssets);
    }
  };

  openAsset = async function openAssetStable(id) {
    current = assets.find((asset) => asset.id === id);
    if (!current) return;
    viewerTitle.textContent = current.title || 'Asset';
    viewerMeta.textContent = 'Abriendo imagen privada...';
    viewerImage.removeAttribute('src');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    try {
      viewerImage.src = await privateBlobUrl(current.file_url);
      viewerMeta.textContent = `${current.metadata?.category || 'inbox'} · ${formatBytes(current.metadata?.bytes)} · ${dateLabel(current.created_at)}`;
    } catch (error) {
      viewerMeta.textContent = detail(error, 'No se pudo abrir esta imagen.');
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
    const base = file.name.replace(/\.[^.]+$/, '');
    return {
      file: new File([blob], `${base}.webp`, { type: 'image/webp' }),
      width: nextWidth,
      height: nextHeight,
      original: file.size
    };
  };

  uploadFiles = async function uploadFilesStable(fileList) {
    const files = [...fileList].filter((file) => file.type.startsWith('image/'));
    if (!files.length) { say('Elige imágenes'); return; }
    if (!selectedWorkspace()) { say('Selecciona un workspace'); return; }

    progress.classList.add('show');
    chooseBtn.disabled = true;
    let failures = 0;

    for (let index = 0; index < files.length; index += 1) {
      const original = files[index];
      progressText.textContent = `Preparando ${index + 1} de ${files.length}: ${original.name}`;
      progressFill.style.width = `${Math.round((index / files.length) * 100)}%`;
      try {
        const packed = await compressImage(original);
        const form = new FormData();
        form.append('file', packed.file);
        form.append('workspace_id', selectedWorkspace());
        form.append('category', categorySelect.value || 'inbox');
        form.append('title', original.name.replace(/\.[^.]+$/, ''));
        form.append('source', 'johanka_custom_cloud');
        form.append('original_bytes', String(packed.original));
        if (packed.width) form.append('width', String(packed.width));
        if (packed.height) form.append('height', String(packed.height));

        const response = await fetch('/api/cloud', {
          method: 'POST',
          headers: authHeaders(),
          credentials: 'same-origin',
          body: form
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) throw data;
        progressText.textContent = `Subida: ${original.name} · ${formatBytes(packed.file.size)}`;
      } catch (error) {
        failures += 1;
        progressText.textContent = detail(error, `Falló ${original.name}`);
        say(detail(error, `Falló ${original.name}`));
      }
    }

    progressFill.style.width = '100%';
    progressText.textContent = failures
      ? `${files.length - failures} subidas · ${failures} con error. ${progressText.textContent}`
      : 'Listo. Ya aparece en tu nube.';
    chooseBtn.disabled = false;
    fileInput.value = '';
    await loadAssets();
    if (!failures) setTimeout(() => progress.classList.remove('show'), 1800);
  };

  refreshBtn.onclick = loadAssets;
  fileInput.onchange = (event) => uploadFiles(event.target.files);
  dropZone.ondrop = (event) => {
    event.preventDefault();
    dropZone.classList.remove('drag');
    uploadFiles(event.dataTransfer.files);
  };

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) hydrateImages(node);
      });
    }
  });
  observer.observe(document.getElementById('gallery') || document.body, { childList: true, subtree: true });

  const style = document.createElement('style');
  style.textContent = '.asset-load-error{display:grid;place-items:center;color:rgba(255,255,255,.55);font-size:11px;padding:12px}.asset-load-error:after{content:"No se pudo cargar"}';
  document.head.appendChild(style);

  const bootstrap = () => loadSession().then(loadAssets).catch((error) => {
    gallery.innerHTML = `<div class="empty"><b>No se pudo abrir la nube.</b><br><span>${detail(error, 'Error desconocido')}</span></div>`;
  });
  if (window.__JOHANKA_CLOUD_BOOTSTRAP_DEFERRED__) bootstrap();
  else setTimeout(() => {
    if (/Conectando|Cargando/i.test(gallery?.textContent || '')) bootstrap();
  }, 3500);

  addEventListener('pagehide', () => {
    observer.disconnect();
    blobUrls.forEach((url) => URL.revokeObjectURL(url));
    blobUrls.clear();
  }, { once: true });
})();
