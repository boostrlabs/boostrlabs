(() => {
  const PRICE = 40;
  const MAX_TICKETS = 8;
  const form = document.querySelector('#presaleForm');
  const confirmation = document.querySelector('#confirmation');
  const quantityOutput = document.querySelector('#quantityOutput');
  const totalOutput = document.querySelector('#totalOutput');
  const reviewQuantity = document.querySelector('#reviewQuantity');
  const reviewTotal = document.querySelector('#reviewTotal');
  const reviewContact = document.querySelector('#reviewContact');
  const statusNode = document.querySelector('#formStatus');
  const mobileBar = document.querySelector('.mobile-presale-bar');
  let quantity = 1;
  let currentStep = 1;

  const money = (amount) => `$${amount}`;

  const updateSummary = () => {
    const total = quantity * PRICE;
    quantityOutput.textContent = String(quantity);
    totalOutput.textContent = money(total);
    reviewQuantity.textContent = String(quantity);
    reviewTotal.textContent = money(total);
  };

  const showStep = (step) => {
    currentStep = step;
    document.querySelectorAll('[data-step-panel]').forEach((panel) => {
      const isActive = Number(panel.dataset.stepPanel) === step;
      panel.hidden = !isActive;
      panel.classList.toggle('active', isActive);
    });
    document.querySelectorAll('[data-progress]').forEach((node) => {
      node.classList.toggle('active', Number(node.dataset.progress) <= step);
    });
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const validateContactStep = () => {
    const fields = form.querySelectorAll('[data-step-panel="2"] input[required]');
    for (const field of fields) {
      if (!field.reportValidity()) return false;
    }
    reviewContact.textContent = String(new FormData(form).get('phone') || '—').trim();
    return true;
  };

  document.querySelectorAll('[data-quantity]').forEach((button) => {
    button.addEventListener('click', () => {
      quantity = Math.min(MAX_TICKETS, Math.max(1, quantity + Number(button.dataset.quantity || 0)));
      updateSummary();
    });
  });

  document.querySelectorAll('[data-next]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = Number(button.dataset.next);
      if (currentStep === 2 && !validateContactStep()) return;
      showStep(target);
    });
  });

  document.querySelectorAll('[data-back]').forEach((button) => {
    button.addEventListener('click', () => showStep(Number(button.dataset.back)));
  });

  const makeCode = () => {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `PRE25-${suffix}`;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusNode.textContent = '';
    if (!validateContactStep() || !form.reportValidity()) return;

    const submitButton = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    const code = makeCode();
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const email = String(data.get('email') || '').trim();
    const total = quantity * PRICE;

    submitButton.disabled = true;
    submitButton.textContent = 'REGISTRANDO PREVENTA…';

    const payload = {
      source: 'boostr-event-os-rowma-orlando-presale',
      contact_name: name,
      contact_phone: phone,
      contact_email: email,
      preferred_contact_method: 'whatsapp',
      business_name: 'Fuerte Promotions BDay Bash',
      industry: 'live-events',
      project_goal: 'event-presale',
      current_status: 'presale_requested',
      requested_modules: ['smart-links', 'smart-checkout', 'event-os'],
      timeline: '2026-07-25',
      budget_range: money(total),
      biggest_problem: 'payment_instructions_pending',
      system_outcome: 'send_payment_information_and_confirm_tickets',
      referral_code: code,
      page_url: window.location.href,
      extra_message: JSON.stringify({
        product: 'BOOSTR Event OS',
        event: 'Fuerte Promotions BDay Bash',
        headliner: 'ROWMA',
        supporting_artists: ['GEMESE', 'Janko Diorr'],
        event_date: '2026-07-25',
        doors: '9:00 PM',
        venue: 'Blvck Cat Bistro Café',
        address: '9521 S Orange Blossom Trail #104, Orlando, FL 32837',
        quantity,
        unit_price: PRICE,
        total,
        presale_reference: code,
        next_action: 'Send payment information by WhatsApp and confirm tickets after payment.'
      })
    };

    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'No se pudo registrar la preventa.');
      }

      document.querySelector('#presaleCode').textContent = code;
      document.querySelector('#confirmationQuantity').textContent = String(quantity);
      document.querySelector('#confirmationTotal').textContent = money(total);
      form.hidden = true;
      document.querySelector('.form-progress').hidden = true;
      confirmation.hidden = false;
      confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
      mobileBar?.classList.add('hidden');
    } catch (error) {
      statusNode.textContent = error instanceof Error ? error.message : 'No se pudo registrar la preventa.';
      submitButton.disabled = false;
      submitButton.textContent = 'ENVIAR SOLICITUD DE PREVENTA';
    }
  });

  const presaleSection = document.querySelector('#preventa');
  if ('IntersectionObserver' in window && presaleSection && mobileBar) {
    const observer = new IntersectionObserver(([entry]) => {
      mobileBar.classList.toggle('hidden', entry.isIntersecting);
    }, { threshold: 0.12 });
    observer.observe(presaleSection);
  }

  updateSummary();
})();
