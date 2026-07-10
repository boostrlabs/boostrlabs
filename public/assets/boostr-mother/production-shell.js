(() => {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const isExplicitDemo = path.startsWith('/demo/') || document.documentElement.dataset.demo === 'true';
  const token = localStorage.getItem('boostr_auth_token') || '';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const privatePrefixes = ['/app', '/manager', '/admin', '/partner-dashboard'];
  const isPrivate = privatePrefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'));

  const style = document.createElement('style');
  style.textContent = `
    body:not([data-boostr-demo-ui="true"]) .module,
    body:not([data-boostr-demo-ui="true"]) .metric,
    body:not([data-boostr-demo-ui="true"]) .task,
    body:not([data-boostr-demo-ui="true"]) .switch-card,
    body:not([data-boostr-demo-ui="true"]) .contract-card,
    body:not([data-boostr-demo-ui="true"]) .system-tile,
    body:not([data-boostr-demo-ui="true"]) .flow-row,
    body:not([data-boostr-demo-ui="true"]) .role-card,
    body:not([data-boostr-demo-ui="true"]) .signal,
    body:not([data-boostr-demo-ui="true"]) .stat,
    body:not([data-boostr-demo-ui="true"]) .item,
    body:not([data-boostr-demo-ui="true"]) .insight,
    body:not([data-boostr-demo-ui="true"]) .smart-block,
    body:not([data-boostr-demo-ui="true"]) .card.glass{animation:none!important}
    .boostr-production-context{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:99990;display:flex;align-items:center;gap:7px;padding:7px;border:1px solid rgba(255,255,255,.16);background:rgba(5,7,8,.82);backdrop-filter:blur(24px);border-radius:999px;box-shadow:0 18px 70px rgba(0,0,0,.42);max-width:min(92vw,850px)}
    .boostr-production-context button,.boostr-production-context a{border:0;background:rgba(255,255,255,.065);color:#fff;border-radius:999px;min-height:38px;padding:0 12px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-size:11px;font-weight:950;cursor:pointer;white-space:nowrap}
    .boostr-production-context .workspace{max-width:240px;overflow:hidden;text-overflow:ellipsis}.boostr-production-context .identity{color:rgba(255,255,255,.62);max-width:180px;overflow:hidden;text-overflow:ellipsis}
    .boostr-workspace-modal{position:fixed;inset:0;z-index:100010;display:none;place-items:center;padding:18px;background:rgba(0,0,0,.72);backdrop-filter:blur(22px)}.boostr-workspace-modal.open{display:grid}.boostr-workspace-panel{width:min(520px,94vw);border:1px solid rgba(255,255,255,.16);background:#0a0d0e;color:#fff;border-radius:28px;padding:16px;box-shadow:0 40px 140px rgba(0,0,0,.7)}.boostr-workspace-panel h2{margin:0 0 6px;font-size:28px}.boostr-workspace-panel p{margin:0 0 14px;color:rgba(255,255,255,.58);font-size:12px}.boostr-workspace-list{display:grid;gap:8px}.boostr-workspace-option{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.045);color:#fff;border-radius:18px;padding:13px;text-align:left;cursor:pointer}.boostr-workspace-option b,.boostr-workspace-option span{display:block}.boostr-workspace-option span{color:rgba(255,255,255,.52);font-size:11px;margin-top:4px}.boostr-workspace-option.active{border-color:rgba(125,255,158,.38);background:rgba(125,255,158,.07)}
    #boostr-loading-gate{position:fixed;inset:0;z-index:100020;display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,rgba(125,255,158,.08),transparent 34%),#050708;color:#fff;font:900 13px ui-monospace,Menlo,monospace;letter-spacing:.13em;text-transform:uppercase;transition:opacity .2s}#boostr-loading-gate.done{opacity:0;pointer-events:none}
    @media(max-width:720px){.boostr-production-context{top:auto;bottom:calc(78px + env(safe-area-inset-bottom));max-width:94vw}.boostr-production-context .identity{display:none}.boostr-production-context button,.boostr-production-context a{min-height:42px;padding:0 11px}.boostr-production-context .workspace{max-width:150px}}
  `;
  document.head.appendChild(style);

  function cleanLegacyDemoDecorations() {
    if (isExplicitDemo) {
      document.body.dataset.boostrDemoUi = 'true';
      return;
    }
    document.body.dataset.boostrDemoUi = 'false';
    document.querySelectorAll('.boostr-chart-bars,.boostr-phone-stack,.boostr-float-card').forEach(node => node.remove());
    document.querySelectorAll('[draggable="true"]').forEach(node => node.setAttribute('draggable', 'false'));
    document.querySelectorAll('.dragging').forEach(node => node.classList.remove('dragging'));
  }

  function founderDashboard(session) {
    const email = (session?.user?.email || '').toLowerCase();
    if (email === 'janko@boostrlabs.com') return '/app/janko/';
    if (email === 'johanka@boostrlabs.com') return '/app/johanka/';
    return session?.redirect || '/app/';
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
    let modal = document.querySelector('.boostr-workspace-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'boostr-workspace-modal';
    modal.setAttribute('data-no-i18n', 'true');
    const activeId = session.active_workspace?.id;
    modal.innerHTML = `<div class="boostr-workspace-panel"><h2>Cambiar workspace</h2><p>Todo lo que abras después usará este contexto.</p><div class="boostr-workspace-list">${(session.workspaces || []).map(w => `<button class="boostr-workspace-option ${w.id === activeId ? 'active' : ''}" data-workspace-id="${w.id}"><b>${w.name || w.slug || 'Workspace'}</b><span>${w.role || ''} · ${w.type || ''}</span></button>`).join('') || '<div>Sin workspaces disponibles.</div>'}</div></div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', event => { if (event.target === modal) modal.classList.remove('open'); });
    modal.querySelectorAll('[data-workspace-id]').forEach(button => button.addEventListener('click', async () => {
      button.disabled = true;
      try { await switchWorkspace(button.dataset.workspaceId); }
      catch (error) { button.disabled = false; alert(error?.message || error?.error || 'No se pudo cambiar el workspace.'); }
    }));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') modal.classList.remove('open'); });
    return modal;
  }

  function injectContext(session) {
    if (isExplicitDemo || path === '/login' || path.startsWith('/audit') || path.startsWith('/jankodiorr') || path.startsWith('/82ngel')) return;
    if (document.querySelector('.boostr-production-context')) return;
    const dashboard = founderDashboard(session);
    const email = session.user?.email || '';
    const active = session.active_workspace?.name || 'Sin workspace';
    const roles = [...new Set([session.role, ...(session.roles || [])].filter(Boolean))];
    const cloud = email.toLowerCase() === 'johanka@boostrlabs.com' ? '/app/johanka/cloud/' : '/app/files/';
    const bar = document.createElement('nav');
    bar.className = 'boostr-production-context';
    bar.setAttribute('data-no-i18n', 'true');
    bar.innerHTML = `<button type="button" data-back title="Volver">←</button><a href="/home/" title="BOOSTR CORE">⌂</a><a href="${dashboard}" title="Mi Custom OS">OS</a><button type="button" class="workspace" data-workspace>${active}</button><a href="${cloud}" title="Archivos">▣</a><span class="identity">${session.user?.name || email} · ${roles.join(' / ')}</span>`;
    document.body.appendChild(bar);
    bar.querySelector('[data-back]').onclick = () => history.length > 1 ? history.back() : location.assign(dashboard);
    const modal = injectWorkspaceModal(session);
    bar.querySelector('[data-workspace]').onclick = () => modal.classList.add('open');
  }

  function makeHomeContextReal(session) {
    if (path !== '/home' && path !== '/') return;
    const visual = document.querySelector('.visual-card');
    if (visual) {
      visual.innerHTML = `<div style="height:100%;min-height:320px;display:grid;align-content:center;gap:12px;padding:24px"><div style="font:900 10px ui-monospace,Menlo,monospace;letter-spacing:.14em;color:#7dff9e">ECOSYSTEM LAUNCHER</div><div style="font-size:38px;font-weight:950;letter-spacing:-.06em">${session.user?.name || 'BOOSTR account'}</div><div style="color:rgba(255,255,255,.58)">${session.active_workspace?.name || 'Sin workspace activo'}</div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px"><div style="border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:12px"><small style="color:rgba(255,255,255,.5)">WORKSPACES</small><b style="display:block;font-size:28px">${session.workspaces?.length || 0}</b></div><div style="border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:12px"><small style="color:rgba(255,255,255,.5)">ROLES</small><b style="display:block;font-size:28px">${new Set(session.roles || []).size || 1}</b></div></div><div style="color:rgba(255,255,255,.5);font-size:12px">Este panel no es un workspace. Es el mapa para entrar al OS y al módulo correcto.</div></div>`;
    }
    const hero = document.querySelector('.hero-copy h1');
    if (hero) hero.textContent = 'BOOSTR CORE · mapa del ecosistema.';
    const desc = document.querySelector('.hero-copy p');
    if (desc) desc.textContent = 'Desde aquí eliges tu Custom OS, workspace o módulo. Los datos operativos viven dentro del contexto seleccionado.';
  }

  function clarifyRoute(session) {
    const workspace = session.active_workspace?.name || 'Sin workspace activo';
    if (path === '/manager') {
      document.querySelector('h1')?.replaceChildren(document.createTextNode('Opera leads, workspaces y módulos.'));
      const desc = document.querySelector('h1 + .micro');
      if (desc) desc.textContent = `BOOSTR Manager trabaja sobre el workspace activo: ${workspace}. Cambia el contexto desde la barra flotante.`;
    }
    if (path === '/manager/leads') {
      const h1 = document.querySelector('h1');
      if (h1) h1.textContent = 'Audit Inbox → Workspaces → Cards.';
      const search = document.querySelector('.search');
      if (search && !search.querySelector('input')) search.textContent = `Leads del sistema · contexto: ${workspace}`;
    }
    if (path === '/app/products') {
      const top = document.querySelector('.greeting strong');
      if (top) top.textContent = `Product OS · ${workspace}`;
      const heading = document.querySelector('.section-head h2');
      if (heading && /products/i.test(heading.textContent)) heading.textContent = `Productos de ${workspace}`;
    }
    if (path === '/partner-dashboard') {
      document.querySelectorAll('*').forEach(node => {
        if (node.childNodes.length === 1 && node.firstChild?.nodeType === Node.TEXT_NODE && /manager preview/i.test(node.textContent || '')) node.textContent = session.user?.name || 'Cuenta BOOSTR';
      });
    }
    if (path === '/app/johanka') {
      document.querySelectorAll('a[href="/app/files"],a[href="/app/files/"]').forEach(link => { link.href = '/app/johanka/cloud/'; if (/asset/i.test(link.textContent || '')) link.textContent = 'Abrir mi nube'; });
    }
    document.querySelectorAll('#workspaceSelect').forEach(select => {
      if (select.dataset.boostrSwitchBound) return;
      select.dataset.boostrSwitchBound = 'true';
      select.addEventListener('change', () => switchWorkspace(select.value).catch(error => alert(error?.message || 'No se pudo cambiar el workspace.')));
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
    if (isExplicitDemo) { resolveGate(); return; }
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
    } finally {
      resolveGate();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
