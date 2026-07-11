(() => {
  if (window.__JOHANKA_CLOUD_BINARY_UPLOAD__) return;
  if (!location.pathname.replace(/\/+$/, '').endsWith('/app/johanka/cloud')) return;
  window.__JOHANKA_CLOUD_BINARY_UPLOAD__ = true;

  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const chooseBtn = document.getElementById('chooseBtn');
  const progress = document.getElementById('progress');
  const progressText = document.getElementById('progressText');
  const progressFill = document.getElementById('progressFill');
  const categorySelect = document.getElementById('categorySelect');
  const gallery = document.getElementById('gallery');
  const countText = document.getElementById('countText');
  if (!fileInput || !dropZone || !chooseBtn || !progress || !progressText || !progressFill) return;

  fileInput.accept = 'image/*,.heic,.heif,.zip,application/zip,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
  fileInput.multiple = true;
  chooseBtn.textContent = 'Subir archivos';
  const dropTitle = dropZone.querySelector('strong');
  const dropCopy = dropZone.querySelector('p');
  if (dropTitle) dropTitle.textContent = 'Suelta fotos, archivos o ZIP aquí';
  if (dropCopy) dropCopy.textContent = 'HEIC se convierte, las fotos grandes se optimizan y los ZIP se descomprimen antes de guardarse.';
  const heroTitle = document.querySelector('.hero h1');
  if (heroTitle) heroTitle.textContent = 'Tu nube de trabajo.';

  const authHeaders = () => {
    const token = localStorage.getItem('boostr_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadScript = (src, test) => {
    if (test()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find((script) => script.src === src);
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('No se pudo cargar el procesador de archivos.'));
      document.head.appendChild(script);
    });
  };

  const showSelection = (files, extra = '') => {
    let status = document.getElementById('cloudSelectionStatus');
    if (!status) {
      status = document.createElement('div');
      status.id = 'cloudSelectionStatus';
      status.setAttribute('aria-live', 'polite');
      status.style.cssText = 'margin-top:10px;color:rgba(247,242,229,.72);font-size:12px;font-weight:800;line-height:1.4';
      dropZone.insertAdjacentElement('afterend', status);
    }
    if (!files.length) status.textContent = 'Ningún archivo seleccionado.';
    else status.textContent = `${files.length} archivo${files.length === 1 ? '' : 's'} listo${files.length === 1 ? '' : 's'}${extra ? ` · ${extra}` : ''}`;
  };

  const extension = (name = '') => (String(name).toLowerCase().match(/\.([a-z0-9]{1,12})$/)?.[1] || '');
  const isZip = (file) => file.type === 'application/zip' || extension(file.name) === 'zip';
  const isHeic = (file) => ['image/heic', 'image/heif'].includes(file.type) || ['heic', 'heif'].includes(extension(file.name));
  const isImage = (file) => file.type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'].includes(extension(file.name));

  async function expandZip(file) {
    await loadScript('https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js', () => Boolean(window.fflate?.unzipSync));
    const archive = new Uint8Array(await file.arrayBuffer());
    const entries = window.fflate.unzipSync(archive);
    const output = [];
    let total = 0;
    for (const [path, bytes] of Object.entries(entries)) {
      if (!bytes?.length || path.endsWith('/') || path.includes('__MACOSX') || path.split('/').pop()?.startsWith('.')) continue;
      total += bytes.length;
      if (output.length >= 200 || total > 200 * 1024 * 1024) throw new Error('El ZIP excede 200 archivos o 200 MB descomprimidos.');
      const name = path.split('/').pop() || 'archivo';
      const type = mimeFromName(name);
      const extracted = new File([bytes], name, { type, lastModified: file.lastModified });
      extracted.__boostrArchiveName = file.name;
      extracted.__boostrEntryPath = path;
      output.push(extracted);
    }
    if (!output.length) throw new Error('El ZIP no contiene archivos utilizables.');
    return output;
  }

  function mimeFromName(name) {
    const ext = extension(name);
    const map = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
      heic: 'image/heic', heif: 'image/heif', pdf: 'application/pdf', txt: 'text/plain',
      zip: 'application/zip', json: 'application/json', csv: 'text/csv',
      doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
    return map[ext] || 'application/octet-stream';
  }

  async function convertHeic(file) {
    await loadScript('https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js', () => typeof window.heic2any === 'function');
    const result = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 });
    const blob = Array.isArray(result) ? result[0] : result;
    const base = file.name.replace(/\.[^.]+$/, '') || 'imagen';
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: file.lastModified });
  }

  async function decodeImage(file) {
    if ('createImageBitmap' in window) {
      try { return await createImageBitmap(file); } catch {}
    }
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.decoding = 'async';
      image.src = url;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      });
      return image;
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  async function optimizeImage(original) {
    if (original.type === 'image/gif') return { file: original, filename: original.name, original: original.size };
    let sourceFile = original;
    if (isHeic(original)) {
      try { sourceFile = await convertHeic(original); }
      catch { return { file: original, filename: original.name, original: original.size }; }
    }
    const image = await decodeImage(sourceFile);
    const width = image.width || image.naturalWidth;
    const height = image.height || image.naturalHeight;
    const maxSide = 3200;
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const nextWidth = Math.max(1, Math.round(width * scale));
    const nextHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = nextWidth;
    canvas.height = nextHeight;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('No se pudo preparar la imagen.');
    context.drawImage(image, 0, 0, nextWidth, nextHeight);
    image.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9));
    if (!blob) throw new Error('No se pudo optimizar la imagen.');
    if (blob.size >= sourceFile.size && scale === 1 && !isHeic(original)) {
      return { file: sourceFile, filename: sourceFile.name, width, height, original: original.size };
    }
    const base = original.name.replace(/\.[^.]+$/, '') || 'imagen';
    return { file: blob, filename: `${base}.webp`, width: nextWidth, height: nextHeight, original: original.size };
  }

  async function sendBinary(upload, original, packed = {}) {
    const workspaceId = typeof selectedWorkspace === 'function' ? selectedWorkspace() : '';
    if (!workspaceId) throw new Error('Selecciona un workspace antes de subir.');
    const filename = packed.filename || upload.name || original.name || 'archivo';
    const title = (original.name || 'Archivo').replace(/\.[^.]+$/, '') || 'Archivo';
    const params = new URLSearchParams({
      workspace_id: workspaceId,
      category: categorySelect?.value || 'inbox',
      title,
      filename,
      source: original.__boostrArchiveName ? 'johanka_cloud_zip' : 'johanka_custom_cloud',
      original_bytes: String(packed.original || original.size || upload.size || 0)
    });
    if (packed.width) params.set('width', String(packed.width));
    if (packed.height) params.set('height', String(packed.height));
    if (original.__boostrArchiveName) params.set('archive_name', original.__boostrArchiveName);
    if (original.__boostrEntryPath) params.set('entry_path', original.__boostrEntryPath);
    const response = await fetch(`/api/cloud/upload?${params}`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': upload.type || original.type || mimeFromName(filename) },
      credentials: 'same-origin',
      cache: 'no-store',
      body: upload
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      const error = new Error(data.message || data.error || `Upload failed (${response.status})`);
      error.stage = data.stage;
      error.detail = data.detail;
      throw error;
    }
    return data;
  }

  async function normalizeSelection(fileList) {
    const selected = [...(fileList || [])].filter(Boolean);
    const normalized = [];
    for (const file of selected) {
      if (isZip(file)) normalized.push(...await expandZip(file));
      else normalized.push(file);
    }
    return normalized;
  }

  async function uploadBinaryFiles(fileList) {
    const selected = [...(fileList || [])].filter(Boolean);
    if (!selected.length) {
      typeof say === 'function' ? say('Elige archivos primero') : alert('Elige archivos primero');
      return;
    }
    showSelection(selected, 'preparando');
    progress.classList.add('show');
    chooseBtn.disabled = true;
    let files;
    try {
      files = await normalizeSelection(selected);
    } catch (error) {
      progressText.textContent = error.message || 'No se pudo abrir el ZIP.';
      chooseBtn.disabled = false;
      if (typeof say === 'function') say(progressText.textContent);
      return;
    }
    showSelection(files, selected.some(isZip) ? 'ZIP descomprimido' : '');
    let failures = 0;
    for (let index = 0; index < files.length; index += 1) {
      const original = files[index];
      progressText.textContent = `Preparando ${index + 1} de ${files.length}: ${original.name}`;
      progressFill.style.width = `${Math.round((index / files.length) * 100)}%`;
      try {
        let packed = { file: original, filename: original.name, original: original.size };
        if (isImage(original)) {
          try { packed = await optimizeImage(original); }
          catch { packed = { file: original, filename: original.name, original: original.size }; }
        }
        await sendBinary(packed.file || original, original, packed);
        progressText.textContent = `Subido ${index + 1} de ${files.length}: ${original.name}`;
      } catch (error) {
        failures += 1;
        const message = [error.message, error.stage ? `etapa: ${error.stage}` : '', error.detail || ''].filter(Boolean).join(' · ');
        progressText.textContent = message || `Falló ${original.name}`;
        if (typeof say === 'function') say(progressText.textContent);
      }
    }
    progressFill.style.width = '100%';
    progressText.textContent = failures
      ? `${files.length - failures} subidos · ${failures} con error.`
      : `${files.length} archivo${files.length === 1 ? '' : 's'} disponible${files.length === 1 ? '' : 's'} en tu nube.`;
    chooseBtn.disabled = false;
    fileInput.value = '';
    showSelection([]);
    if (typeof loadAssets === 'function') await loadAssets();
    if (!failures) setTimeout(() => progress.classList.remove('show'), 2200);
  }

  async function downloadAsset(asset) {
    const response = await fetch(asset.file_url, { headers: authHeaders(), credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo descargar el archivo.');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = asset.metadata?.original_name || asset.title || 'archivo';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  const previousRenderGallery = window.renderGallery;
  window.renderGallery = function renderCloudFiles() {
    const list = typeof filteredAssets === 'function' ? filteredAssets() : (window.assets || []);
    const allAssets = window.assets || assets || [];
    if (countText) countText.textContent = `${allAssets.length} archivo${allAssets.length === 1 ? '' : 's'}`;
    if (!gallery) return previousRenderGallery?.();
    gallery.innerHTML = list.length ? list.map((asset) => {
      const type = asset.file_type || asset.metadata?.file_type || 'image';
      const isVisual = type === 'image' && !['heic', 'heif'].includes(extension(asset.metadata?.original_name || ''));
      const visual = isVisual
        ? `<figure><img loading="lazy" data-private-src="${asset.file_url}" alt="${String(asset.title || 'Asset').replace(/"/g, '&quot;')}"></figure>`
        : `<figure class="cloud-file-icon"><span>${type === 'archive' ? 'ZIP' : extension(asset.metadata?.original_name || '')?.toUpperCase() || 'FILE'}</span></figure>`;
      return `<button class="asset" data-id="${asset.id}" data-type="${type}">${visual}<div class="asset-meta"><b>${asset.title || 'Archivo'}</b><span>${asset.metadata?.category || 'inbox'} · ${typeof dateLabel === 'function' ? dateLabel(asset.created_at) : ''}</span></div></button>`;
    }).join('') : '<div class="empty">No hay archivos en esta vista.</div>';
    gallery.querySelectorAll('.asset').forEach((button) => {
      button.onclick = async () => {
        const asset = allAssets.find((item) => item.id === button.dataset.id);
        if (!asset) return;
        if (button.dataset.type === 'image' && !['heic', 'heif'].includes(extension(asset.metadata?.original_name || ''))) {
          if (typeof openAsset === 'function') openAsset(asset.id);
        } else {
          try { await downloadAsset(asset); }
          catch (error) { if (typeof say === 'function') say(error.message); }
        }
      };
    });
    if (typeof hydrateImages === 'function') hydrateImages(gallery);
  };

  const style = document.createElement('style');
  style.textContent = '.cloud-file-icon{display:grid!important;place-items:center;background:linear-gradient(145deg,rgba(143,232,238,.12),rgba(191,211,138,.06))!important}.cloud-file-icon span{font:1000 24px ui-monospace,Menlo,monospace;letter-spacing:.08em;color:#f4ead2}';
  document.head.appendChild(style);

  fileInput.addEventListener('change', (event) => {
    event.stopImmediatePropagation();
    uploadBinaryFiles(event.target.files);
  }, true);
  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    dropZone.classList.remove('drag');
    uploadBinaryFiles(event.dataTransfer?.files);
  }, true);
  chooseBtn.onclick = () => fileInput.click();
  showSelection([]);
})();
