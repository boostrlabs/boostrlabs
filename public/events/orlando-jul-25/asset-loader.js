(() => {
  const assets = window.__BOOSTR_ASSETS || {};
  Object.entries(assets).forEach(([key, payload]) => {
    document.querySelectorAll(`[data-asset="${key}"]`).forEach((image) => {
      image.src = `data:image/webp;base64,${payload}`;
    });
  });
})();
