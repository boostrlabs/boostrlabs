(() => {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const token = localStorage.getItem('boostr_auth_token') || '';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  async function api(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: { ...authHeaders, ...(options.headers || {}) },
      credentials: 'same-origin',
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw data;
    return data;
  }

  async function honorRequestedWorkspace() {
    if (path !== '/partner-dashboard') return;
    const requested = new URLSearchParams(location.search).get('workspace');
    if (!requested) return;
    try {
      const session = await api('/api/session');
      const target = (session.workspaces || []).find((workspace) => workspace.id === requested || workspace.slug === requested);
      if (!target) return;
      if (session.active_workspace?.id !== target.id) {
        await api('/api/session/switch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace_id: target.id })
        });
      }
      location.replace('/partner-dashboard/?v=0.8.2');
    } catch (error) {
      console.error('Workspace route switch failed:', error);
    }
  }

  function workspaceHref(text = '') {
    const value = text.toLowerCase();
    if (value.includes('janko') || value.includes('westdetro')) return '/partner-dashboard/?workspace=janko-westdetro';
    if (value.includes('82ngel')) return '/partner-dashboard/?workspace=82ngel-artist';
    if (value.includes('hummus')) return '/partner-dashboard/?workspace=hummus-fl';
    if (value.includes('boostr')) return '/partner-dashboard/?workspace=boostr-internal';
    return '/partner-dashboard/';
  }

  function addGlobalWorkspaceButton() {
    const bar = document.querySelector('.boostr-production-context');
    if (!bar || bar.querySelector('.boostr-open-workspace')) return;
    const link = document.createElement('a');
    link.className = 'boostr-open-workspace';
    link.href = '/partner-dashboard/';
    link.title = 'Abrir Workspace OS';
    link.textContent = 'Workspace OS';
    const identity = bar.querySelector('.identity');
    bar.insertBefore(link, identity || null);
    const switcher = bar.querySelector('[data-workspace]');
    if (switcher) switcher.title = 'Cambiar workspace activo';
  }

  function addFounderWorkspaceButton() {
    if (!['/app/janko', '/app/johanka'].includes(path)) return;
    const side = document.querySelector('.rail,.side');
    if (!side || side.querySelector('.founder-workspace-link')) return;
    const logout = side.querySelector('.logout');
    const link = document.createElement('a');
    link.className = 'founder-workspace-link';
    link.href = '/partner-dashboard/';
    link.textContent = 'Abrir Workspace OS';
    link.style.cssText = 'min-height:48px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.055);color:inherit;border-radius:17px;padding:0 12px;font-weight:950;display:flex;align-items:center;text-decoration:none';
    side.insertBefore(link, logout || null);
  }

  function routeFounderWorkspaceCards() {
    if (!['/app/janko', '/app/johanka'].includes(path)) return;
    document.querySelectorAll('#workspaceGrid a.card').forEach((card) => {
      card.href = workspaceHref(card.textContent || '');
      const footer = card.querySelector('footer');
      if (footer) footer.textContent = 'Abrir Workspace OS →';
    });
  }

  function addArtistWorkspaceCard() {
    const grid = document.getElementById('primaryGrid');
    const mode = document.getElementById('modeKicker')?.textContent?.toLowerCase() || '';
    if (!grid || grid.querySelector('[data-artist-workspace-card]')) return;
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
    if (!href) return;
    const card = document.createElement('a');
    card.className = 'card';
    card.dataset.artistWorkspaceCard = 'true';
    card.href = href;
    card.innerHTML = `<span class="label">ABRIR</span><b>${title}</b><p>${copy}</p><footer>Abrir Workspace OS →</footer>`;
    grid.prepend(card);
  }

  function enhance() {
    addGlobalWorkspaceButton();
    addFounderWorkspaceButton();
    routeFounderWorkspaceCards();
    addArtistWorkspaceCard();
  }

  const style = document.createElement('style');
  style.textContent = '@media(max-width:720px){.boostr-open-workspace{font-size:0!important;width:42px!important;padding:0!important}.boostr-open-workspace:after{content:"WS";font-size:10px}}';
  document.head.appendChild(style);

  honorRequestedWorkspace();
  enhance();
  new MutationObserver(enhance).observe(document.body, { childList: true, subtree: true });
})();
