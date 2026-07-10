(() => {
  if (location.pathname.replace(/\/+$/, '') !== '/manager/leads') return;
  const pin = document.getElementById('pin');
  if (pin) {
    pin.type = 'hidden';
    pin.value = '';
    pin.autocomplete = 'off';
    pin.name = 'boostr_manager_pin_disabled';
    pin.setAttribute('aria-hidden', 'true');
  }
  const h1 = document.querySelector('h1');
  if (h1) h1.textContent = 'Audit Inbox → Workspace → Cards.';
  const copy = document.querySelector('h1 + .micro');
  if (copy) copy.textContent = 'Revisa la información capturada por BOOSTR Audit y conviértela en un workspace aprobado.';
  const leadButton = document.getElementById('loadLeads');
  const auditButton = document.getElementById('loadAudit');
  if (leadButton) leadButton.textContent = 'Leads manuales';
  if (auditButton) auditButton.textContent = 'Audits recibidos';
  const status = document.getElementById('status');
  if (status) status.textContent = 'Los resultados usan la sesión BOOSTR y el contexto autorizado.';
  setTimeout(() => {
    if (typeof window.load === 'function') window.load('audit');
    else auditButton?.click();
  }, 80);
})();
