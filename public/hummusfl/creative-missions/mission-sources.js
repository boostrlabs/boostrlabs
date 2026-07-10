(() => {
  const context = { assignee: 'Johanka', role: 'Creative Leader', workspace: 'Hummus FL' };
  const assets = {
    logoMain: { label: 'Logo principal original de Hummus', src: './assets/logo-main.svg' },
    logoAlt: { label: 'Logo alternativo original de Hummus', src: './assets/logo-alt.svg' },
    food01: { label: 'Foto real de comida para usar como referencia', src: './assets/food-01.svg' },
    menu01: { label: 'Captura real del menú actual', src: './assets/menu-current-01.svg' }
  };

  const missionAssets = {
    VISUAL_BOOT_01: ['logoMain'],
    VISUAL_BOOT_02: ['logoAlt', 'logoMain'],
    ASSET_SCAN_03: ['food01'],
    FOOD_CUT_04: ['food01'],
    FOOD_SYSTEM_05: ['food01'],
    MENU_SCAN_06: ['menu01'],
    MENU_COVER_07: ['menu01', 'food01'],
    PALETTE_08: ['logoMain', 'logoAlt', 'food01'],
    TYPE_09: ['logoMain', 'logoAlt'],
    PHOTO_CURATE_10: ['food01'],
    HERO_11: ['food01'],
    SMARTLINK_12: ['logoMain', 'food01'],
    QR_FRAME_13: ['logoMain', 'logoAlt']
  };

  const codeNode = document.getElementById('cardCode');
  const bodyNode = document.getElementById('cardBody');
  if (!codeNode || !bodyNode) return;

  const section = document.createElement('section');
  section.className = 'source-assets';
  bodyNode.insertAdjacentElement('afterend', section);

  const style = document.createElement('style');
  style.textContent = `
    .source-assets{margin:24px 0 4px;padding:20px;border:1px solid rgba(228,214,184,.22);border-radius:24px;background:linear-gradient(145deg,rgba(228,214,184,.12),rgba(169,182,111,.055));box-shadow:0 18px 48px rgba(0,0,0,.18)}
    .source-assets-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}
    .source-assets h3{margin:7px 0 5px;font-size:22px;letter-spacing:-.03em}
    .source-assets p{margin:0;color:rgba(242,240,233,.7);font-size:13px;line-height:1.5}
    .source-kicker{font:9px ui-monospace,Consolas,monospace;letter-spacing:.16em;color:var(--sand);text-transform:uppercase}
    .source-owner{white-space:nowrap;border:1px solid rgba(228,214,184,.3);border-radius:999px;padding:7px 9px;color:var(--sand);font-size:9px}
    .source-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:11px;margin-top:16px}
    .source-card{display:block;text-decoration:none;color:var(--text);padding:8px;border:1px solid rgba(242,240,233,.12);border-radius:18px;background:rgba(0,0,0,.24);transition:.2s ease}
    .source-card:hover{transform:translateY(-2px);border-color:rgba(228,214,184,.45)}
    .source-card img{display:block;width:100%;aspect-ratio:1/1;object-fit:contain;border-radius:12px;background:#fff}
    .source-card b,.source-card small{display:block}.source-card b{font-size:11px;margin:9px 4px 3px;line-height:1.3}.source-card small{font-size:9px;color:var(--sand);margin:0 4px 4px}
    @media(max-width:620px){.source-assets{padding:16px}.source-assets-head{flex-direction:column}.source-grid{grid-template-columns:1fr 1fr}.source-owner{white-space:normal}}
  `;
  document.head.appendChild(style);

  function render() {
    const code = codeNode.textContent.trim();
    const keys = missionAssets[code] || ['logoMain', 'logoAlt', 'food01', 'menu01'];
    const cards = keys.map(key => assets[key]).filter(Boolean);
    section.innerHTML = `
      <div class="source-assets-head">
        <div>
          <div class="source-kicker">ARCHIVOS LISTOS PARA TRABAJAR</div>
          <h3>Johanka, no tienes que buscar nada.</h3>
          <p>Estos son los archivos que necesitas para esta idea. Ábrelos o descárgalos y súbelos directamente a ChatGPT junto con el prompt.</p>
        </div>
        <span class="source-owner">${context.assignee} · ${context.role}</span>
      </div>
      <div class="source-grid">${cards.map(asset => `<a class="source-card" href="${asset.src}" download><img src="${asset.src}" alt="${asset.label}"><b>${asset.label}</b><small>Abrir o descargar archivo</small></a>`).join('')}</div>`;
  }

  new MutationObserver(render).observe(codeNode, { childList: true, subtree: true, characterData: true });
  render();
})();