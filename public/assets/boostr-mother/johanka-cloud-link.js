(() => {
  if (!location.pathname.replace(/\/+$/, '').endsWith('/app/johanka')) return;
  function apply() {
    document.querySelectorAll('a[href="/app/files"],a[href="/app/files/"]').forEach(link => {
      link.href = '/app/johanka/cloud/';
      const text = (link.textContent || '').trim();
      if (/asset|file|archivo/i.test(text)) link.textContent = /abrir|open/i.test(text) ? 'Abrir mi nube' : 'Johanka Cloud';
    });
    document.querySelectorAll('.card').forEach(card => {
      const title = card.querySelector('b');
      if (title && /asset library|files/i.test(title.textContent || '')) {
        title.textContent = 'Johanka Cloud';
        const copy = card.querySelector('p');
        if (copy) copy.textContent = 'Pasa imágenes del teléfono a la computadora y organízalas por proyecto.';
        card.href = '/app/johanka/cloud/';
      }
    });
  }
  apply();
  const observer = new MutationObserver(apply);
  observer.observe(document.body, { childList: true, subtree: true });
})();
