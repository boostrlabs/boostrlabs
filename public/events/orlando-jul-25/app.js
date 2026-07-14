const form = document.querySelector('#reservationForm');
const quantityOutput = document.querySelector('#quantityOutput');
const totalOutput = document.querySelector('#totalOutput');
const statusNode = document.querySelector('#formStatus');
const confirmation = document.querySelector('#confirmation');
const reservationCode = document.querySelector('#reservationCode');
const PRICE = 40;
let quantity = 1;

const updateTotal = () => {
  quantityOutput.textContent = String(quantity);
  totalOutput.textContent = `$${quantity * PRICE}`;
};

document.querySelectorAll('[data-step]').forEach((button) => {
  button.addEventListener('click', () => {
    quantity = Math.min(8, Math.max(1, quantity + Number(button.dataset.step || 0)));
    updateTotal();
  });
});

const makeCode = () => {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ORL25-${suffix}`;
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusNode.textContent = '';

  if (!form.reportValidity()) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const data = new FormData(form);
  const code = makeCode();
  const phone = String(data.get('phone') || '').trim();
  const email = String(data.get('email') || '').trim();
  const name = String(data.get('name') || '').trim();

  submitButton.disabled = true;
  submitButton.textContent = 'GUARDANDO RESERVA…';

  const payload = {
    source: 'smart-event-link-orlando-jul-25',
    contact_name: name,
    contact_phone: phone,
    contact_email: email,
    preferred_contact_method: 'whatsapp',
    business_name: 'Fuerte Promotions BDay Bash',
    industry: 'live-events',
    project_goal: 'ticket-reservation',
    current_status: 'reservation_requested',
    requested_modules: ['smart-links', 'smart-checkout'],
    timeline: 'event-jul-25',
    budget_range: `$${quantity * PRICE}`,
    biggest_problem: 'payment_pending_manual_whatsapp',
    system_outcome: 'complete_ticket_payment_via_whatsapp',
    referral_code: code,
    page_url: window.location.href,
    extra_message: JSON.stringify({
      event: 'Fuerte Promotions BDay Bash',
      headliner: 'ROWMA',
      supporting_artists: ['Gemese', 'Janko Diorr'],
      quantity,
      unit_price: PRICE,
      total: quantity * PRICE,
      venue: 'Blvck Cat Bistro Café',
      address: '9521 S Orange Blossom Trail #104, Orlando, FL 32837',
      doors: '9:00 PM',
      reservation_code: code
    })
  };

  try {
    const response = await fetch('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.message || 'No se pudo guardar la reserva.');

    reservationCode.textContent = code;
    form.hidden = true;
    confirmation.hidden = false;
    confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    statusNode.textContent = error.message || 'Ocurrió un error. Intenta nuevamente.';
    submitButton.disabled = false;
    submitButton.textContent = 'SOLICITAR RESERVA';
  }
});

updateTotal();
