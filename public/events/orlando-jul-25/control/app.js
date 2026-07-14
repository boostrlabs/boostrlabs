const leadsNode = document.querySelector('#leads');
const statusNode = document.querySelector('#status');
const summaryNode = document.querySelector('#summary');
const searchInput = document.querySelector('#search');
const filterInput = document.querySelector('#filter');
const refreshButton = document.querySelector('#refresh');
const logoutButton = document.querySelector('#logout');
const accessPanel = document.querySelector('#accessPanel');
const accessForm = document.querySelector('#accessForm');
const accessStatus = document.querySelector('#accessStatus');
const template = document.querySelector('#leadTemplate');

let session = null;
let debounce;

const labels = {
  total: 'TOTAL',
  new: 'NUEVOS',
  contacted: 'CONTACTADOS',
  payment_sent: 'PAGO ENVIADO',
  paid: 'PAGADOS',
  confirmed: 'CONFIRMADOS',
  cancelled: 'CANCELADOS'
};

const money = (value) => value || '$0';
const safeJson = (value) => {
  try { return JSON.parse(value || '{}'); } catch { return {}; }
};

async function loadSession() {
  const response = await fetch('/api/session', { credentials: 'include' });
  if (response.status === 401) {
    const returnTo = encodeURIComponent(location.pathname);
    location.href = `/login/?return_to=${returnTo}`;
    return false;
  }
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.message || 'No se pudo validar la sesión.');
  session = data;
  const roles = new Set(data.roles || []);
  accessPanel.hidden = !(roles.has('admin') || roles.has('manager'));
  return true;
}

function renderSummary(summary = {}) {
  summaryNode.innerHTML = '';
  ['total', 'new', 'contacted', 'payment_sent', 'paid', 'confirmed'].forEach((key) => {
    const node = document.createElement('div');
    node.innerHTML = `<span>${labels[key]}</span><strong>${summary[key] || 0}</strong>`;
    summaryNode.appendChild(node);
  });
}

function whatsappLink(phone, lead) {
  const raw = String(phone || '').replace(/\D/g, '');
  const text = encodeURIComponent(`Hola ${lead.contact_name || ''}, te escribimos por tu solicitud de preventa para ROWMA en Orlando. Referencia: ${lead.reference || 'sin referencia'}.`);
  return raw ? `https://wa.me/${raw}?text=${text}` : '#';
}

function renderLeads(rows = []) {
  leadsNode.innerHTML = '';
  if (!rows.length) {
    statusNode.textContent = 'No hay leads con esos filtros.';
    return;
  }
  statusNode.textContent = `${rows.length} lead${rows.length === 1 ? '' : 's'} encontrados`;

  rows.forEach((lead) => {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector('.lead-card');
    const metadata = lead.metadata || {};
    const eventData = safeJson(metadata.extra_message);
    fragment.querySelector('.reference').textContent = lead.reference || eventData.reservation_code || 'SIN REFERENCIA';
    fragment.querySelector('.name').textContent = lead.contact_name || 'Sin nombre';
    fragment.querySelector('.total').textContent = money(lead.budget_range || (eventData.total ? `$${eventData.total}` : '$40'));
    fragment.querySelector('.contact').innerHTML = `
      <a href="tel:${lead.contact_phone || ''}">${lead.contact_phone || 'Sin teléfono'}</a>
      ${lead.contact_email ? `<a href="mailto:${lead.contact_email}">${lead.contact_email}</a>` : ''}
    `;
    fragment.querySelector('.meta').textContent = `${eventData.quantity || lead.quantity || 1} entrada(s) · ${new Date(lead.created_at).toLocaleString('es-US')}`;

    const select = fragment.querySelector('.lead-status');
    select.value = lead.status || 'new';
    select.addEventListener('change', async () => {
      select.disabled = true;
      try {
        const response = await fetch(`/api/events/orlando-jul-25/leads/${lead.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: select.value })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.message || 'No se pudo actualizar el lead.');
        card.dataset.status = select.value;
        await loadLeads();
      } catch (error) {
        alert(error.message);
        select.value = lead.status || 'new';
      } finally {
        select.disabled = false;
      }
    });

    const wa = fragment.querySelector('.whatsapp');
    wa.href = whatsappLink(lead.contact_phone, lead);
    if (!lead.contact_phone) wa.setAttribute('aria-disabled', 'true');
    leadsNode.appendChild(fragment);
  });
}

async function loadLeads() {
  statusNode.textContent = 'Cargando leads…';
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set('q', searchInput.value.trim());
  if (filterInput.value) params.set('status', filterInput.value);
  const response = await fetch(`/api/events/orlando-jul-25/leads?${params}`, { credentials: 'include' });
  if (response.status === 401) return loadSession();
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.message || 'No se pudieron cargar los leads.');
  renderSummary(data.summary);
  renderLeads(data.rows);
}

searchInput.addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => loadLeads().catch(showError), 300);
});
filterInput.addEventListener('change', () => loadLeads().catch(showError));
refreshButton.addEventListener('click', () => loadLeads().catch(showError));
logoutButton.addEventListener('click', async () => {
  await fetch('/api/session', { method: 'DELETE', credentials: 'include' });
  location.href = '/login/';
});

accessForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  accessStatus.textContent = 'Activando acceso…';
  const payload = Object.fromEntries(new FormData(accessForm).entries());
  try {
    const response = await fetch('/api/events/orlando-jul-25/access', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.message || 'No se pudo activar el acceso.');
    accessStatus.textContent = `Acceso activo para ${data.user.username}. Dashboard: ${data.dashboard}`;
    accessForm.querySelector('[name=password]').value = '';
  } catch (error) {
    accessStatus.textContent = error.message;
  }
});

function showError(error) {
  statusNode.textContent = error.message || 'Ocurrió un error.';
}

(async () => {
  try {
    if (await loadSession()) await loadLeads();
  } catch (error) {
    showError(error);
  }
})();
