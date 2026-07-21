(() => {
  const deadline = new Date('2026-07-25T18:00:00-04:00').getTime();
  const pad = (value) => String(Math.max(0, value)).padStart(2, '0');

  const updateCountdown = () => {
    const remaining = Math.max(0, deadline - Date.now());
    const values = {
      days: Math.floor(remaining / 86400000),
      hours: Math.floor((remaining % 86400000) / 3600000),
      minutes: Math.floor((remaining % 3600000) / 60000),
      seconds: Math.floor((remaining % 60000) / 1000)
    };
    document.querySelectorAll('[data-raffle-countdown]').forEach((countdown) => {
      Object.entries(values).forEach(([key, value]) => {
        const node = countdown.querySelector(`[data-${key}]`);
        if (node && node.textContent !== pad(value)) node.textContent = pad(value);
      });
      countdown.classList.toggle('ended', remaining === 0);
    });
  };

  const loadParticipants = async () => {
    const containers = document.querySelectorAll('[data-raffle-participants]');
    if (!containers.length) return;
    try {
      const response = await fetch('/api/events/orlando-jul-25/participants', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error('participants_unavailable');

      document.querySelectorAll('[data-raffle-total]').forEach((node) => { node.textContent = String(data.raffle_entries || 0); });
      document.querySelectorAll('[data-raffle-buyers]').forEach((node) => { node.textContent = `${data.confirmed_buyers || 0} compradores`; });
      document.querySelectorAll('[data-raffle-entries]').forEach((node) => { node.textContent = `${data.raffle_entries || 0} participaciones`; });
      containers.forEach((container) => {
        container.replaceChildren();
        if (!data.participants?.length) {
          const empty = document.createElement('p');
          empty.className = 'empty';
          empty.textContent = 'Los primeros participantes aparecerán cuando FUERTE PROMOTIONS confirme sus pagos y entradas.';
          container.append(empty);
          return;
        }
        data.participants.forEach((item) => {
          const row = document.createElement('div');
          row.className = 'participant';
          const name = document.createElement('b');
          const entries = document.createElement('span');
          name.textContent = item.name;
          entries.textContent = `${item.entries} ${item.entries === 1 ? 'PARTICIPACIÓN' : 'PARTICIPACIONES'}`;
          row.append(name, entries);
          container.append(row);
        });
      });
    } catch {
      containers.forEach((container) => { container.innerHTML = '<p class="empty">La lista se actualizará en breve.</p>'; });
    }
  };

  updateCountdown();
  setInterval(updateCountdown, 1000);
  loadParticipants();
  setInterval(loadParticipants, 60000);
})();
