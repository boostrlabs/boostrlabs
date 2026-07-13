(() => {
  const path = location.pathname.replace(/\/+$/, '');
  if (path !== '/manager/payment-links' || window.__BOOSTR_PAYMENT_LINKS_HOTFIX__) return;
  window.__BOOSTR_PAYMENT_LINKS_HOTFIX__ = true;

  const $ = (id) => document.getElementById(id);
  const token = () => localStorage.getItem('boostr_auth_token');
  const authHeaders = () => token() ? { Authorization: `Bearer ${token()}` } : {};
  const state = { workspaces: [], workspaceId: '', productType: 'service', saleType: 'purchase_now' };

  function message(text, bad = false) {
    const node = $('msg');
    if (!node) return;
    node.textContent = text;
    node.style.color = bad ? 'var(--red)' : '';
  }

  async function api(path, options = {}) {
    const headers = { ...authHeaders(), ...(options.body ? { 'Content-Type': 'application/json' } : {}) };
    const response = await fetch(path, {
      ...options,
      headers,
      credentials: 'same-origin',
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      const error = new Error(data.message || data.error || `Error ${response.status}`);
      error.data = data;
      throw error;
    }
    return data;
  }

  function activate(groupId, attr, value) {
    const group = $(groupId);
    if (!group) return;
    group.querySelectorAll(`[${attr}]`).forEach((button) => {
      button.classList.toggle('active', button.getAttribute(attr) === value);
    });
  }

  function renderWorkspaces() {
    const grid = $('workspaceGrid');
    if (!grid) return;
    if (!state.workspaces.length) {
      grid.innerHTML = '<div class="empty">Tu sesión no tiene negocios o workspaces asignados.</div>';
      return;
    }
    grid.innerHTML = state.workspaces.map((workspace) => `
      <button class="pick ${workspace.id === state.workspaceId ? 'active' : ''}" type="button" data-workspace="${workspace.id}">
        ${workspace.name || workspace.slug || 'Workspace'}
        <small>${workspace.role || 'miembro'} · ${workspace.type || 'negocio'}</small>
      </button>`).join('');
    grid.querySelectorAll('[data-workspace]').forEach((button) => {
      button.addEventListener('click', async () => {
        state.workspaceId = button.dataset.workspace || '';
        renderWorkspaces();
        await loadLinks();
      });
    });
  }

  async function loadLinks() {
    const records = $('records');
    if (!records) return;
    if (!state.workspaceId) {
      records.innerHTML = '<div class="empty">Selecciona un negocio.</div>';
      return;
    }
    try {
      const data = await api(`/api/payment-links?workspace_id=${encodeURIComponent(state.workspaceId)}`);
      const links = data.payment_links || [];
      const workspace = state.workspaces.find((item) => item.id === state.workspaceId);
      $('recordsSubtitle').textContent = `Ofertas publicadas para ${workspace?.name || 'este negocio'}.`;
      $('count').textContent = `Publicados · ${links.length}`;
      if (!links.length) {
        records.innerHTML = '<div class="empty">Este negocio todavía no tiene productos ni servicios publicados.</div>';
        return;
      }
      records.innerHTML = links.map((link) => {
        const url = `${location.origin}${link.public_url}`;
        return `<article class="record"><h3>${link.title}</h3><p>${((Number(link.amount_cents || 0))/100).toFixed(2)} ${link.currency || 'USD'}</p><div class="url">${url}</div><div class="actions"><a class="btn primary" href="${link.public_url}" target="_blank">Abrir</a></div></article>`;
      }).join('');
    } catch (error) {
      records.innerHTML = `<div class="empty">${error.message}</div>`;
      message(error.message, true);
    }
  }

  async function boot() {
    try {
      const data = await api('/api/workspace-os');
      state.workspaces = data.available_workspaces || [];
      state.workspaceId = data.workspace?.id || state.workspaces[0]?.id || '';
      renderWorkspaces();
      await loadLinks();
      message(state.workspaceId ? 'Listo para publicar' : 'No hay negocios disponibles', !state.workspaceId);
    } catch (error) {
      $('workspaceGrid').innerHTML = '<div class="empty">No se pudieron cargar tus negocios. Vuelve a iniciar sesión.</div>';
      $('records').innerHTML = '<div class="empty">No disponible.</div>';
      message(error.message || 'No se pudo leer tu sesión', true);
    }
  }

  function wireChoices() {
    $('typeGrid')?.querySelectorAll('[data-type]').forEach((button) => {
      button.onclick = () => {
        state.productType = button.dataset.type || 'service';
        activate('typeGrid', 'data-type', state.productType);
      };
    });
    $('saleGrid')?.querySelectorAll('[data-sale]').forEach((button) => {
      button.onclick = () => {
        state.saleType = button.dataset.sale || 'purchase_now';
        activate('saleGrid', 'data-sale', state.saleType);
        $('subscriptionFields')?.classList.toggle('show', state.saleType === 'subscription');
        $('auctionFields')?.classList.toggle('show', state.saleType === 'auction');
        $('bnplNote')?.classList.toggle('show', state.saleType === 'bnpl');
      };
    });
  }

  function wireForm() {
    const form = $('form');
    if (!form) return;
    form.onsubmit = async (event) => {
      event.preventDefault();
      const button = $('publishBtn');
      const title = $('title')?.value.trim() || '';
      const cents = Math.round(Number($('price')?.value) * 100);
      if (!state.workspaceId) return message('Primero selecciona un negocio', true);
      if (!title) return message('Escribe un nombre', true);
      if (!Number.isFinite(cents) || cents < 50) return message('El precio mínimo para la prueba es $0.50', true);
      button.disabled = true;
      button.textContent = 'Publicando...';
      $('success')?.classList.remove('show');
      try {
        const metadata = {
          source: 'quick_publish_mobile_hotfix',
          sale_type: state.saleType,
          subscription_interval: state.saleType === 'subscription' ? $('interval')?.value : null,
          auction_end: state.saleType === 'auction' ? $('auctionEnd')?.value : null
        };
        const productData = await api('/api/products', {
          method: 'POST',
          body: {
            workspace_id: state.workspaceId,
            title,
            description: $('description')?.value.trim() || '',
            product_type: state.productType,
            status: $('publishNow')?.checked ? 'active' : 'draft',
            price_amount: cents,
            currency: $('currency')?.value || 'USD',
            requires_account: state.saleType === 'subscription' ? 1 : 0,
            allow_guest_checkout: state.saleType === 'subscription' ? 0 : ($('allowGuest')?.checked ? 1 : 0),
            metadata
          }
        });
        const linkData = await api('/api/payment-links', {
          method: 'POST',
          body: {
            workspace_id: state.workspaceId,
            product_id: productData.product.id,
            title,
            status: $('publishNow')?.checked ? 'active' : 'draft',
            checkout_mode: state.saleType,
            requires_account: state.saleType === 'subscription' ? 1 : 0,
            allow_guest_checkout: state.saleType === 'subscription' ? 0 : ($('allowGuest')?.checked ? 1 : 0),
            metadata
          }
        });
        const publicUrl = `${location.origin}${linkData.payment_link.public_url}`;
        $('successUrl').textContent = publicUrl;
        $('openSuccess').href = linkData.payment_link.public_url;
        $('copySuccess').onclick = async () => navigator.clipboard.writeText(publicUrl);
        $('success').classList.add('show');
        message('Publicado correctamente');
        await loadLinks();
      } catch (error) {
        message(error.message || 'No se pudo publicar', true);
      } finally {
        button.disabled = false;
        button.textContent = 'Publicar y crear enlace';
      }
    };
  }

  function start() {
    wireChoices();
    wireForm();
    boot();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();