(() => {
  const path = location.pathname.replace(/\/+$/, '');
  if (path !== '/app/janko' || window.__JANKO_STRIPE_SETTINGS__) return;
  window.__JANKO_STRIPE_SETTINGS__ = true;

  const headers = () => {
    const token = localStorage.getItem('boostr_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  function notify(message, bad = false) {
    let toast = document.getElementById('jankoStripeToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'jankoStripeToast';
      toast.style.cssText = 'position:fixed;z-index:10050;left:50%;top:18px;transform:translateX(-50%) translateY(-20px);opacity:0;transition:.22s;padding:12px 16px;border-radius:999px;font:900 12px Inter,Arial,sans-serif;box-shadow:0 18px 70px rgba(0,0,0,.45)';
      document.body.appendChild(toast);
    }
    toast.style.background = bad ? '#ff9292' : '#f7f5ef';
    toast.style.color = '#030405';
    toast.textContent = message;
    requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(0)'; });
    clearTimeout(notify.t);
    notify.t = setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(-20px)'; }, 2200);
  }

  function showSettings() {
    const main = document.querySelector('.main');
    const section = document.getElementById('jankoStripeSettings');
    const button = document.getElementById('stripeSettingsNav');
    if (!main || !section || !button) return;
    document.querySelectorAll('#modeNav button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    main.querySelectorAll(':scope > section').forEach((item) => { item.style.display = item === section ? '' : 'none'; });
    loadSettings();
  }

  function ensureNav() {
    const nav = document.getElementById('modeNav');
    if (!nav || document.getElementById('stripeSettingsNav')) return;
    const button = document.createElement('button');
    button.id = 'stripeSettingsNav';
    button.type = 'button';
    button.textContent = 'Settings';
    button.onclick = showSettings;
    nav.appendChild(button);
  }

  function buildPanel() {
    const main = document.querySelector('.main');
    if (!main) return;

    let section = document.getElementById('jankoStripeSettings');
    if (!section) {
      section = document.createElement('section');
      section.id = 'jankoStripeSettings';
      section.className = 'section glass';
      section.style.display = 'none';
      section.innerHTML = `
        <div class="section-head">
          <div><span class="kicker">SETTINGS · PAYMENTS</span><h2>Stripe</h2></div>
          <span class="pill status" id="stripeStatus">Cargando...</span>
        </div>
        <div style="display:grid;gap:12px;max-width:760px">
          <label style="display:grid;gap:7px"><span class="label">Publishable key</span><input id="stripePublishable" autocomplete="off" spellcheck="false" placeholder="pk_test_... o pk_live_..." style="min-height:50px;border:1px solid var(--line);background:rgba(0,0,0,.28);color:var(--ink);border-radius:16px;padding:0 14px"></label>
          <label style="display:grid;gap:7px"><span class="label">Secret / restricted key</span><input id="stripeSecret" type="password" autocomplete="new-password" spellcheck="false" placeholder="sk_... o rk_..." style="min-height:50px;border:1px solid var(--line);background:rgba(0,0,0,.28);color:var(--ink);border-radius:16px;padding:0 14px"></label>
          <div id="stripeSecretState" style="color:var(--muted);font-size:12px;line-height:1.5">La clave privada nunca vuelve al navegador después de guardarse.</div>
          <label style="display:grid;gap:7px"><span class="label">Webhook signing secret</span><input id="stripeWebhookSecret" type="password" autocomplete="new-password" spellcheck="false" placeholder="whsec_..." style="min-height:50px;border:1px solid var(--line);background:rgba(0,0,0,.28);color:var(--ink);border-radius:16px;padding:0 14px"></label>
          <div id="stripeWebhookState" style="color:var(--muted);font-size:12px;line-height:1.5">Pega aquí el signing secret generado por Stripe para el endpoint de BOOSTR.</div>
          <div style="display:flex;gap:9px;flex-wrap:wrap">
            <button id="saveStripeSettings" style="min-height:48px;border:1px solid rgba(124,236,255,.45);background:rgba(124,236,255,.12);color:var(--ink);border-radius:999px;padding:0 17px;font-weight:950;cursor:pointer">Guardar credenciales</button>
            <button id="deleteStripeSettings" style="min-height:48px;border:1px solid rgba(255,146,146,.3);background:rgba(255,146,146,.07);color:var(--red);border-radius:999px;padding:0 17px;font-weight:950;cursor:pointer">Eliminar credenciales</button>
          </div>
          <p style="margin:0;color:var(--muted);font-size:11px;line-height:1.5">Las claves privadas y el webhook secret se cifran en el backend antes de almacenarse. GitHub y el navegador no reciben los valores completos después del guardado.</p>
        </div>`;
      main.appendChild(section);
      document.getElementById('saveStripeSettings').onclick = saveSettings;
      document.getElementById('deleteStripeSettings').onclick = deleteSettings;
    }

    ensureNav();
  }

  async function loadSettings() {
    const status = document.getElementById('stripeStatus');
    try {
      const response = await fetch('/api/founder-settings/stripe', { headers: headers(), credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) throw data;
      document.getElementById('stripePublishable').value = data.stripe?.publishable_key || '';
      document.getElementById('stripeSecret').value = '';
      document.getElementById('stripeWebhookSecret').value = '';
      document.getElementById('stripeSecretState').textContent = data.stripe?.secret_configured
        ? `Configurada: ${data.stripe.secret_mask}`
        : 'La clave privada todavía no está configurada.';
      document.getElementById('stripeWebhookState').textContent = data.stripe?.webhook_secret_configured
        ? `Configurado: ${data.stripe.webhook_secret_mask}`
        : 'El webhook signing secret todavía no está configurado.';
      const complete = data.stripe?.secret_configured && data.stripe?.webhook_secret_configured;
      status.textContent = complete ? 'CONFIGURADO' : data.stripe?.secret_configured ? 'FALTA WEBHOOK' : 'PENDIENTE';
      status.style.color = complete ? 'var(--green)' : 'var(--gold)';
    } catch (error) {
      status.textContent = 'ERROR';
      status.style.color = 'var(--red)';
      notify(error?.message || error?.error || 'No se pudo cargar Stripe', true);
    }
  }

  async function saveSettings() {
    const button = document.getElementById('saveStripeSettings');
    const publishableKey = document.getElementById('stripePublishable').value.trim();
    const secretKey = document.getElementById('stripeSecret').value.trim();
    const webhookSecret = document.getElementById('stripeWebhookSecret').value.trim();
    button.disabled = true;
    try {
      const response = await fetch('/api/founder-settings/stripe', {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ publishable_key: publishableKey, secret_key: secretKey, webhook_secret: webhookSecret })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) throw data;
      notify('Credenciales guardadas');
      await loadSettings();
    } catch (error) {
      notify(error?.message || error?.error || 'No se pudieron guardar', true);
    } finally {
      button.disabled = false;
    }
  }

  async function deleteSettings() {
    if (!confirm('¿Eliminar las credenciales de Stripe guardadas?')) return;
    try {
      const response = await fetch('/api/founder-settings/stripe', { method: 'DELETE', headers: headers(), credentials: 'same-origin' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) throw data;
      notify('Credenciales eliminadas');
      await loadSettings();
    } catch (error) {
      notify(error?.message || error?.error || 'No se pudieron eliminar', true);
    }
  }

  const observer = new MutationObserver(() => {
    buildPanel();
    ensureNav();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  buildPanel();
  setTimeout(buildPanel, 250);
  setTimeout(buildPanel, 1000);
  addEventListener('pagehide', () => observer.disconnect(), { once: true });
})();
