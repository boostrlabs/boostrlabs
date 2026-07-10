(() => {
  'use strict';

  const KEY = 'johankarrd-buildr-v6';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const dedupe = window.JOHANKARRD_PREFLIGHT?.dedupe || ((sites) => sites || {});

  const PRESETS = {
    dark: {
      label: 'Midnight Glass', note: 'Black glass, silver light',
      bg: 'radial-gradient(circle at 18% 12%,rgba(80,110,170,.34),transparent 28%),radial-gradient(circle at 82% 88%,rgba(92,28,84,.32),transparent 34%),linear-gradient(145deg,#020306 0%,#0b101b 58%,#17111d 100%)',
      accent: '#f7f4ec', card: 'linear-gradient(155deg,rgba(16,22,34,.94),rgba(4,6,11,.97))'
    },
    cafe: {
      label: 'Café Aurora', note: 'Ocean blue, cream glow',
      bg: 'radial-gradient(circle at 15% 10%,rgba(139,232,255,.34),transparent 30%),radial-gradient(circle at 88% 86%,rgba(254,237,185,.52),transparent 32%),linear-gradient(145deg,#071a33 0%,#244e75 52%,#d8caa9 100%)',
      accent: '#fff0b8', card: 'linear-gradient(160deg,rgba(5,38,73,.98),rgba(2,18,40,.96))'
    },
    '82': {
      label: '82 Cosmic', note: 'Chrome star, violet orbit',
      bg: 'radial-gradient(circle at 50% -10%,rgba(255,255,255,.30),transparent 25%),radial-gradient(circle at 8% 70%,rgba(96,70,210,.34),transparent 32%),radial-gradient(circle at 92% 72%,rgba(255,83,174,.22),transparent 30%),linear-gradient(155deg,#010102,#080812 58%,#120816)',
      accent: '#ffffff', card: 'linear-gradient(145deg,rgba(22,22,31,.96),rgba(5,5,9,.98))'
    }
  };

  const readSites = () => {
    try { return dedupe(JSON.parse(localStorage.getItem(KEY) || '{}') || {}); }
    catch (_) { return {}; }
  };
  const writeSites = (sites) => localStorage.setItem(KEY, JSON.stringify(dedupe(sites || {})));
  const currentKey = () => $('[data-site-select]')?.value || Object.keys(readSites())[0] || 'cafe';
  const currentSectionId = () => $('[data-sec].active')?.dataset.sec || $('[data-sec]')?.dataset.sec || 'home';
  const status = (text) => { const node = $('[data-status]'); if (node) node.textContent = text; };

  function reloadKeepingSelection() {
    sessionStorage.setItem('johankarrd-current-site', currentKey());
    sessionStorage.setItem('johankarrd-current-section', currentSectionId());
    location.href = '/johankarrdbuildr/?v=58';
  }

  function installCss() {
    if ($('#ux-v58-css')) return;
    document.head.insertAdjacentHTML('beforeend', `<style id="ux-v58-css">
      .style-presets{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;margin-top:14px}.style-presets .preset{position:relative!important;display:grid!important;grid-template-columns:74px 1fr!important;gap:13px!important;align-items:center!important;text-align:left!important;min-height:86px!important;padding:10px!important;border-radius:22px!important;overflow:hidden!important;background:rgba(255,255,255,.045)!important}.preset-art{height:64px;border-radius:17px;border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 0 0 1px rgba(255,255,255,.04),0 16px 35px rgba(0,0,0,.24)}.preset-art.dark{background:radial-gradient(circle at 18% 12%,#47649a88,transparent 35%),radial-gradient(circle at 82% 88%,#7a2e6a88,transparent 38%),linear-gradient(145deg,#020306,#17111d)}.preset-art.cafe{background:radial-gradient(circle at 15% 10%,#8be8ff99,transparent 32%),radial-gradient(circle at 88% 86%,#feedb9cc,transparent 35%),linear-gradient(145deg,#071a33,#d8caa9)}.preset-art.cosmic{background:radial-gradient(circle at 50% 0,#fff8,transparent 28%),radial-gradient(circle at 8% 70%,#6046d288,transparent 35%),radial-gradient(circle at 92% 72%,#ff53ae66,transparent 33%),#050509}.preset-copy b,.preset-copy span{display:block}.preset-copy b{font-size:13px}.preset-copy span{font-size:10px;color:rgba(255,255,255,.52);margin-top:5px;line-height:1.35}
      .media-simple{display:grid;gap:12px}.media-simple .advanced-url{display:none}.media-simple.show-advanced .advanced-url{display:block}.media-upload-primary{min-height:118px;border:1px dashed rgba(254,237,185,.42);border-radius:24px;background:linear-gradient(145deg,rgba(254,237,185,.10),rgba(139,232,255,.055));display:grid;place-items:center;text-align:center;padding:18px;cursor:pointer;color:#feedb9;font:1000 13px/1.25 Arial}.media-upload-primary small{display:block;color:rgba(255,255,255,.5);font-size:10px;margin-top:7px}.media-advanced-toggle{justify-self:start;border:0;background:transparent;color:rgba(255,255,255,.52);font:900 10px Arial;cursor:pointer;padding:2px}.media-preview{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.media-preview img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:14px;border:1px solid rgba(255,255,255,.12)}
      .divider-builder{width:100%;display:grid;gap:7px;place-items:center;padding:9px 2px;text-decoration:none;color:inherit}.divider-builder .divider-line{width:100%;height:var(--divider-size,2px);border-radius:999px;background:var(--divider-color,currentColor);box-shadow:0 0 24px color-mix(in srgb,var(--divider-color,currentColor) 45%,transparent)}.divider-builder.ghost .divider-line{height:1px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.25) 0 7px,transparent 7px 14px);box-shadow:none}.divider-builder small{font-size:8px;letter-spacing:.13em;text-transform:uppercase;opacity:.58}.divider-editor{margin:10px 0 0;padding:11px;border-radius:16px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);display:flex;align-items:center;justify-content:space-between;gap:10px}.divider-editor span{font-size:10px;color:rgba(255,255,255,.55)}.divider-editor button{border:1px solid rgba(254,237,185,.25);border-radius:999px;padding:8px 11px;background:rgba(254,237,185,.08);color:#feedb9;font:900 9px Arial}
      .burli-card{display:grid;gap:11px}.burli-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.burli-head b{font-size:13px;letter-spacing:.08em}.burli-pill{border:1px solid rgba(254,237,185,.35);border-radius:999px;padding:6px 9px;color:#feedb9;font-size:8px}.burli-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.burli-stat{padding:9px;border-radius:14px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.07)}.burli-stat span,.burli-stat b{display:block}.burli-stat span{font-size:8px;color:rgba(255,255,255,.42);text-transform:uppercase;letter-spacing:.09em}.burli-stat b{font-size:10px;margin-top:4px;line-height:1.25}.burli-foot{font-size:8px;color:rgba(255,255,255,.43);line-height:1.4}.prime-sheet-scrim{position:fixed;inset:0;z-index:880;background:rgba(0,0,0,.38);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);opacity:0;animation:scrimIn .22s forwards}@keyframes scrimIn{to{opacity:1}}@media(max-width:820px){.prime-mobile-sheet{z-index:900!important;transition:transform .42s cubic-bezier(.22,1,.36,1),opacity .24s!important}.prime-sheet-head:before{content:"";position:absolute;top:7px;left:50%;width:38px;height:5px;border-radius:999px;background:rgba(255,255,255,.22);transform:translateX(-50%)}.style-presets .preset{min-height:78px!important}.preset-art{height:56px}.media-upload-primary{min-height:104px}}
    </style>`);
  }

  function decoratePresets() {
    $$('.style-presets [data-preset]').forEach((button) => {
      const key = button.dataset.preset; const preset = PRESETS[key];
      if (!preset || button.dataset.decoratedV58) return;
      button.dataset.decoratedV58 = '1';
      button.innerHTML = `<span class="preset-art ${key === '82' ? 'cosmic' : key}"></span><span class="preset-copy"><b>${esc(preset.label)}</b><span>${esc(preset.note)}</span></span>`;
    });
  }

  function applyPreset(key) {
    const preset = PRESETS[key]; if (!preset) return;
    const sites = readSites(); const selected = currentKey(); if (!sites[selected]) return;
    Object.assign(sites[selected], { bg: preset.bg, accent: preset.accent, card: preset.card });
    writeSites(sites); status(`${preset.label} applied.`); reloadKeepingSelection();
  }

  async function uploadFile(file) {
    const form = new FormData(); form.append('file', file);
    const response = await fetch('/api/johankarrd/assets', { method: 'POST', body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) throw new Error(data.error || 'Upload failed');
    return data.url;
  }

  function fileToDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); }
  async function uploadOrEmbed(file) { try { return await uploadFile(file); } catch (_) { return await fileToDataUrl(file); } }

  function renderMediaPreview(box, urls) {
    let preview = $('[data-media-preview]', box);
    if (!preview) { preview = document.createElement('div'); preview.className = 'media-preview'; preview.dataset.mediaPreview = '1'; $('.media-upload-primary', box)?.insertAdjacentElement('afterend', preview); }
    preview.innerHTML = urls.filter(Boolean).map((url) => `<img src="${esc(url)}" alt="">`).join('');
  }

  function enhanceSingleImageModal(box) {
    const src = $('[data-value="src"]', box); const file = $('[data-config-upload]', box);
    if (!src || !file || box.dataset.simpleMediaV58) return;
    box.dataset.simpleMediaV58 = '1';
    const field = src.closest('.field'); const uploadLabel = file.closest('.upload-drop'); const wrap = document.createElement('div'); wrap.className = 'media-simple'; field?.parentNode?.insertBefore(wrap, field);
    if (uploadLabel) { uploadLabel.className = 'media-upload-primary'; uploadLabel.innerHTML = `Choose image<small>Tap to upload from Photos or Files</small>`; uploadLabel.append(file); wrap.append(uploadLabel); }
    if (field) { field.classList.add('advanced-url'); field.querySelector('span').textContent = 'Image URL (advanced)'; wrap.append(field); }
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'media-advanced-toggle'; toggle.textContent = 'Use image URL instead'; toggle.onclick = () => wrap.classList.toggle('show-advanced'); wrap.append(toggle);
    if (src.value) renderMediaPreview(box, [src.value]); file.addEventListener('change', () => setTimeout(() => { if (src.value) renderMediaPreview(box, [src.value]); }, 80));
  }

  function enhanceGalleryModal(box) {
    const textarea = $('[data-value="imgs"]', box); if (!textarea || box.dataset.galleryUploadV58) return;
    box.dataset.galleryUploadV58 = '1'; const field = textarea.closest('.field'); const wrap = document.createElement('div'); wrap.className = 'media-simple'; field?.parentNode?.insertBefore(wrap, field);
    const upload = document.createElement('label'); upload.className = 'media-upload-primary'; upload.innerHTML = `Add gallery images<small>Select several photos at once</small><input type="file" accept="image/*" multiple hidden data-gallery-upload-v58>`; wrap.append(upload);
    if (field) { field.classList.add('advanced-url'); field.querySelector('span').textContent = 'Image URLs (advanced)'; wrap.append(field); }
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'media-advanced-toggle'; toggle.textContent = 'Paste image URLs instead'; toggle.onclick = () => wrap.classList.toggle('show-advanced'); wrap.append(toggle);
    const urls = textarea.value.split('\n').map((value) => value.trim()).filter(Boolean); renderMediaPreview(box, urls);
    $('[data-gallery-upload-v58]', box).addEventListener('change', async (event) => {
      const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/')); if (!files.length) return;
      status(`Uploading ${files.length} gallery image${files.length === 1 ? '' : 's'}…`); const newUrls = [];
      for (const file of files) newUrls.push(await uploadOrEmbed(file));
      const merged = [...textarea.value.split('\n').map((value) => value.trim()).filter(Boolean), ...newUrls]; textarea.value = [...new Set(merged)].join('\n'); textarea.dispatchEvent(new Event('input', { bubbles: true })); renderMediaPreview(box, merged); status('Gallery ready. Tap Add.');
    });
  }

  function decorateBurliClub() {
    $$('.prime-love-badge').forEach((badge) => {
      if (badge.dataset.burliV58) return; badge.dataset.burliV58 = '1';
      badge.innerHTML = `<div class="burli-card"><div class="burli-head"><b>BURLI CLUB</b><span class="burli-pill">ACTIVE FOREVER</span></div><div class="burli-grid"><div class="burli-stat"><span>Plan</span><b>FULL PRO PREMIUM HD EXTREME PLATINUM</b></div><div class="burli-stat"><span>Johankarrds</span><b>999 AVAILABLE</b></div><div class="burli-stat"><span>Reason</span><b>WIFE OF BURLIGAN CORP CEO</b></div><div class="burli-stat"><span>Role unlocked</span><b>CEO BY CONSEQUENCE</b></div></div><div class="burli-foot">Duration: lifetime — or until divorce. Legal department confirms the second option is not currently available.</div></div>`;
    });
  }

  function currentSection(sites = readSites()) { const site = sites[currentKey()]; return site?.sections?.find((section) => section.id === currentSectionId()) || site?.sections?.[0]; }
  function dividerHtml(item = {}) { const ghost = item.style === 'ghost'; const target = String(item.target || '').replace(/^#/, ''); const label = item.label || (ghost ? 'Ghost space' : 'Divider'); return `<div class="divider-builder ${ghost ? 'ghost' : ''}" style="--divider-color:${esc(item.color || '#feedb9')};--divider-size:${Math.max(1, Math.min(12, Number(item.size) || 2))}px" data-divider-target="${esc(target)}"><span class="divider-line"></span>${label ? `<small>${esc(label)}</small>` : ''}</div>`; }
  function addDivider(item) { const sites = readSites(); const section = currentSection(sites); if (!section) return; section.items = Array.isArray(section.items) ? section.items : []; section.items.push({ type: 'divider', style: item.style || 'line', color: item.color || '#feedb9', size: Number(item.size) || 2, label: item.label || '', target: String(item.target || '').replace(/^#/, '') }); writeSites(sites); status('Divider added.'); reloadKeepingSelection(); }
  function updateDivider(index, item) { const sites = readSites(); const section = currentSection(sites); if (!section?.items?.[index] || section.items[index].type !== 'divider') return; section.items[index] = { ...section.items[index], ...item, size: Number(item.size) || 2, target: String(item.target || '').replace(/^#/, '') }; writeSites(sites); status('Divider updated.'); reloadKeepingSelection(); }

  function openDividerModal(existing = null, index = null) {
    $('.modal-backdrop')?.remove(); const sites = readSites(); const site = sites[currentKey()] || {}; const sections = (site.sections || []).map((section) => `<option value="${esc(section.id)}" ${existing?.target === section.id ? 'selected' : ''}>#${esc(section.id)} — ${esc(section.label || section.id)}</option>`).join('');
    document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop"><div class="modal-card"><div class="modal-head"><div class="orb">—</div><div><small>DIVIDER / NAV MARKER</small><h2>${index === null ? 'Add divider' : 'Edit divider'}</h2></div></div><label class="field"><span>Style</span><select data-divider-style><option value="line" ${existing?.style !== 'ghost' ? 'selected' : ''}>Visible line</option><option value="ghost" ${existing?.style === 'ghost' ? 'selected' : ''}>Ghost spacer</option></select></label><label class="field"><span>Optional label</span><input data-divider-label value="${esc(existing?.label || '')}" placeholder="Next section, Menu, Gallery"></label><label class="field"><span>Color</span><input type="color" data-divider-color value="${esc(existing?.color || '#feedb9')}"></label><label class="field"><span>Thickness</span><input type="range" min="1" max="12" value="${Number(existing?.size) || 2}" data-divider-size></label><label class="field"><span>Tap action</span><select data-divider-target><option value="">No action</option>${sections}</select></label><p class="hint">A divider can be visible, act as invisible spacing, or jump to another #section when tapped.</p><div class="modal-actions"><button class="btn" data-close-modal>Cancel</button><button class="btn gold" data-save-divider>${index === null ? 'Add' : 'Save'}</button></div></div></div>`);
    const box = $('.modal-backdrop'); $('[data-save-divider]', box).onclick = () => { const item = { style: $('[data-divider-style]', box).value, label: $('[data-divider-label]', box).value.trim(), color: $('[data-divider-color]', box).value, size: Number($('[data-divider-size]', box).value), target: $('[data-divider-target]', box).value }; if (index === null) addDivider(item); else updateDivider(index, item); box.remove(); }; box.addEventListener('click', (event) => { if (event.target === box || event.target.closest('[data-close-modal]')) box.remove(); });
  }

  function injectDividerChoice() { $$('.block-grid').forEach((grid) => { if ($('[data-block="divider"]', grid)) return; grid.insertAdjacentHTML('beforeend', `<button class="block-choice" data-block="divider"><i>—</i><b>Divider</b><span>Visible line, ghost space or #section jump</span></button>`); }); }
  function decorateDividers() { const sites = readSites(); const section = currentSection(sites); if (!section) return; (section.items || []).forEach((item, index) => { if (item?.type !== 'divider') return; const preview = $(`[data-preview-item="${index}"]`); if (preview && !preview.dataset.dividerV58) { preview.dataset.dividerV58 = '1'; preview.innerHTML = dividerHtml(item); } const editor = $(`[data-item-card="${index}"]`); if (editor && !editor.querySelector('[data-edit-divider]')) editor.insertAdjacentHTML('beforeend', `<div class="divider-editor"><span>${item.style === 'ghost' ? 'Ghost spacer' : 'Visible divider'}${item.target ? ` · jumps to #${esc(item.target)}` : ''}</span><button type="button" data-edit-divider="${index}">Edit divider</button></div>`); }); }
  function syncMobileScrim() { const open = $('.prime-mobile-sheet.open'); let scrim = $('.prime-sheet-scrim'); if (open && !scrim) { scrim = document.createElement('button'); scrim.type = 'button'; scrim.className = 'prime-sheet-scrim'; scrim.setAttribute('aria-label', 'Close panel'); scrim.onclick = () => $('[data-mobile-close]')?.click(); document.body.append(scrim); } if (!open && scrim) scrim.remove(); }

  function inspectUi() { decoratePresets(); injectDividerChoice(); decorateDividers(); decorateBurliClub(); $$('.modal-card').forEach((box) => { enhanceSingleImageModal(box); enhanceGalleryModal(box); }); syncMobileScrim(); }
  function installEvents() {
    document.addEventListener('click', (event) => {
      const preset = event.target.closest('[data-preset]'); if (preset) { event.preventDefault(); event.stopImmediatePropagation(); applyPreset(preset.dataset.preset); return; }
      const divider = event.target.closest('[data-block="divider"]'); if (divider) { event.preventDefault(); event.stopImmediatePropagation(); $('.modal-backdrop')?.remove(); openDividerModal(); return; }
      const editDivider = event.target.closest('[data-edit-divider]'); if (editDivider) { event.preventDefault(); event.stopImmediatePropagation(); const index = Number(editDivider.dataset.editDivider); const item = currentSection()?.items?.[index]; if (item) openDividerModal(item, index); }
    }, true);
  }
  function init() { installCss(); installEvents(); inspectUi(); const observer = new MutationObserver(inspectUi); observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); }
  window.addEventListener('load', init);
})();