(() => {
  const context = { assignee: 'Johanka', role: 'Creative Leader', workspace: 'Hummus FL' };
  const assets = {
    logoMain: { label: 'Logo principal actual', src: './assets/logo-main.svg' },
    logoAlt: { label: 'Logo alternativo actual', src: './assets/logo-alt.svg' },
    food01: { label: 'Foto real de comida — referencia 01', src: './assets/food-01.svg' }
  };
  const missionAssets = {
    VISUAL_BOOT_01: ['logoMain'],
    VISUAL_BOOT_02: ['logoAlt', 'logoMain'],
    ASSET_SCAN_03: ['food01'],
    FOOD_CUT_04: ['food01'],
    FOOD_SYSTEM_05: ['food01'],
    MENU_SCAN_06: ['food01'],
    MENU_COVER_07: ['food01'],
    PALETTE_08: ['logoMain', 'logoAlt', 'food01'],
    TYPE_09: ['logoMain', 'logoAlt'],
    PHOTO_CURATE_10: ['food01'],
    HERO_11: ['food01'],
    SMARTLINK_12: ['logoMain', 'food01'],
    QR_FRAME_13: ['logoMain', 'logoAlt']
  };

  const codeNode = document.getElementById('cardCode');
  const stepsNode = document.getElementById('microSteps');
  if (!codeNode || !stepsNode) return;

  const section = document.createElement('section');
  section.className = 'source-assets';
  stepsNode.insertAdjacentElement('afterend', section);

  const style = document.createElement('style');
  style.textContent = `
    .source-assets{margin-top:30px;padding:18px;border:1px solid rgba(242,240,233,.11);border-radius:22px;background:rgba(228,214,184,.045)}
    .source-assets-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}
    .source-assets h3{margin:7px 0 4px;font-size:21px}
    .source-assets p{margin:0;color:var(--muted);font-size:12px;line-height:1.5}
    .source-kicker{font:9px ui-monospace,Consolas,monospace;letter-spacing:.16em;color:var(--olive);text-transform:uppercase}
    .source-owner{white-space:nowrap;border:1px solid rgba(169,182,111,.28);border-radius:999px;padding:7px 9px;color:var(--olive);font-size:9px}
    .source-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:10px;margin-top:15px}
    .source-card{display:block;text-decoration:none;color:var(--text);padding:7px;border:1px solid rgba(242,240,233,.09);border-radius:17px;background:rgba(0,0,0,.2)}
    .source-card img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:11px;background:#fff}
    .source-card b,.source-card small{display:block}.source-card b{font-size:10px;margin:8px 3px 2px}.source-card small{font-size:9px;color:var(--olive);margin:0 3px 3px}
    @media(max-width:620px){.source-assets-head{flex-direction:column}.source-grid{grid-template-columns:repeat(2,1fr)}}
  `;
  document.head.appendChild(style);

  function render() {
    const code = codeNode.textContent.trim();
    const keys = missionAssets[code] || ['logoMain', 'food01'];
    const cards = keys.map(key => assets[key]).filter(Boolean);
    section.innerHTML = `
      <div class="source-assets-head">
        <div><div class="source-kicker">HERRAMIENTAS PARA ESTA MISIÓN</div><h3>Johanka, te dejamos lo que necesitas aquí.</h3><p>Puedes abrir, descargar o subir estas referencias directamente a ChatGPT. La misión sigue siendo parte del módulo reusable BOOSTR Missions; esta versión está asignada y preparada específicamente para ti.</p></div>
        <span class="source-owner">${context.assignee} · ${context.role}</span>
      </div>
      <div class="source-grid">${cards.map(asset => `<a class="source-card" href="${asset.src}" download><img src="${asset.src}" alt="${asset.label}"><b>${asset.label}</b><small>Descargar referencia</small></a>`).join('')}</div>`;
  }

  new MutationObserver(render).observe(codeNode, { childList: true, subtree: true, characterData: true });
  render();
})();