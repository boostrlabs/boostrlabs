(() => {
  const script = document.currentScript;
  const slug = script && script.dataset && script.dataset.johankarrdSlug;
  if (!slug) return;
  fetch(`/api/johankarrd/live?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
    .then((res) => res.ok ? res.json() : null)
    .then((data) => {
      if (!data || !data.html) return;
      document.open();
      document.write(data.html);
      document.close();
    })
    .catch(() => {});
})();
