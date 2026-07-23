(() => {
  const native = {
    jankoPoster: './assets/janko-diorr-flyer-hq.jpg?v=1',
    gemesePoster: './assets/gemese-flyer-hq.jpg?v=1',
    rowma: './assets/rowma-hq.jpg?v=1'
  };

  const fallback = (image) => {
    const key = image.dataset.asset;
    const payload = window.__BOOSTR_ASSETS?.[key];
    if (payload) image.src = `data:image/webp;base64,${payload}`;
  };

  Object.entries(native).forEach(([key, url]) => {
    document.querySelectorAll(`[data-asset="${key}"]`).forEach((image) => {
      image.decoding = 'async';
      image.src = url;
      image.addEventListener('error', () => fallback(image), { once: true });
    });
  });
})();
