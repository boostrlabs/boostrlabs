(() => {
  const token = localStorage.getItem('boostr_auth_token') || '';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  function disableWrongAutofill(root = document) {
    root.querySelectorAll('input, textarea, select').forEach((field) => {
      if (field.closest('#loginForm, #form, [data-auth-form]')) return;
      const current = (field.getAttribute('autocomplete') || '').toLowerCase();
      if (!current || current === 'on') field.setAttribute('autocomplete', 'off');
      if (!field.name) field.name = `boostr_field_${Math.random().toString(36).slice(2)}`;
    });
  }

  function dashboardFor(session) {
    if (session?.redirect) return session.redirect;
    const email = (session?.user?.email || '').toLowerCase();
    if (email === 'janko@boostrlabs.com') return '/demo/janko-os/?v=0.7.2';
    if (email === 'johanka@boostrlabs.com') return '/app/82ngel/?v=0.7.2';
    if ((session?.roles || []).includes('admin')) return '/admin/';
    if ((session?.roles || []).includes('manager')) return '/manager/';
    if ((session?.roles || []).includes('partner')) return '/partner-dashboard/';
    return '/app/';
  }

  function paintSession(session) {
    const dashboard = dashboardFor(session);
    document.documentElement.dataset.session = 'active';

    document.querySelectorAll('a[href="/login"],a[href="/login/"],a[href="/signup"],a[href="/signup/"]').forEach((link) => {
      if (link.closest('[data-keep-auth-link]')) return;
      const title = (link.getAttribute('title') || '').toLowerCase();
      if (title.includes('login') || title.includes('signup') || link.matches('.role-pill,.switch-card,.plus')) {
        link.href = dashboard;
        if (link.matches('.plus')) link.textContent = '↗';
      } else {
        link.hidden = true;
      }
    });

    document.querySelectorAll('.role-pill').forEach((pill) => {
      pill.href = dashboard;
      const label = pill.querySelector('b');
      const micro = pill.querySelector('.micro');
      if (label) label.textContent = session.user?.name || session.username || session.user?.email || 'Cuenta BOOSTR';
      if (micro) micro.textContent = [session.active_workspace?.name, session.role].filter(Boolean).join(' · ') || 'Sesión activa';
    });

    document.querySelectorAll('[data-session-only]').forEach((node) => { node.hidden = false; });
    document.querySelectorAll('[data-guest-only]').forEach((node) => { node.hidden = true; });

    window.BOOSTR_SESSION = session;
    window.BOOSTR_DASHBOARD = dashboard;
    document.dispatchEvent(new CustomEvent('boostrSessionReady', { detail: session }));
  }

  function paintGuest() {
    document.documentElement.dataset.session = 'guest';
    document.querySelectorAll('[data-session-only]').forEach((node) => { node.hidden = true; });
    document.querySelectorAll('[data-guest-only]').forEach((node) => { node.hidden = false; });
    document.dispatchEvent(new CustomEvent('boostrSessionMissing'));
  }

  async function loadSession() {
    disableWrongAutofill();
    try {
      const response = await fetch('/api/session', {
        headers: authHeaders,
        credentials: 'same-origin',
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('no_session');
      const session = await response.json();
      if (!session?.ok) throw new Error('no_session');
      localStorage.setItem('boostr_session', JSON.stringify({
        email: session.user?.email,
        username: session.username || session.user?.name,
        role: session.role,
        workspace: session.active_workspace?.name,
        redirect: session.redirect,
        createdAt: new Date().toISOString()
      }));
      paintSession(session);
    } catch {
      paintGuest();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadSession, { once: true });
  else loadSession();
})();
