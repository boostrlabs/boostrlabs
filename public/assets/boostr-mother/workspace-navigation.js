(() => {
  if (window.__BOOSTR_WORKSPACE_NAV__) return;
  window.__BOOSTR_WORKSPACE_NAV__ = true;

  const path = location.pathname.replace(/\/+$/, '') || '/';
  if (!['/app/janko', '/app/johanka'].includes(path)) return;

  function workspaceHref(text = '') {
    const value = text.toLowerCase();
    if (value.includes('janko') || value.includes('westdetro')) return '/partner-dashboard/?workspace=janko-westdetro';
    if (value.includes('82ngel')) return '/partner-dashboard/?workspace=82ngel-artist';
    if (value.includes('hummus')) return '/partner-dashboard/?workspace=hummus-fl';
    if (value.includes('boostr')) return '/partner-dashboard/?workspace=boostr-internal';
    return '/partner-dashboard/';
  }

  function addFounderWorkspaceButton() {
    const side = document.querySelector('.rail,.side');
    if (!side || side.querySelector('.founder-workspace-link')) return false;
    const logout = side.querySelector('.logout');
    const link = document.createElement('a');
    link.className = 'founder-workspace-link';
    link.href = '/partner-dashboard/';
    link.textContent = 'Abrir Workspace OS';
    link.style.cssText = 'min-height:48px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.055);color:inherit;border-radius:17px;padding:0 12px;font-weight:950;display:flex;align-items:center;text-decoration:none';
    side.insertBefore(link, logout || null);
    return true;
  }

  function routeFounderWorkspaceCards() {
    let changed = false;
    document.querySelectorAll('#workspaceGrid a.card').forEach((card) => {
      const href = workspaceHref(card.textContent || '');
      if (card.href !== new URL(href, location.origin).href) {
        card.href = href;
        changed = true;
      }
      const footer = card.querySelector('footer');
      if (footer && footer.textContent !== 'Abrir Workspace OS →') footer.textContent = 'Abrir Workspace OS →';
    });
    return changed;
  }

  function addArtistWorkspaceCard() {
    const grid = document.getElementById('primaryGrid');
    const mode = document.getElementById('modeKicker')?.textContent?.toLowerCase() || '';
    if (!grid || grid.querySelector('[data-artist-workspace-card]')) return false;
    let href = null;
    let title = null;
    let copy = null;
    if (path === '/app/janko' && mode.includes('janko artist')) {
      href = '/partner-dashboard/?workspace=janko-westdetro';
      title = 'JANKO / WESTDETRO Artist OS';
      copy = 'Workspace privado para música, servicios, releases, files y actividad artística.';
    }
    if (path === '/app/johanka' && mode.includes('82ngel')) {
      href = '/partner-dashboard/?workspace=82ngel-artist';
      title = '82NGEL Artist OS';
      copy = 'Workspace privado para identidad, releases, assets y actividad artística.';
    }
    if (!href) return false;
    const card = document.createElement('a');
    card.className = 'card';
    card.dataset.artistWorkspaceCard = 'true';
    card.href = href;
    card.innerHTML = `<span class="label">ABRIR</span><b>${title}</b><p>${copy}</p><footer>Abrir Workspace OS →</footer>`;
    grid.prepend(card);
    return true;
  }

  function enhance() {
    addFounderWorkspaceButton();
    routeFounderWorkspaceCards();
    addArtistWorkspaceCard();
  }

  enhance();
  const observer = new MutationObserver(enhance);
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 12000);
})();
