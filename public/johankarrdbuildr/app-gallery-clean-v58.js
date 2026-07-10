(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function cleanGalleryDefaults(box) {
    const textarea = $('[data-value="imgs"]', box);
    if (!textarea || box.dataset.galleryDefaultsCleaned) return;
    box.dataset.galleryDefaultsCleaned = '1';
    const values = textarea.value.split('\n').map((value) => value.trim()).filter(Boolean);
    const isCafeDemo = values.length > 0 && values.every((value) => value.startsWith('/assets/johankarrd/cafedelmar/'));
    if (!isCafeDemo) return;
    textarea.value = '';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    const preview = $('[data-media-preview]', box);
    if (preview) preview.innerHTML = '<div style="grid-column:1/-1;padding:18px;text-align:center;color:rgba(255,255,255,.42);font:800 10px Arial">No images yet. Choose photos above.</div>';
  }

  function inspect() {
    $$('.modal-card').forEach(cleanGalleryDefaults);
  }

  window.addEventListener('load', () => {
    inspect();
    new MutationObserver(inspect).observe(document.body, { childList: true, subtree: true });
  });
})();