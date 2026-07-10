(() => {
  const API = '/api/hummus-missions';
  const KEY = 'boostr_hummus_creative_missions_v1';
  let syncing = false;
  let timer = null;

  const showGate = (message) => {
    if (document.getElementById('missionAuthGate')) return;
    const gate = document.createElement('div');
    gate.id = 'missionAuthGate';
    gate.innerHTML = `<div class="mission-auth-card"><img src="/assets/logos/boostr-logo-nav.png" alt="BOOSTR Labs"><span>ACCESO PROTEGIDO</span><h2>Entra a tu BOOSTR OS para continuar.</h2><p>${message}</p><a href="/login?next=${encodeURIComponent(location.pathname)}">Abrir acceso BOOSTR</a></div>`;
    document.body.appendChild(gate);
  };

  const postProgress = async (state) => {
    if (syncing) return;
    syncing = true;
    try {
      const response = await fetch(`${API}?progress=1`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'progress', current: state.current || 0, completed: state.completed || [], opened: Boolean(state.opened) })
      });
      if (response.status === 401 || response.status === 403) showGate('Esta misión pertenece al workspace privado de Hummus FL.');
    } finally {
      syncing = false;
    }
  };

  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    if (this === localStorage && key === KEY) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try { postProgress(JSON.parse(value)); } catch {}
      }, 250);
    }
  };

  (async () => {
    try {
      const response = await fetch(`${API}?progress=1`, { cache: 'no-store' });
      if (response.status === 401 || response.status === 403) {
        showGate('Inicia sesión con una cuenta autorizada de BOOSTR Managers.');
        return;
      }
      if (!response.ok) return;
      const data = await response.json();
      const remote = data.progress;
      if (!remote) return;
      const local = JSON.parse(localStorage.getItem(KEY) || '{}');
      const remoteTime = Date.parse(remote.updated_at || 0);
      const localTime = Date.parse(local.updatedAt || 0);
      if (remoteTime > localTime) {
        originalSetItem.call(localStorage, KEY, JSON.stringify({ current: remote.current, completed: remote.completed, opened: remote.opened, updatedAt: remote.updated_at }));
        if (!sessionStorage.getItem('boostr_mission_remote_loaded')) {
          sessionStorage.setItem('boostr_mission_remote_loaded', '1');
          location.reload();
        }
      }
    } catch {}
  })();
})();