(() => {
  const UNIT_PRICE = 40;
  const REGULAR_PRICE = 50;
  const form = document.querySelector('#presaleForm');
  const quantity = document.querySelector('#quantity');
  const totalOutput = document.querySelector('#totalOutput');
  const regularTotal = document.querySelector('#regularTotal');
  const statusNode = document.querySelector('#formStatus');
  const confirmation = document.querySelector('#confirmation');

  const money = (value) => `$${Number(value).toFixed(0)}`;
  const makeCode = () => {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    return `ROW-${[...bytes].map((value) => value.toString(16).padStart(2, '0')).join('').slice(0, 6).toUpperCase()}`;
  };

  const updateTotal = () => {
    const count = Math.min(Math.max(Number(quantity.value || 1), 1), 8);
    totalOutput.textContent = money(count * UNIT_PRICE);
    regularTotal.textContent = money(count * REGULAR_PRICE);
  };

  quantity.addEventListener('change', updateTotal);
  updateTotal();

  document.querySelector('#share')?.addEventListener('click', async () => {
    const shareData = {
      title: 'ROWMA Live in Orlando · Preventa + Sorteo NNE',
      text: '20% OFF: entradas a $40. Cada entrada confirmada participa por una producción completa NNE / WESTDETRO.',
      url: window.location.href
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        document.querySelector('#share').textContent = 'LINK COPIADO';
      }
    } catch {}
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusNode.textContent = '';
    if (!form.reportValidity()) return;

    const submitButton = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    const ticketCount = Math.min(Math.max(Number(data.get('quantity') || 1), 1), 8);
    const reference = makeCode();
    const total = ticketCount * UNIT_PRICE;
    const pageUrl = window.location.href;

    submitButton.disabled = true;
    submitButton.textContent = 'REGISTRANDO…';

    const payload = {
      source: 'boostr-event-os-orlando-jul-25',
      contact_name: String(data.get('name') || '').trim(),
      contact_phone: String(data.get('phone') || '').trim(),
      contact_email: String(data.get('email') || '').trim(),
      preferred_contact_method: 'whatsapp',
      business_name: 'ROWMA Orlando Presale',
      industry: 'live_event',
      project_goal: 'Pre-sale ticket request + NNE / WESTDETRO production raffle',
      current_status: 'pending_payment',
      timeline: '2026-07-25',
      budget_range: money(total),
      referral_code: reference,
      page_url: pageUrl,
      extra_message: JSON.stringify({
        quantity: ticketCount,
        regular_unit_price: REGULAR_PRICE,
        discount_percent: 20,
        unit_price: UNIT_PRICE,
        total,
        note: String(data.get('note') || '').trim(),
        presale_reference: reference,
        event: 'ROWMA Live in Orlando',
        venue: 'Blvck Cat Bistro Café',
        raffle: 'NNE / WESTDETRO complete production',
        raffle_entries: ticketCount
      })
    };

    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'No se pudo registrar la preventa.');

      document.querySelector('#presaleCode').textContent = reference;
      document.querySelector('#confirmationQuantity').textContent = String(ticketCount);
      document.querySelector('#confirmationTotal').textContent = money(total);
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.querySelector('.mobile-cta')?.remove();
    } catch (error) {
      statusNode.textContent = error instanceof Error ? error.message : 'No se pudo registrar la preventa.';
      submitButton.disabled = false;
      submitButton.textContent = 'ENVIAR SOLICITUD';
    }
  });
})();
