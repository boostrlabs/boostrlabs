(() => {
  const setStatus = (text) => {
    const el = document.querySelector('[data-status]');
    if (el) el.textContent = text;
  };

  const isImageAddModal = (box) => Boolean(
    box &&
    box.querySelector('[data-config-upload]') &&
    box.querySelector('[data-value="src"]') &&
    /image|logo/i.test(box.textContent || '')
  );

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function preview(box, src) {
    let slot = box.querySelector('[data-local-image-preview]');
    if (!slot) {
      slot = document.createElement('div');
      slot.dataset.localImagePreview = '1';
      slot.style.cssText = 'margin:12px 0;border:1px solid rgba(254,237,185,.25);border-radius:18px;padding:10px;background:rgba(255,255,255,.04);display:grid;place-items:center;min-height:88px;';
      const upload = box.querySelector('.upload-drop');
      if (upload) upload.insertAdjacentElement('beforebegin', slot);
    }
    slot.innerHTML = '';
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.style.cssText = 'max-width:100%;max-height:170px;border-radius:14px;object-fit:contain;display:block;';
    slot.append(img);
  }

  function normalizeModal(box) {
    if (!isImageAddModal(box) || box.dataset.localUploadPatched) return;
    box.dataset.localUploadPatched = '1';
    const input = box.querySelector('[data-value="src"]');
    if (!input) return;
    const current = (input.value || '').trim();
    if (current === '/assets/johankarrd/cafedelmar/image04.jpg') input.value = '';
    input.placeholder = 'Upload image, drag file here, or paste URL';
    const upload = box.querySelector('.upload-drop');
    if (upload) {
      upload.style.cursor = 'pointer';
      upload.title = 'Upload local image';
    }
  }

  async function setLocalFile(box, file) {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      setStatus('Selecciona una imagen válida.');
      return;
    }
    const input = box.querySelector('[data-value="src"]');
    if (!input) return;
    setStatus('Loading local image…');
    const dataUrl = await fileToDataUrl(file);
    input.value = dataUrl;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    preview(box, dataUrl);
    setStatus('Imagen lista. Dale Add.');
  }

  const observer = new MutationObserver(() => {
    document.querySelectorAll('.modal-card').forEach(normalizeModal);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener('change', async (event) => {
    const input = event.target.closest('[data-config-upload]');
    if (!input) return;
    const box = input.closest('.modal-card');
    if (!isImageAddModal(box)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    await setLocalFile(box, input.files && input.files[0]);
  }, true);

  document.addEventListener('dragover', (event) => {
    const drop = event.target.closest('.upload-drop');
    const box = drop && drop.closest('.modal-card');
    if (!isImageAddModal(box)) return;
    event.preventDefault();
    drop.style.borderColor = 'rgba(139,232,255,.85)';
  }, true);

  document.addEventListener('dragleave', (event) => {
    const drop = event.target.closest('.upload-drop');
    if (drop) drop.style.borderColor = '';
  }, true);

  document.addEventListener('drop', async (event) => {
    const drop = event.target.closest('.upload-drop');
    const box = drop && drop.closest('.modal-card');
    if (!isImageAddModal(box)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    drop.style.borderColor = '';
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    await setLocalFile(box, file);
  }, true);

  document.addEventListener('click', (event) => {
    const add = event.target.closest('[data-add-configured]');
    if (!add) return;
    const box = add.closest('.modal-card');
    if (!isImageAddModal(box)) return;
    const input = box.querySelector('[data-value="src"]');
    if (!input || !input.value.trim()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setStatus('Primero sube una imagen o pega una URL.');
      input?.focus();
    }
  }, true);

  window.addEventListener('load', () => {
    document.querySelectorAll('.modal-card').forEach(normalizeModal);
  });
})();
