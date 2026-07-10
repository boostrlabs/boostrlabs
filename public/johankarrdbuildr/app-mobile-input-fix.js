(() => {
  const findOriginal = (node) => {
    const target = node.dataset.target || '';
    const key = node.dataset.key || '';
    const index = node.dataset.index || '';
    return document.querySelector(`.editor-panel [data-edit][data-target="${CSS.escape(target)}"][data-key="${CSS.escape(key)}"][data-index="${CSS.escape(index)}"]`);
  };

  document.addEventListener('input', (event) => {
    const mobileInput = event.target.closest('.prime-mobile-panel [data-edit]');
    if (!mobileInput) return;
    const original = findOriginal(mobileInput);
    if (!original || original === mobileInput) return;
    original.value = mobileInput.value;
    original.dispatchEvent(new Event('input', { bubbles: true }));
  }, true);

  document.addEventListener('change', (event) => {
    const mobileUpload = event.target.closest('.prime-mobile-panel [data-upload], .prime-mobile-panel [data-upload-new]');
    if (!mobileUpload) return;
    const selector = mobileUpload.matches('[data-upload-new]')
      ? '.editor-panel [data-upload-new]'
      : `.editor-panel [data-upload="${CSS.escape(mobileUpload.dataset.upload || '')}"]`;
    const original = document.querySelector(selector);
    if (!original || original === mobileUpload || !mobileUpload.files?.length) return;
    try {
      const transfer = new DataTransfer();
      [...mobileUpload.files].forEach((file) => transfer.items.add(file));
      original.files = transfer.files;
      original.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (_) {}
  }, true);
})();
