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
  if (!fileInput || !dropZone || !chooseBtn || !progress || !progressText || !progressFill) return;

  const authHeaders = () => {
    const token = localStorage.getItem('boostr_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const showSelection = (files) => {
    let status = document.getElementById('cloudSelectionStatus');
    if (!status) {
      status = document.createElement('div');
      status.id = 'cloudSelectionStatus';
      status.setAttribute('aria-live', 'polite');
      status.style.cssText = 'margin-top:10px;color:rgba(247,242,229,.72);font-size:12px;font-weight:800;line-height:1.4';
      dropZone.insertAdjacentElement('afterend', status);
    }
    if (!files.length) status.textContent = 'Ninguna imagen seleccionada.';
    else if (files.length === 1) status.textContent = `Lista para subir: ${files[0].name}`;
    else status.textContent = `${files.length} imágenes listas para subir.`;
  };

  async function sendBinary(upload, original, packed = {}) {
    const workspaceId = typeof selectedWorkspace === 'function' ? selectedWorkspace() : '';
    if (!workspaceId) throw new Error('Selecciona un workspace antes de subir.');

    const filename = packed.filename || upload.name || original.name || 'imagen';
    const title = (original.name || 'Imagen').replace(/\.[^.]+$/, '') || 'Imagen';
    const params = new URLSearchParams({
      workspace_id: workspaceId,
      category: categorySelect?.value || 'inbox',
      title,
      filename,
      source: 'johanka_custom_cloud',
      original_bytes: String(packed.original || original.size || upload.size || 0)
    });
    if (packed.width) params.set('width', String(packed.width));
    if (packed.height) params.set('height', String(packed.height));

    const response = await fetch(`/api/cloud/upload?${params}`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
        'Content-Type': upload.type || original.type || 'application/octet-stream'
      },
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

  async function uploadBinaryFiles(fileList) {
    const files = [...(fileList || [])].filter((file) => file && file.type?.startsWith('image/'));
    if (!files.length) {
      typeof say === 'function' ? say('Elige una imagen primero') : alert('Elige una imagen primero');
      return;
    }

    showSelection(files);
    progress.classList.add('show');
    chooseBtn.disabled = true;
    let failures = 0;

    for (let index = 0; index < files.length; index += 1) {
      const original = files[index];
      progressText.textContent = `Preparando ${index + 1} de ${files.length}: ${original.name}`;
      progressFill.style.width = `${Math.round((index / files.length) * 100)}%`;
      try {
        let packed;
        try {
          packed = typeof compressImage === 'function'
            ? await compressImage(original)
            : { file: original, filename: original.name, original: original.size };
        } catch {
          packed = { file: original, filename: original.name, original: original.size };
        }
        await sendBinary(packed.file || original, original, packed);
        progressText.textContent = `Subida: ${original.name}`;
      } catch (error) {
        failures += 1;
        const message = [error.message, error.stage ? `etapa: ${error.stage}` : '', error.detail || ''].filter(Boolean).join(' · ');
        progressText.textContent = message || `Falló ${original.name}`;
        if (typeof say === 'function') say(progressText.textContent);
      }
    }

    progressFill.style.width = '100%';
    progressText.textContent = failures
      ? `${files.length - failures} subidas · ${failures} con error. ${progressText.textContent}`
      : 'Listo. Ya aparece en tu nube.';
    chooseBtn.disabled = false;
    fileInput.value = '';
    showSelection([]);
    if (typeof loadAssets === 'function') await loadAssets();
    if (!failures) setTimeout(() => progress.classList.remove('show'), 1800);
  }

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
