(() => {
  /* ── 1. INJECT MOTION STYLES ─────────────────────────────────────── */
  const STYLE_ID = 'boostr-console-motion-style';
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      @keyframes boostrFloat{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-7px,0)}}
      @keyframes boostrGlow{0%,100%{box-shadow:var(--shadow)}50%{box-shadow:0 34px 120px rgba(234,240,255,.14),0 0 34px rgba(246,228,189,.08)}}
      .module,.metric,.task,.switch-card,.contract-card,.system-tile,.flow-row,.role-card,.signal{
        transition:transform .22s ease,border-color .22s ease,background .22s ease,filter .22s ease;
        will-change:transform;cursor:grab;
        animation:boostrFloat 7s ease-in-out infinite;
        animation-delay:calc(var(--float-i,0)*.33s);
      }
      .module:hover,.metric:hover,.task:hover,.switch-card:hover,.contract-card:hover,
      .system-tile:hover,.flow-row:hover,.role-card:hover,.signal:hover{
        transform:translateY(-8px) scale(1.012);
        border-color:rgba(246,228,189,.34);filter:brightness(1.08);
      }
      .module.dragging,.metric.dragging,.task.dragging,.switch-card.dragging,
      .contract-card.dragging,.system-tile.dragging,.flow-row.dragging,
      .role-card.dragging,.signal.dragging{
        opacity:.52;cursor:grabbing;transform:scale(.985);
      }
      .card.glass{animation:boostrGlow 9s ease-in-out infinite}
      .card.glass:nth-of-type(2n){animation-delay:1.1s}
      .card.glass:nth-of-type(3n){animation-delay:2.2s}
      .booster-search-input{
        width:100%;height:100%;border:0;outline:0;background:transparent;
        color:var(--ink,#fff);font:inherit;font-size:12px;
      }
      .booster-search-input::placeholder{color:var(--muted,rgba(255,255,255,.5))}
      .boostr-hidden-by-search{display:none!important}
      .footer{letter-spacing:.1em;text-transform:uppercase}
      .footer strong{color:var(--champagne,#f6e4bd)}
      @media(prefers-reduced-motion:reduce){
        .module,.metric,.task,.switch-card,.contract-card,.system-tile,
        .flow-row,.role-card,.signal,.card.glass{animation:none!important;transition:none!important}
      }
    `;
    document.head.appendChild(s);
  }

  /* ── 2. DRAGGABLE FLOAT CARDS ────────────────────────────────────── */
  const cardSelector = '.module,.metric,.task,.switch-card,.contract-card,.system-tile,.flow-row,.role-card,.signal';
  const cards = Array.from(document.querySelectorAll(cardSelector));
  cards.forEach((card, i) => {
    card.style.setProperty('--float-i', i % 12);
    card.setAttribute('draggable', 'true');
    card.dataset.searchText = (card.textContent || '').toLowerCase();
    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend',   () => card.classList.remove('dragging'));
  });
  const parents = [...new Set(cards.map(c => c.parentElement).filter(Boolean))];
  parents.forEach(parent => {
    parent.addEventListener('dragover', e => {
      e.preventDefault();
      const dragging = parent.querySelector('.dragging');
      if (!dragging) return;
      const siblings = [...parent.querySelectorAll(cardSelector + ':not(.dragging)')];
      const after = siblings.find(el => e.clientY <= el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2);
      parent.insertBefore(dragging, after || null);
    });
  });

  /* ── 3. LIVE SEARCH IN .search BOX ──────────────────────────────── */
  document.querySelectorAll('.search').forEach(box => {
    if (box.querySelector('input')) return;
    const raw = (box.textContent || '').replace(/^⌕\s*/, '').trim();
    box.textContent = '';
    const input = document.createElement('input');
    input.className = 'booster-search-input';
    input.type = 'search';
    input.placeholder = raw || 'Search modules, leads, partners, routes...';
    box.appendChild(input);
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      cards.forEach(card => {
        card.classList.toggle('boostr-hidden-by-search', !!q && !(card.dataset.searchText || '').includes(q));
      });
    });
  });

  /* ── 4. ACTIVE NAV LINK BY CURRENT PATHNAME ─────────────────────── */
  const path = location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.icon-nav a, .side-nav a, .bottom-tabs a, .mobile-tabs a').forEach(a => {
    const href = (a.getAttribute('href') || '').replace(/\/$/, '');
    if (!href || href === '#') return;
    // exact match or leading segment match (e.g. /manager matches /manager/leads)
    if (path === href || (href.length > 1 && path.startsWith(href + '/'))) {
      a.classList.add('active');
    }
  });

  /* ── 5. AUDIT LINKS OPEN IN NEW TAB (except when on /audit) ─────── */
  if (!location.pathname.startsWith('/audit')) {
    document.querySelectorAll('a[href="/audit"],a[href="/audit/"]').forEach(a => {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
  }

  /* ── 6. /portfolio LINKS → /modules (outside main network grids) ── */
  document.querySelectorAll('a[href="/portfolio"]').forEach(a => {
    if (a.closest('.network-grid') || a.closest('.timeline') || a.closest('.compact-main')) return;
    a.href = '/modules';
    const t = (a.textContent || '').trim().toLowerCase();
    if (t === 'portfolio' || t === 'modules') a.textContent = 'Modules';
    if (a.title === 'Portfolio') a.title = 'Modules';
  });

  /* ── 7. FOOTER — ensure POWERED BY BOOSTR LABS format ───────────── */
  const footer = document.querySelector('.footer');
  if (footer && !/powered by/i.test(footer.textContent)) {
    const osName =
      document.querySelector('.greeting strong')?.textContent?.trim() ||
      document.title.replace(/^BOOSTR\s*/i,'').replace(/[—–]/g,'').trim() ||
      'OS';
    footer.innerHTML = `POWERED BY <strong>BOOSTR LABS</strong> · ${osName}`;
  }
})();
