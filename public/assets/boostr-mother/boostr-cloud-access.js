(() => {
  const path = location.pathname.replace(/\/+$/, '');
  if (!['/app/johanka/cloud', '/app/cloud'].includes(path)) return;
  if (window.__BOOSTR_CLOUD_ACCESS__) return;
  window.__BOOSTR_CLOUD_ACCESS__ = true;

  document.title = 'BOOSTR Cloud — BOOSTR Labs';
  const replaceText = () => {
    document.querySelectorAll('b,small,span,h1,h2,p,strong,button,a').forEach((node) => {
      if (node.childElementCount) return;
      const text = (node.textContent || '').trim();
      if (text === 'Johanka Cloud') node.textContent = 'BOOSTR Cloud';
      if (text === 'JOHANKA CUSTOM CLOUD · PRIVADA') node.textContent = 'BOOSTR CLOUD · PRIVADA';
      if (text === 'Tu nube de trabajo.' || text === 'Tu piscina de imágenes.') node.textContent = 'Tu nube dentro de BOOSTR.';
      if (/Sube desde el teléfono/.test(text)) node.textContent = 'Sube desde cualquier dispositivo. BOOSTR organiza cada archivo por workspace, módulo y nivel de acceso.';
    });
  };

  function ensureAccessControls() {
    if (document.getElementById('cloudVisibilitySelect')) return;
    const category = document.getElementById('categorySelect');
    if (!category) return;
    const visibility = document.createElement('select');
    visibility.id = 'cloudVisibilitySelect';
    visibility.setAttribute('aria-label', 'Quién puede ver estos archivos');
    visibility.innerHTML = [
      '<option value="workspace">Todo el workspace</option>',
      '<option value="private">Solo yo</option>',
      '<option value="role">Managers y admins</option>',
      '<option value="module">Solo usuarios con este módulo</option>'
    ].join('');
    category.insertAdjacentElement('afterend', visibility);

    const note = document.createElement('small');
    note.id = 'cloudAccessNote';
    note.style.cssText = 'display:block;color:rgba(247,242,229,.58);line-height:1.35';
    visibility.insertAdjacentElement('afterend', note);
    const render = () => {
      const labels = {
        workspace: 'Visible para miembros activos de este workspace.',
        private: 'Solo tú y managers/admins pueden abrirlo.',
        role: 'Visible para roles manager y admin.',
        module: 'Visible para quienes tengan activo el módulo seleccionado.'
      };
      note.textContent = labels[visibility.value] || '';
    };
    visibility.addEventListener('change', render);
    render();
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    try {
      const raw = typeof input === 'string' ? input : input?.url;
      if (raw && raw.includes('/api/cloud/upload?')) {
        const url = new URL(raw, location.origin);
        const visibility = document.getElementById('cloudVisibilitySelect')?.value || 'workspace';
        const moduleSlug = document.getElementById('categorySelect')?.value || 'inbox';
        url.searchParams.set('visibility', visibility);
        url.searchParams.set('module_slug', moduleSlug);
        url.searchParams.set('source', 'boostr_cloud');
        if (visibility === 'role') url.searchParams.set('allowed_roles', 'manager,admin');
        input = url.pathname + url.search;
      }
    } catch {}
    return originalFetch(input, init);
  };

  replaceText();
  ensureAccessControls();
  const observer = new MutationObserver(() => { replaceText(); ensureAccessControls(); });
  observer.observe(document.body, { childList: true, subtree: true });
  addEventListener('pagehide', () => observer.disconnect(), { once: true });
})();