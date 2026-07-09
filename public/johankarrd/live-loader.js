(() => {
  const script = document.currentScript;
  const slug = script && script.dataset && script.dataset.johankarrdSlug;
  if (!slug) return;
  fetch(`/api/johankarrd/live?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
    .then((res) => res.ok ? res.json() : null)
    .then((data) => {
      const html = data && typeof data.html === 'string' ? data.html.trim() : '';
      if (!html) return;
      const isSafe = html.includes('<!doctype html>') && html.includes('html,body') && html.includes('class="site"') && html.includes('function show()');
      if (!isSafe) return;
      document.open();
      document.write(html);
      document.close();
    })
    .catch(() => {});
})();
