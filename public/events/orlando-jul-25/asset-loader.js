(() => {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = './hq.css?v=1';
  document.head.appendChild(stylesheet);

  const assets = window.__BOOSTR_ASSETS || {};
  Object.entries(assets).forEach(([key, payload]) => {
    document.querySelectorAll(`[data-asset="${key}"]`).forEach((image) => {
      image.decoding = 'async';
      image.loading = image.closest('.hero') ? 'eager' : 'lazy';
      image.src = `data:image/webp;base64,${payload}`;
    });
  });
})();
