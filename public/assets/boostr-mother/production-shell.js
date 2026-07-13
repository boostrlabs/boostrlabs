(() => {
  if (window.__BOOSTR_PRODUCTION_SHELL__) return;
  window.__BOOSTR_PRODUCTION_SHELL__ = true;

  const path = location.pathname.replace(/\/+$/, '') || '/';
  const isPublicAppGateway = path === '/app';
  const isNestedAppSurface = path.startsWith('/app/');
  const internalPrefixes = ['/manager', '/admin', '/partner-dashboard', '/home', '/modules', '/ecosystem', '/hummusfl', '/smart-payment-link'];
  const privatePrefixes = ['/manager', '/admin', '/partner-dashboard'];
  const isInternal = !isPublicAppGateway && (isNestedAppSurface || internalPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)));
  const isPrivate = !isPublicAppGateway && (isNestedAppSurface || privatePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)));
  const isExplicitDemo = path.startsWith('/demo/') || document.documentElement.dataset.demo === 'true';
  if (!isInternal || isExplicitDemo) {
    document.getElementById('boostr-loading-gate')?.remove();
    return;
  }

  const token = localStorage.getItem('boostr_auth_token') || '';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));

  const style = document.createElement('style');
  style.id = 'boostr-production-shell-style';
  style.textContent = `
    body:not([data-boostr-demo-ui="true"]) .boostr-chart-bars,
    body:not([data-boostr-demo-ui="true"]) .boostr-phone-stack,
    body:not([data-boostr-demo-ui="true"]) .boostr-float-card{display:none!important}
    .boostr-production-context{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:99990;display:flex;align-items:center;gap:7px;padding:7px;border:1px solid rgba(255,255,255,.16);background:rgba(5,7,8,.84);backdrop-filter:blur(24px);border-radius:999px;box-shadow:0 18px 70px rgba(0,0,0,.42);max-width:min(94vw,920px)}
    .boostr-production-context button,.boostr-production-context a{border:0;background:rgba(255,255,255,.065);color:#fff;border-radius:999px;min-height:38px;padding:0 12px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-size:11px;font-weight:950;cursor:pointer;white-space:nowrap}
    .boostr-production-context .workspace{max-width:230px;overflow:hidden;text-overflow:ellipsis}.boostr-production-context .identity{color:rgba(255,255,255,.62);max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px}
    .boostr-workspace-modal{position:fixed;inset:0;z-index:100010;display:none;place-items:center;padding:18px;background:rgba(0,0,0,.72);backdrop-filter:blur(22px)}.boostr-workspace-modal.open{display:grid}.boostr-workspace-panel{width:min(540px,94vw);max-height:86dvh;overflow:auto;border:1px solid rgba(255,255,255,.16);background:#0a0d0e;color:#fff;border-radius:28px;padding:16px;box-shadow:0 40px 140px rgba(0,0,0,.7)}.boostr-workspace-panel h2{margin:0 0 6px;font-size:28px}.boostr-workspace-panel p{margin:0 0 14px;color:rgba(255,255,255,.58);font-size:12px}.boostr-workspace-list{display:grid;gap:8px}.boostr-workspace-option{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.045);color:#fff;border-radius:18px;padding:13px;text-align:left;cursor:pointer}.boostr-workspace-option b,.boostr-workspace-option span{display:block}.boostr-workspace-option span{color:rgba(255,255,255,.52);font-size:11px;margin-top:4px}.boostr-workspace-option.active{border-color:rgba(125,255,158,.38);background:rgba(125,255,158,.07)}
    #boostr-loading-gate{transition:opacity .2s}#boostr-loading-gate.done{opacity:0;pointer-events:none}
    @media(max-width:720px){.boostr-production-context{top:auto;bottom:calc(78px + env(safe-area-inset-bottom));max-width:96vw}.boostr-production-context .identity{display:none}.boostr-production-context button,.boostr-production-context a{min-height:42px;padding:0 10px}.boostr-production-context .workspace{max-width:132px}.boostr-production-context .workspace-os{font-size:0;width:42px;padding:0}.boostr-production-context .workspace-os:after{content:'WS';font-size:10px}}
  `;
  document.head.appendChild(style);

  function cleanLegacyDemoDecorations() {
    document.body.dataset.boostrDemoUi = 'false';
    document.querySelectorAll('.boostr-chart-bars,.boostr-phone-stack,.boostr-float-card').forEach((node) => node.remove());
    document.querySelectorAll('[draggable="true"]').forEach((node) => node.setAttribute('draggable', 'false'));
    document.querySelectorAll('.dragging').forEach((node) => node.classList.remove('dragging'));
  }

  function founderDashboard(session) {
    const email = (session?.user?.email || '').toLowerCase();
    if (email === 'janko@boostrlabs.com') return '/app/janko/';
    if (email === 'johanka@boostrlabs.com') return '/app/johanka/';
    return session?.redirect || '/app/workspace/';
  }

  async function switchWorkspace(workspaceId) {
    const response = await fetch('/api/session/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      credentials: 'same-origin',
      body: JSON.stringify({ workspace_id: workspaceId })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw data;
    location.reload();
  }

  function injectWorkspaceModal(session) {
    const existing = document.querySelector('.boostr-workspace-modal');
    if (existing) return existing;
    const modal = document.createElement('div');
    modal.className = 'boostr-workspace-modal';
    modal.setAttribute('data-no-i18n', 'true');
    const activeId = session.active_workspace?.id;
    const options = (session.workspaces || []).map((workspace) => `
      <button class="boostr-workspace-option ${workspace.id === activeId ? 'active' : ''}" data-workspace-id="${esc(workspace.id)}">
        <b>${esc(workspace.name || workspace.slug || 'Workspace')}</b>
        <span>${esc(workspace.role || '')} · ${esc(workspace.type || '')}</span>
      </button>`).join('');
    modal.innerHTML = `<div class="boostr-workspace-panel"><h2>Cambiar workspace</h2><p>El contexto elegido se aplica a Products, Files, Orders y Workspace OS.</p><div class="boostr-workspace-list">${options || '<div>Sin workspaces disponibles.</div>'}</div></div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (event) => { if (event.target === modal) modal.classList.remove('open'); });
    modal.querySelectorAll('[data-workspace-id]').forEach((button) => button.addEventListener('click', async () => {
      button.disabled = true;
      try { await switchWorkspace(button.dataset.workspaceId); }
      catch (error) {
        button.disabled = false;
        alert(error?.message || error?.error || 'No se pudo cambiar el workspace.');
      }
    }));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') modal.classList.remove('open'); });
    return modal;
  }

  function injectContext(session) {
    const excluded = ['/app/workspace', '/app/janko', '/app/johanka', '/app/johanka/cloud'];
    if (excluded.includes(path) || document.querySelector('.boostr-production-context')) return;
    const dashboard = founderDashboard(session);
    const email = session.user?.email || '';
    const active = session.active_workspace?.name || 'Seleccionar workspace';
    const roles = [...new Set([session.role, ...(session.roles || [])].filter(Boolean))];
    const cloud = email.toLowerCase() === 'johanka@boostrlabs.com' ? '/app/johanka/cloud/' : '/app/files/';
    const bar = document.createElement('nav');
    bar.className = 'boostr-production-context';
    bar.setAttribute('data-no-i18n', 'true');
    bar.innerHTML = `
      <button type="button" data-back title="Volver">←</button>
      <a href="/app/" title="Servicios">⌂</a>
      <a href="${dashboard}" title="Mi panel">OS</a>
      <a class="workspace-os" href="/partner-dashboard/" title="Workspace OS">Workspace OS</a>
      <button type="button" class="workspace" data-workspace title="Cambiar workspace">${esc(active)}</button>
      <a href="${cloud}" title="Archivos">▣</a>
      <span class="identity">${esc(session.user?.name || email)} · ${esc(roles.join(' / '))}</span>`;
    document.body.appendChild(bar);
    bar.querySelector('[data-back]').onclick = () => history.length > 1 ? history.back() : location.assign(dashboard);
    const modal = injectWorkspaceModal(session);
    bar.querySelector('[data-workspace]').onclick = () => modal.classList.add('open');
  }

  function makeHomeContextReal(session) {
    if (path !== '/home') return;
    const visual = document.querySelector('.visual-card');
    if (visual) {
      visual.innerHTML = `<div style="height:100%;min-height:320px;display:grid;align-content:center;gap:12px;padding:24px"><div style="font:900 10px ui-monospace,Menlo,monospace;letter-spacing:.14em;color:#7dff9e">ECOSYSTEM LAUNCHER</div><div style="font-size:38px;font-weight:950;letter-spacing:-.06em">${esc(session.user?.name || 'BOOSTR account')}</div><div style="color:rgba(255,255,255,.58)">${esc(session.active_workspace?.name || 'Sin workspace activo')}</div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px"><div style="border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:12px"><small style="color:rgba(255,255,255,.5)">WORKSPACES</small><b style="display:block;font-size:28px">${session.workspaces?.length || 0}</b></div><div style="border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:12px"><small style="color:rgba(255,255,255,.5)">ROLES</small><b style="display:block;font-size:28px">${new Set(session.roles || []).size || 1}</b></div></div><div style="color:rgba(255,255,255,.5);font-size:12px">Este panel es el mapa del ecosistema, no un workspace operativo.</div></div>`;
    }
  }

  function clarifyRoute(session) {
    const workspace = session.active_workspace?.name || 'Sin workspace activo';
    if (path === '/manager') {
      const description = document.querySelector('h1 + .micro');
      if (description) description.textContent = `Control global del ecosistema. Contexto activo: ${workspace}.`;
    }
    if (path === '/app/products') {
      const top = document.querySelector('.greeting strong');
      if (top) top.textContent = `Product OS · ${workspace}`;
    }
    document.querySelectorAll('#workspaceSelect').forEach((select) => {
      if (select.dataset.boostrSwitchBound) return;
      select.dataset.boostrSwitchBound = 'true';
      select.addEventListener('change', () => switchWorkspace(select.value).catch((error) => alert(error?.message || 'No se pudo cambiar el workspace.')));
    });
  }

  function resolveGate() {
    const gate = document.getElementById('boostr-loading-gate');
    if (!gate) return;
    gate.classList.add('done');
    setTimeout(() => gate.remove(), 240);
  }

  async function start() {
    cleanLegacyDemoDecorations();
    try {
      const response = await fetch('/api/session', { headers: authHeaders, credentials: 'same-origin', cache: 'no-store' });
      const session = await response.json().catch(() => ({}));
      if (!response.ok || !session?.ok) throw session;
      window.BOOSTR_SESSION = session;
      injectContext(session);
      makeHomeContextReal(session);
      clarifyRoute(session);
    } catch (error) {
      if (isPrivate && path !== '/login') {
        location.replace(`/login/?next=${encodeURIComponent(location.pathname + location.search)}`);
        return;
      }
      console.warn('BOOSTR session unavailable:', error?.error || error?.message || error);
    } finally {
      resolveGate();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
