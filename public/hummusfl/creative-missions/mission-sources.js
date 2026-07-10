(() => {
  const context = { assignee: 'Johanka', role: 'Creative Leader', workspace: 'Hummus FL' };
  const BASE = '../assets/source';
  const source = (path) => `${BASE}/${path.split('/').map(encodeURIComponent).join('/')}`;
  const image = (label, path, note = 'Archivo original en alta calidad') => ({ label, src: source(path), note });

  const assets = {
    logoMain: image('Logo principal actual de Hummus', 'hummuslogo.jpg', 'Referencia original para digitalizar'),
    logoAlt: image('Logo alternativo actual de Hummus', 'hummuslogoalt.jpg', 'Referencia original para digitalizar'),
    oldBrand1: image('Branding anterior 01', 'hummusoldbranding1.jpg'),
    oldBrand2: image('Branding anterior 02', 'hummusoldbranding2.jpg'),
    oldBrand3: image('Branding anterior 03', 'hummusoldbranding3.jpg'),
    oldBrand4: image('Branding anterior 04', 'hummusoldbranding4.jpg'),
    food1: image('Hummus asset 01', 'hummusasset1.jpg'),
    food2: image('Hummus asset 02', 'hummusasset2.jpg'),
    food3: image('Hummus asset 03', 'hummusasset3.jpg'),
    food4: image('Hummus asset 04', 'hummusasset4.jpg'),
    food5: image('Hummus asset 05', 'hummusasset5.jpg'),
    food6: image('Hummus asset 06', 'hummusasset6.jpg'),
    food7: image('Hummus asset 07', 'hummusasset7.jpg'),
    food8: image('Hummus asset 08', 'hummusasset8.jpg'),
    food9: image('Hummus asset 09', 'hummusasset9.jpg'),
    food10: image('Hummus asset 10', 'hummusasset10.jpg'),
    food11: image('Hummus asset 11', 'hummusasset11.jpg'),
    food12: image('Hummus asset 12', 'hummusasset12.jpg'),
    google1: image('Foto de Google Review 01', 'photofromgooglereview1.webp'),
    google2: image('Foto de Google Review 02', 'photofromgooglereview2.webp'),
    google3: image('Foto de Google Review 03', 'photofromgooglereview3.webp'),
    google4: image('Foto de Google Review 04', 'photofromgooglereview4.webp'),
    yelp1: image('Foto de Yelp 01', 'yelpreview1.jpg'),
    yelp2: image('Foto de Yelp 02', 'yelpreview2.jpg'),
    yelp3: image('Foto de Yelp 03', 'yelpreview3.jpg'),
    yelp4: image('Foto de Yelp 04', 'yelpreview4.jpg'),
    yelp5: image('Foto de Yelp 05', 'yelpreview5.jpg'),
    yelp6: image('Foto de Yelp 06', 'yelpreview6.jpg'),
    menuCustomer: image('Menú fotografiado por cliente de Yelp', 'menufromyelpcustomer.jpg'),
    menu23: image('Menú actual · captura 23', 'currentmenu/Captura de pantalla (23).png'),
    menu24: image('Menú actual · captura 24', 'currentmenu/Captura de pantalla (24).png'),
    menu25: image('Menú actual · captura 25', 'currentmenu/Captura de pantalla (25).png'),
    menu26: image('Menú actual · captura 26', 'currentmenu/Captura de pantalla (26).png'),
    menu27: image('Menú actual · captura 27', 'currentmenu/Captura de pantalla (27).png'),
    menu28: image('Menú actual · captura 28', 'currentmenu/Captura de pantalla (28).png'),
    menu29: image('Menú actual · captura 29', 'currentmenu/Captura de pantalla (29).png'),
    menu30: image('Menú actual · captura 30', 'currentmenu/Captura de pantalla (30).png'),
    menu31: image('Menú actual · captura 31', 'currentmenu/Captura de pantalla (31).png'),
    menu32: image('Menú actual · captura 32', 'currentmenu/Captura de pantalla (32).png'),
    review33: image('Review Yelp · captura 33', 'currentyelpreviews/Captura de pantalla (33).png'),
    review34: image('Review Yelp · captura 34', 'currentyelpreviews/Captura de pantalla (34).png'),
    review35: image('Review Yelp · captura 35', 'currentyelpreviews/Captura de pantalla (35).png')
  };

  const foodCore = ['food1', 'food2', 'food3', 'food4'];
  const foodWide = ['food1', 'food2', 'food3', 'food4', 'food5', 'food6', 'food7', 'food8', 'food9', 'food10', 'food11', 'food12'];
  const customerPhotos = ['google1', 'google2', 'google3', 'google4', 'yelp1', 'yelp2', 'yelp3', 'yelp4', 'yelp5', 'yelp6'];
  const menuCore = ['menu23', 'menu24', 'menu25', 'menu26'];
  const menuAll = ['menu23', 'menu24', 'menu25', 'menu26', 'menu27', 'menu28', 'menu29', 'menu30', 'menu31', 'menu32', 'menuCustomer'];
  const brandCore = ['logoMain', 'logoAlt', 'oldBrand1', 'oldBrand2', 'oldBrand3', 'oldBrand4'];

  const missionAssets = {
    VISUAL_BOOT_01: ['logoMain', 'logoAlt'],
    VISUAL_BOOT_02: ['logoAlt', 'logoMain'],
    ASSET_SCAN_03: [...foodCore, 'google1', 'yelp1'],
    FOOD_CUT_04: [...foodCore],
    FOOD_SYSTEM_05: [...foodCore, 'google2'],
    MENU_SCAN_06: [...menuCore, 'menuCustomer'],
    MENU_COVER_07: [...menuCore, ...foodCore],
    PALETTE_08: [...brandCore, 'food1', 'food2'],
    TYPE_09: [...brandCore],
    PHOTO_CURATE_10: [...foodWide, ...customerPhotos],
    HERO_11: ['food1', 'food2', 'food3', 'google1', 'google2', 'yelp1', 'yelp2'],
    SMARTLINK_12: ['logoMain', 'logoAlt', 'food1', 'food2', 'google1'],
    QR_FRAME_13: ['logoMain', 'logoAlt', 'oldBrand1', 'food1'],
    QR_REVIEW_14: ['logoMain', 'review33', 'review34', 'review35'],
    PROMO_15: ['logoMain', 'food1', 'food2', 'food3', 'food4'],
    SOCIAL_16: ['logoMain', 'oldBrand1', 'oldBrand2', 'food5', 'food6', 'food7'],
    REEL_COVERS_17: ['oldBrand2', 'oldBrand3', 'google3', 'yelp3'],
    MENU_CARD_18: ['logoMain', ...menuCore, 'food1', 'food2'],
    EMPTY_STATES_19: ['logoMain', 'logoAlt', 'food1'],
    ASSET_NAMING_20: [...brandCore, ...foodCore],
    IDEA_UNLOCK_21: [...menuAll, 'food1', 'food2'],
    IDEA_UNLOCK_22: ['logoMain', 'logoAlt', 'oldBrand1', 'oldBrand2'],
    IDEA_UNLOCK_23: [...brandCore],
    IDEA_UNLOCK_24: [...menuAll, ...foodCore],
    IDEA_UNLOCK_25: [...brandCore, ...foodWide, ...customerPhotos]
  };

  const codeNode = document.getElementById('cardCode');
  const bodyNode = document.getElementById('cardBody');
  if (!codeNode || !bodyNode) return;

  const section = document.createElement('section');
  section.className = 'source-assets';
  bodyNode.insertAdjacentElement('afterend', section);

  const showroom = document.createElement('div');
  showroom.className = 'asset-showroom';
  showroom.setAttribute('aria-hidden', 'true');
  showroom.innerHTML = `
    <div class="asset-showroom-backdrop" data-showroom-close></div>
    <div class="asset-showroom-panel" role="dialog" aria-modal="true" aria-labelledby="assetShowroomTitle">
      <button class="asset-showroom-close" type="button" aria-label="Cerrar" data-showroom-close>×</button>
      <div class="asset-showroom-media"><img id="assetShowroomImage" alt=""></div>
      <div class="asset-showroom-copy">
        <span>ARCHIVO DE APOYO</span>
        <h3 id="assetShowroomTitle"></h3>
        <p id="assetShowroomNote"></p>
        <small>Para guardar: click derecho en PC o mantén presionada la imagen en iPhone.</small>
      </div>
    </div>`;
  document.body.appendChild(showroom);

  const showroomImage = showroom.querySelector('#assetShowroomImage');
  const showroomTitle = showroom.querySelector('#assetShowroomTitle');
  const showroomNote = showroom.querySelector('#assetShowroomNote');
  let lastFocused = null;

  const openShowroom = (asset, trigger) => {
    lastFocused = trigger;
    showroomImage.src = asset.src;
    showroomImage.alt = asset.label;
    showroomTitle.textContent = asset.label;
    showroomNote.textContent = asset.note;
    showroom.classList.add('is-open');
    showroom.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    showroom.querySelector('.asset-showroom-close').focus();
  };

  const closeShowroom = () => {
    showroom.classList.remove('is-open');
    showroom.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    showroomImage.removeAttribute('src');
    if (lastFocused) lastFocused.focus();
  };

  showroom.addEventListener('click', (event) => {
    if (event.target.closest('[data-showroom-close]')) closeShowroom();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && showroom.classList.contains('is-open')) closeShowroom();
  });

  const style = document.createElement('style');
  style.textContent = `
    .source-assets{margin:24px 0 4px;padding:20px;border:1px solid rgba(228,214,184,.22);border-radius:24px;background:linear-gradient(145deg,rgba(228,214,184,.12),rgba(169,182,111,.055));box-shadow:0 18px 48px rgba(0,0,0,.18)}
    .source-assets-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}
    .source-assets h3{margin:7px 0 5px;font-size:22px;letter-spacing:-.03em}
    .source-assets p{margin:0;color:rgba(242,240,233,.7);font-size:13px;line-height:1.5}
    .source-kicker{font:9px ui-monospace,Consolas,monospace;letter-spacing:.16em;color:var(--sand);text-transform:uppercase}
    .source-owner{white-space:nowrap;border:1px solid rgba(228,214,184,.3);border-radius:999px;padding:7px 9px;color:var(--sand);font-size:9px}
    .source-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:11px;margin-top:16px;max-height:520px;overflow:auto;padding-right:4px}
    .source-card{display:block;width:100%;text-align:left;color:var(--text);padding:8px;border:1px solid rgba(242,240,233,.12);border-radius:18px;background:rgba(0,0,0,.24);transition:.2s ease;cursor:zoom-in}
    .source-card:hover{transform:translateY(-2px);border-color:rgba(228,214,184,.45)}
    .source-card img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:12px;background:#fff}
    .source-card b,.source-card small{display:block}.source-card b{font-size:11px;margin:9px 4px 3px;line-height:1.3}.source-card small{font-size:9px;color:var(--sand);margin:0 4px 4px}
    .asset-showroom{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;visibility:hidden;opacity:0;transition:opacity .32s ease,visibility .32s ease}
    .asset-showroom.is-open{visibility:visible;opacity:1}
    .asset-showroom-backdrop{position:absolute;inset:0;background:rgba(3,5,4,.78);backdrop-filter:blur(18px)}
    .asset-showroom-panel{position:relative;width:min(94vw,1100px);max-height:90vh;display:grid;grid-template-columns:minmax(0,1fr) 300px;overflow:hidden;border:1px solid rgba(255,255,255,.13);border-radius:30px;background:linear-gradient(145deg,rgba(17,22,18,.98),rgba(7,10,8,.98));box-shadow:0 40px 140px rgba(0,0,0,.65);transform:translateY(18px) scale(.985);transition:transform .38s cubic-bezier(.22,1,.36,1)}
    .asset-showroom.is-open .asset-showroom-panel{transform:none}
    .asset-showroom-media{min-height:420px;max-height:90vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% 20%,rgba(228,214,184,.1),transparent 45%),#080b09}
    .asset-showroom-media img{display:block;max-width:100%;max-height:82vh;object-fit:contain;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.35)}
    .asset-showroom-copy{padding:30px;display:flex;flex-direction:column;justify-content:flex-end}
    .asset-showroom-copy span{font:9px ui-monospace,Consolas,monospace;letter-spacing:.16em;color:var(--olive)}
    .asset-showroom-copy h3{margin:12px 0 8px;font-size:28px;line-height:1.03;letter-spacing:-.04em}
    .asset-showroom-copy p{margin:0;color:var(--muted);line-height:1.5}
    .asset-showroom-copy small{margin-top:22px;color:rgba(242,240,233,.42);line-height:1.45}
    .asset-showroom-close{position:absolute;z-index:3;top:14px;right:14px;width:44px;height:44px;border:1px solid rgba(255,255,255,.14);border-radius:50%;background:rgba(0,0,0,.42);color:#fff;font-size:26px;cursor:pointer;backdrop-filter:blur(12px)}
    @media(max-width:760px){.asset-showroom-panel{width:min(94vw,620px);grid-template-columns:1fr;max-height:92vh;overflow:auto}.asset-showroom-media{min-height:55vh;max-height:none}.asset-showroom-media img{max-height:58vh}.asset-showroom-copy{padding:22px}.asset-showroom-copy h3{font-size:23px}}
    @media(max-width:620px){.source-assets{padding:16px}.source-assets-head{flex-direction:column}.source-grid{grid-template-columns:1fr 1fr;max-height:440px}.source-owner{white-space:normal}}
  `;
  document.head.appendChild(style);

  function render() {
    const code = codeNode.textContent.trim();
    const keys = missionAssets[code] || [...brandCore, ...foodCore, ...menuCore];
    const cards = keys.map((key) => assets[key]).filter(Boolean);
    section.innerHTML = `
      <div class="source-assets-head">
        <div>
          <div class="source-kicker">ARCHIVOS REALES PARA ESTA MISIÓN</div>
          <h3>Johanka, no tienes que buscar nada.</h3>
          <p>Estos archivos vienen de la biblioteca maestra de Hummus FL. Toca uno para verlo grande y úsalo junto con el prompt de esta misión.</p>
        </div>
        <span class="source-owner">${context.assignee} · ${context.role}</span>
      </div>
      <div class="source-grid">${cards.map((asset, index) => `<button class="source-card" type="button" data-asset-index="${index}"><img src="${asset.src}" alt="${asset.label}" loading="lazy"><b>${asset.label}</b><small>${asset.note}</small></button>`).join('')}</div>`;

    section.querySelectorAll('[data-asset-index]').forEach((button) => {
      button.addEventListener('click', () => openShowroom(cards[Number(button.dataset.assetIndex)], button));
    });
  }

  new MutationObserver(render).observe(codeNode, { childList: true, subtree: true, characterData: true });
  render();
})();