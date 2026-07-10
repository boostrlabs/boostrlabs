(() => {
  const API = '/api/hummus-missions';
  const note = document.getElementById('missionNote');
  const imageInput = document.getElementById('missionImage');
  const saveButton = document.getElementById('saveDelivery');
  const syncState = document.getElementById('syncState');
  const preview = document.getElementById('imagePreview');
  const previewImage = document.getElementById('previewImage');
  const previewName = document.getElementById('previewName');
  const previewMeta = document.getElementById('previewMeta');
  const cardCode = document.getElementById('cardCode');
  const completeButton = document.getElementById('completeBtn');

  if (!note || !imageInput || !saveButton || !cardCode) return;

  const records = new Map();
  let selectedFile = null;
  let activeCode = cardCode.textContent.trim();

  const formatBytes = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const setState = (text, state = '') => {
    syncState.textContent = text;
    syncState.dataset.state = state;
  };

  const showImage = (src, name = '', meta = '') => {
    if (!src) {
      preview.hidden = true;
      previewImage.removeAttribute('src');
      previewName.textContent = '';
      previewMeta.textContent = '';
      return;
    }
    preview.hidden = false;
    previewImage.src = src;
    previewName.textContent = name;
    previewMeta.textContent = meta;
  };

  const renderRecord = () => {
    activeCode = cardCode.textContent.trim();
    const row = records.get(activeCode);
    note.value = row?.note || '';
    selectedFile = null;
    imageInput.value = '';
    if (row?.asset_url) {
      showImage(`${row.asset_url}&v=${encodeURIComponent(row.updated_at || '')}`, row.asset_name || 'Imagen guardada', 'Guardada en BOOSTR');
    } else {
      showImage('', '', '');
    }
    setState(row?.updated_at ? 'Guardado' : 'Sin guardar', row?.updated_at ? 'saved' : '');
  };

  const loadRecords = async () => {
    try {
      const response = await fetch(API, { cache: 'no-store' });
      if (!response.ok) throw new Error('load_failed');
      const data = await response.json();
      (data.rows || []).forEach((row) => records.set(row.mission_code, row));
      renderRecord();
    } catch {
      setState('No se pudo sincronizar', 'error');
    }
  };

  const compressImage = async (file) => {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1800;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: true });
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const preserveTransparency = file.type === 'image/png';
    const outputType = preserveTransparency ? 'image/webp' : 'image/webp';
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, 0.82));
    if (!blob) throw new Error('compression_failed');

    const baseName = file.name.replace(/\.[^.]+$/, '').slice(0, 120) || 'mission-asset';
    return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() });
  };

  imageInput.addEventListener('change', async () => {
    const original = imageInput.files?.[0];
    if (!original) return;
    if (!original.type.startsWith('image/')) {
      setState('Ese archivo no es una imagen', 'error');
      imageInput.value = '';
      return;
    }

    try {
      setState('Comprimiendo…', 'working');
      selectedFile = await compressImage(original);
      const url = URL.createObjectURL(selectedFile);
      showImage(url, selectedFile.name, `${formatBytes(original.size)} → ${formatBytes(selectedFile.size)}`);
      setState('Lista para guardar', 'working');
    } catch {
      selectedFile = null;
      setState('No se pudo preparar la imagen', 'error');
    }
  });

  saveButton.addEventListener('click', async () => {
    const missionCode = cardCode.textContent.trim();
    const form = new FormData();
    form.append('mission_code', missionCode);
    form.append('note', note.value);
    form.append('completed', String(completeButton?.getAttribute('aria-pressed') === 'true'));
    if (selectedFile) form.append('asset', selectedFile, selectedFile.name);

    saveButton.disabled = true;
    setState('Guardando…', 'working');

    try {
      const response = await fetch(API, { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'save_failed');
      records.set(missionCode, data.row);
      selectedFile = null;
      imageInput.value = '';
      note.value = data.row.note || '';
      if (data.row.asset_url) showImage(`${data.row.asset_url}&v=${encodeURIComponent(data.row.updated_at)}`, data.row.asset_name || 'Imagen guardada', 'Guardada en BOOSTR');
      setState('Guardado', 'saved');
    } catch {
      setState('No se pudo guardar', 'error');
    } finally {
      saveButton.disabled = false;
    }
  });

  const observer = new MutationObserver(() => {
    const nextCode = cardCode.textContent.trim();
    if (nextCode !== activeCode) renderRecord();
  });
  observer.observe(cardCode, { childList: true, characterData: true, subtree: true });

  loadRecords();
})();