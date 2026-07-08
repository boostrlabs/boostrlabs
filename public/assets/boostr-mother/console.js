(() => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes boostrFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes boostrGlow{0%,100%{box-shadow:var(--shadow)}50%{box-shadow:0 34px 120px rgba(111,140,255,.18),0 0 42px rgba(246,228,189,.11)}}
    .module,.metric,.task,.switch-card,.contract-card,.system-tile,.flow-row,.role-card,.signal,.stat,.item,.insight,.smart-block{position:relative;cursor:grab;animation:boostrFloat 7s ease-in-out infinite;animation-delay:calc(var(--float-i,0)*.28s);transition:transform .22s ease,border-color .22s ease,filter .22s ease}
    .module:hover,.metric:hover,.task:hover,.switch-card:hover,.contract-card:hover,.system-tile:hover,.flow-row:hover,.role-card:hover,.signal:hover,.stat:hover,.item:hover,.insight:hover,.smart-block:hover{transform:translateY(-10px) scale(1.014);border-color:rgba(246,228,189,.35);filter:brightness(1.1)}
    .dragging{opacity:.5;cursor:grabbing}.card.glass{animation:boostrGlow 9s ease-in-out infinite}.micro{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.footer{text-transform:uppercase;letter-spacing:.08em}.footer strong{color:var(--champagne,#f6e4bd)}
    .booster-search-input{width:100%;height:100%;border:0;outline:0;background:transparent;color:var(--ink,#fff);font:inherit;font-size:12px}.booster-search-input::placeholder{color:var(--muted,rgba(255,255,255,.5))}.boostr-hidden-by-search{display:none!important}
    .boostr-viz{margin-top:14px;height:44px;border-radius:16px;overflow:hidden;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.07);position:relative}.boostr-viz:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,var(--gold,#ffd36e),var(--green,#77ffac),var(--blue,#6f8cff),#ff6bd6);opacity:.88}.boostr-viz.line:before{clip-path:polygon(0 75%,15% 55%,30% 28%,45% 48%,60% 22%,75% 34%,100% 14%,100% 100%,0 100%)}.boostr-viz.bars:before{clip-path:polygon(4% 100%,4% 45%,13% 45%,13% 100%,23% 100%,23% 20%,34% 20%,34% 100%,45% 100%,45% 60%,56% 60%,56% 100%,67% 100%,67% 32%,79% 32%,79% 100%,89% 100%,89% 16%,98% 16%,98% 100%)}.boostr-viz.wave:before{clip-path:polygon(0 74%,12% 58%,24% 40%,36% 52%,48% 30%,60% 22%,72% 54%,84% 42%,100% 30%,100% 100%,0 100%)}
    .boostr-ring{--p:76;width:70px;height:70px;border-radius:50%;background:conic-gradient(var(--blue,#6f8cff) calc(var(--p)*1%),rgba(255,255,255,.08) 0);display:grid;place-items:center;margin-top:12px}.boostr-ring:after{content:attr(data-label);width:49px;height:49px;border-radius:50%;background:rgba(0,0,0,.65);display:grid;place-items:center;font-size:12px;font-weight:900}.boostr-row{display:flex;gap:10px;align-items:flex-end}.boostr-row .boostr-viz{flex:1}.boostr-system-name{font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:var(--champagne,#f6e4bd);font-weight:900;margin-bottom:6px}
    @media (prefers-reduced-motion:reduce){.module,.metric,.task,.switch-card,.contract-card,.system-tile,.flow-row,.role-card,.signal,.stat,.item,.insight,.smart-block,.card.glass{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const cardSelector = '.module,.metric,.task,.switch-card,.contract-card,.system-tile,.flow-row,.role-card,.signal,.stat,.item,.insight,.smart-block';
  const cards = [...document.querySelectorAll(cardSelector)];
  cards.forEach((card, i) => {
    card.style.setProperty('--float-i', i % 12);
    card.setAttribute('draggable', 'true');
    card.dataset.searchText = (card.textContent || '').toLowerCase();
    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
  [...new Set(cards.map(c => c.parentElement).filter(Boolean))].forEach(parent => {
    parent.addEventListener('dragover', event => {
      event.preventDefault();
      const dragging = parent.querySelector('.dragging');
      if (!dragging) return;
      const siblings = [...parent.querySelectorAll(cardSelector + ':not(.dragging)')];
      const after = siblings.find(el => event.clientY <= el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2);
      parent.insertBefore(dragging, after || null);
    });
  });

  const types = ['line','bars','wave'];
  document.querySelectorAll('.metric,.signal,.contract-card,.stat').forEach((card, i) => {
    if (card.querySelector('.boostr-viz')) return;
    const row = document.createElement('div'); row.className = 'boostr-row';
    const viz = document.createElement('div'); viz.className = 'boostr-viz ' + types[i % 3]; row.appendChild(viz);
    if (i % 3 === 0) { const ring = document.createElement('div'); const val = [64,78,86,92][i % 4]; ring.className = 'boostr-ring'; ring.style.setProperty('--p', val); ring.dataset.label = val + '%'; row.appendChild(ring); }
    card.appendChild(row);
  });
  document.querySelectorAll('.module,.task,.switch-card,.flow-row').forEach(card => { if (card.querySelector('.boostr-system-name')) return; const label = document.createElement('div'); label.className = 'boostr-system-name'; label.textContent = 'BOOSTR OS'; card.prepend(label); });

  document.querySelectorAll('.search').forEach(box => {
    if (box.querySelector('input')) return;
    const input = document.createElement('input'); input.className = 'booster-search-input'; input.type = 'search'; input.placeholder = (box.textContent || 'Search...').trim() || 'Search...'; box.textContent = ''; box.appendChild(input);
    input.addEventListener('input', () => { const q = input.value.trim().toLowerCase(); cards.forEach(card => card.classList.toggle('boostr-hidden-by-search', q && !(card.dataset.searchText || '').includes(q))); });
  });
  document.querySelectorAll('a[href="/portfolio"]').forEach(a => { if (a.closest('.network-grid') || a.closest('.timeline') || a.closest('.compact-main')) return; a.href = '/modules'; if ((a.textContent || '').toLowerCase().includes('portfolio')) a.textContent = 'Modules'; if (a.title === 'Portfolio') a.title = 'Modules'; });
  document.querySelectorAll('a[href="/audit"],a[href="/audit/"]').forEach(a => { if (location.pathname.startsWith('/audit')) return; a.target = '_blank'; a.rel = 'noopener noreferrer'; });
  const footer = document.querySelector('.footer');
  if (footer && !/powered by/i.test(footer.textContent)) { const os = document.querySelector('.greeting strong')?.textContent?.trim() || 'OS'; footer.innerHTML = `POWERED BY <strong>BOOSTR LABS</strong> · ${os}`; }
})();
