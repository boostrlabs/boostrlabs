(() => {
  if (!location.pathname.replace(/\/+$/, '').endsWith('/app/johanka')) return;
  function apply() {
    document.querySelectorAll('a[href="/app/files"],a[href="/app/files/"],a[href="/app/johanka/cloud/"],a[href="/app/johanka/cloud"]').forEach(link => {
      link.href = '/app/cloud/';
      const text = (link.textContent || '').trim();
      if (/asset|file|archivo|cloud|nube/i.test(text)) link.textContent = /abrir|open/i.test(text) ? 'Abrir BOOSTR Cloud' : 'BOOSTR Cloud';
    });
    document.querySelectorAll('.card').forEach(card => {
      const title = card.querySelector('b');
      if (title && /asset library|files|johanka cloud|boostr cloud/i.test(title.textContent || '')) {
        title.textContent = 'BOOSTR Cloud';
        const copy = card.querySelector('p');
        if (copy) copy.textContent = 'Archivos organizados por workspace, módulo y permisos dentro del ecosistema BOOSTR.';
        card.href = '/app/cloud/';
      }
    });
  }
  apply();
  const observer = new MutationObserver(apply);
  observer.observe(document.body, { childList: true, subtree: true });
})();