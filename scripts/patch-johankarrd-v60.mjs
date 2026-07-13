import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const file = new URL('../dist/johankarrdbuildr/app-v60.js', import.meta.url);
const coreFile = new URL('../dist/johankarrdbuildr/core-v64.js', import.meta.url);
const hardeningFile = new URL('../dist/johankarrdbuildr/app-v63-hardening.js', import.meta.url);
let source = await readFile(file, 'utf8');

const replacements = [
  [
    "state.sites = dedupeSites({ ...state.sites, ...(data.sites || {}) });",
    "const cloudEntries = Object.fromEntries(Object.entries(data.sites || {}).map(([key, value]) => [`cloud-${key}`, value])); state.sites = dedupeSites({ ...state.sites, ...cloudEntries });"
  ],
  [
    "function commit(label, mutate) { state.history.push(snapshot()); if (state.history.length > 50) state.history.shift(); state.future = []; mutate(); state.sites = dedupeSites(state.sites); ensureSelection(); writeLocal(); renderAll(); queueSave(); showToast(label, 'Deshacer', undo, 5000); navigator.vibrate?.(10); }",
    "function commit(label, mutate) { const before = snapshot(); state.history.push(before); if (state.history.length > 50) state.history.shift(); state.future = []; mutate(); state.sites = dedupeSites(state.sites); ensureSelection(); const audit = window.JOHANKARRD_CORE?.auditState(state.sites); if (audit && !audit.ok) { state.history.pop(); state.sites = before.sites; state.currentSite = before.currentSite; state.currentSection = before.currentSection; state.selectedItemId = before.selectedItemId; ensureSelection(); writeLocal(); renderAll(); setStatus(`Cambio cancelado para proteger los datos (${audit.code}).`); return false; } writeLocal(); renderAll(); queueSave(); showToast(label, 'Deshacer', undo, 5000); navigator.vibrate?.(10); return true; }"
  ],
  [
    "async function uploadOrEmbed(file) { try { return await uploadFile(file); } catch (_) { return fileToDataUrl(file); } }",
    "async function compressImage(file) { try { const source = await fileToDataUrl(file); const image = await new Promise((resolve, reject) => { const node = new Image(); node.onload = () => resolve(node); node.onerror = reject; node.src = source; }); const max = 1600; const scale = Math.min(1, max / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); let quality = .86; let output = canvas.toDataURL('image/jpeg', quality); while (output.length > 1750000 && quality > .46) { quality -= .1; output = canvas.toDataURL('image/jpeg', quality); } return output; } catch (_) { return fileToDataUrl(file); } } async function uploadOrEmbed(file) { try { return await uploadFile(file); } catch (_) { return compressImage(file); } }"
  ],
  [
    "else if (key.startsWith('site.')) site()[key.slice(5)] = value; else if (key.startsWith('section.'))",
    "else if (key.startsWith('site.')) { const prop = key.slice(5); const current = site(); current[prop] = prop === 'slug' ? canonicalSlug(value, current.name) : value; if (prop === 'slug') { const previousKey = state.currentSite; const nextKey = storageKey(current.slug); if (nextKey !== previousKey) { delete state.sites[previousKey]; state.sites[nextKey] = current; state.currentSite = nextKey; } } } else if (key.startsWith('section.'))"
  ],
  [
    "  function applyPreset(key) {",
    "  async function exportSite(key = state.currentSite) { const current = state.sites[key]; if (!current) return setStatus('No hay una Johankarrd para descargar.'); setStatus('Preparando descarga…'); try { const response = await fetch('/api/johankarrd/render', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ site: current }) }); if (!response.ok) throw new Error('render failed'); const html = await response.text(); const url = URL.createObjectURL(new Blob([html], { type: 'text/html' })); const link = document.createElement('a'); link.href = url; link.download = `${current.slug || key}.html`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setStatus('HTML descargado.'); } catch (_) { setStatus('No se pudo descargar.'); } }\n  function applyPreset(key) {"
  ],
  [
    "if (target.closest('[data-save]')) return saveDraft(true); if (target.closest('[data-publish],[data-mobile-publish]')) return publish();",
    "if (target.closest('[data-save]')) return saveDraft(true); if (target.closest('[data-export]')) return exportSite(); if (target.closest('[data-publish],[data-mobile-publish]')) return publish();"
  ],
  [
    "</a><button type=\"button\" data-duplicate-site=\"${esc(key)}\">Duplicar</button>",
    "</a><button type=\"button\" data-export-site=\"${esc(key)}\">Descargar</button><button type=\"button\" data-duplicate-site=\"${esc(key)}\">Duplicar</button>"
  ],
  [
    "const duplicateSiteButton = target.closest('[data-duplicate-site]'); if (duplicateSiteButton) return duplicateSite(duplicateSiteButton.dataset.duplicateSite); const deleteSiteButton",
    "const duplicateSiteButton = target.closest('[data-duplicate-site]'); if (duplicateSiteButton) return duplicateSite(duplicateSiteButton.dataset.duplicateSite); const exportSiteButton = target.closest('[data-export-site]'); if (exportSiteButton) return exportSite(exportSiteButton.dataset.exportSite); const deleteSiteButton"
  ],
  ["Ver live", "Ver publicada"],
  ["<span class=\"burli-pill\">ACTIVO PARA SIEMPRE</span>", "<span class=\"burli-pill\">ACTIVADO</span>"],
  [
    "<div class=\"burli-stat\"><span>Razón</span><b>Ser esposa del BURLIGAN CORP CEO</b></div><div class=\"burli-stat\"><span>Rol desbloqueado</span><b>CEO por consecuencia</b></div>",
    "<div class=\"burli-stat\" style=\"grid-column:1/-1\"><span>Razón</span><b>Ser esposa del BURLIGAN CORP CEO y, por consecuencia, también CEO.</b></div>"
  ],
  ["<small>LIVE</small>", "<small>PUBLICADA</small>"],
  ["Subir nuevo asset", "Subir nuevo archivo"],
  ["Agregar asset seleccionado", "Agregar archivo seleccionado"],
  ["Subiendo asset…", "Subiendo archivo…"],
  ["Asset listo para usar.", "Archivo listo para usar."]
];

for (const [before, after] of replacements) {
  if (!source.includes(before)) throw new Error(`Johankarrd QA patch pattern missing: ${before.slice(0, 110)}`);
  source = source.replace(before, after);
}

function replaceFunction(sourceText, functionName, replacement) {
  const startToken = `  function ${functionName}() {`;
  const start = sourceText.indexOf(startToken);
  if (start < 0) throw new Error(`Johankarrd function missing: ${functionName}`);
  const endToken = '\n  function handleClick(event) {';
  const end = sourceText.indexOf(endToken, start);
  if (end < 0) throw new Error(`Johankarrd function boundary missing after: ${functionName}`);
  return sourceText.slice(0, start) + replacement + sourceText.slice(end);
}

const appleDragFunction = String.raw`  function installDragEngine() {
    let pending = null;
    let autoScrollRaf = 0;
    const cardForDrag = () => $('.preview-page.active .preview-card', E.canvas);
    const clearSelection = () => { try { window.getSelection()?.removeAllRanges(); } catch (_) {} };
    const preventSelection = (event) => { if (state.drag) event.preventDefault(); };
    document.addEventListener('selectstart', preventSelection, true);
    document.addEventListener('dragstart', (event) => { if (event.target.closest('[data-item-id],[data-asset]')) event.preventDefault(); }, true);
    document.addEventListener('click', (event) => { if (Date.now() < Number(document.body.dataset.dragClickUntil || 0)) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);

    const setDraggingUi = (active, card = null) => {
      document.documentElement.classList.toggle('johankarrd-dragging', active);
      document.body.classList.toggle('johankarrd-dragging', active);
      card?.classList.toggle('drag-active', active);
      if (active) clearSelection();
    };

    const rectMap = (card, drag) => new Map(
      $$('[data-item-id]', card)
        .filter((node) => node !== drag.source)
        .map((node) => [node, node.getBoundingClientRect()])
    );

    const animateFlip = (card, before, drag) => {
      for (const node of $$('[data-item-id]', card)) {
        if (node === drag.source) continue;
        const first = before.get(node);
        if (!first) continue;
        const last = node.getBoundingClientRect();
        const dx = first.left - last.left;
        const dy = first.top - last.top;
        if (Math.abs(dx) < .5 && Math.abs(dy) < .5) continue;
        node.animate?.([
          { transform: 'translate3d(' + dx + 'px,' + dy + 'px,0)' },
          { transform: 'translate3d(0,0,0)' }
        ], { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
    };

    const placePlaceholder = (drag) => {
      const card = cardForDrag();
      if (!card || drag.settling) return;
      const overCanvas = document.elementFromPoint(drag.x, drag.y)?.closest('[data-canvas],.canvas,.device');
      if (drag.kind === 'asset' && !overCanvas) {
        drag.placeholder.remove();
        drag.targetIndex = null;
        E.canvas.classList.remove('drop-highlight');
        return;
      }
      E.canvas.classList.toggle('drop-highlight', drag.kind === 'asset' && Boolean(overCanvas));
      const candidates = $$('[data-item-id]', card).filter((node) => node !== drag.source);
      let desired = candidates.length;
      for (let index = 0; index < candidates.length; index += 1) {
        const rect = candidates[index].getBoundingClientRect();
        if (drag.y < rect.top + rect.height / 2) { desired = index; break; }
      }
      const visual = Array.from(card.children).filter((node) => node === drag.placeholder || (node.matches?.('[data-item-id]') && node !== drag.source));
      const current = visual.indexOf(drag.placeholder);
      if (current !== desired || drag.placeholder.parentNode !== card) {
        const before = rectMap(card, drag);
        if (desired >= candidates.length) card.append(drag.placeholder);
        else card.insertBefore(drag.placeholder, candidates[desired]);
        animateFlip(card, before, drag);
        if (drag.lastTargetIndex !== desired) navigator.vibrate?.(4);
      }
      drag.targetIndex = desired;
      drag.lastTargetIndex = desired;
    };

    const updateGhost = (drag) => {
      const left = drag.x - drag.offsetX;
      const top = drag.y - drag.offsetY;
      const velocity = drag.x - drag.lastX;
      const tilt = Math.max(-1.4, Math.min(1.4, velocity * .12));
      drag.currentTransform = 'translate3d(' + left + 'px,' + top + 'px,0) scale(1.035) rotate(' + tilt + 'deg)';
      drag.ghost.style.transform = drag.currentTransform;
      drag.lastX = drag.x;
      drag.lastY = drag.y;
    };

    const updateAutoScroll = (drag) => {
      const scrollBox = cardForDrag();
      const rect = scrollBox?.getBoundingClientRect();
      if (!rect) return;
      const zone = Math.min(96, rect.height * .22);
      let speed = 0;
      if (drag.y < rect.top + zone) speed = -20 * (1 - Math.max(0, drag.y - rect.top) / zone);
      else if (drag.y > rect.bottom - zone) speed = 20 * (1 - Math.max(0, rect.bottom - drag.y) / zone);
      drag.scrollSpeed = speed;
    };

    const runAutoScroll = () => {
      const drag = state.drag;
      if (!drag || drag.settling) { autoScrollRaf = 0; return; }
      const scrollBox = cardForDrag();
      if (scrollBox && Math.abs(drag.scrollSpeed || 0) > .2) {
        const before = scrollBox.scrollTop;
        scrollBox.scrollTop += drag.scrollSpeed;
        if (scrollBox.scrollTop !== before) placePlaceholder(drag);
      }
      autoScrollRaf = requestAnimationFrame(runAutoScroll);
    };

    const begin = (p, point) => {
      if (!p?.source?.isConnected || state.drag) return;
      document.activeElement?.matches?.('[contenteditable="true"]') && document.activeElement.blur();
      clearSelection();
      const source = p.source;
      const rect = source.getBoundingClientRect();
      const ghost = source.cloneNode(true);
      ghost.className = 'drag-ghost';
      ghost.removeAttribute('id');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
      ghost.querySelectorAll('a,button,input,textarea,select,[contenteditable]').forEach((node) => {
        node.tabIndex = -1;
        node.removeAttribute('contenteditable');
      });
      Object.assign(ghost.style, { width: rect.width + 'px', height: rect.height + 'px' });
      document.body.append(ghost);
      const placeholder = document.createElement('div');
      placeholder.className = 'drag-placeholder';
      placeholder.style.height = Math.max(48, rect.height) + 'px';
      if (p.kind === 'item') {
        source.parentNode.insertBefore(placeholder, source);
        source.classList.add('drag-source');
      } else {
        source.classList.add('drag-origin');
      }
      const card = cardForDrag();
      state.drag = {
        kind: p.kind,
        source,
        ghost,
        placeholder,
        itemId: source.dataset.itemId || '',
        asset: source.dataset.asset || '',
        pointerId: p.id,
        pointerType: p.pointerType,
        x: point.clientX,
        y: point.clientY,
        lastX: point.clientX,
        lastY: point.clientY,
        offsetX: point.clientX - rect.left,
        offsetY: point.clientY - rect.top,
        originalRect: rect,
        targetIndex: p.kind === 'item' ? Array.from(source.parentNode.children).filter((node) => node.matches?.('[data-item-id]')).indexOf(source) : null,
        lastTargetIndex: null,
        currentTransform: '',
        scrollSpeed: 0,
        raf: 0,
        settling: false,
        siteKey: state.currentSite,
        sectionId: state.currentSection
      };
      try { source.setPointerCapture?.(p.id); } catch (_) {}
      setDraggingUi(true, card);
      updateGhost(state.drag);
      placePlaceholder(state.drag);
      navigator.vibrate?.(14);
      if (p.kind === 'asset') closeSheet(false);
      if (!autoScrollRaf) autoScrollRaf = requestAnimationFrame(runAutoScroll);
    };

    const cancelPending = () => {
      if (!pending) return;
      clearTimeout(pending.timer);
      pending = null;
    };

    document.addEventListener('pointerdown', (event) => {
      const source = event.target.closest('[data-item-id],[data-asset]');
      if (!source || state.drag) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const kind = source.hasAttribute('data-item-id') ? 'item' : 'asset';
      if (kind === 'item' && event.target.closest('a,input,textarea,select,label,button,[contenteditable="true"]')) return;
      if (kind === 'asset' && event.target.closest('input,textarea,select,label')) return;
      pending = {
        source,
        kind,
        id: event.pointerId,
        pointerType: event.pointerType,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        timer: 0
      };
      if (event.pointerType === 'touch') {
        const record = pending;
        record.timer = setTimeout(() => {
          if (pending !== record) return;
          pending = null;
          begin(record, { clientX: record.lastX, clientY: record.lastY });
        }, 145);
      }
    }, true);

    document.addEventListener('pointermove', (event) => {
      if (pending && pending.id === event.pointerId) {
        pending.lastX = event.clientX;
        pending.lastY = event.clientY;
        const distance = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
        if (pending.pointerType === 'touch') {
          if (distance > 11) cancelPending();
        } else if (distance > 3) {
          const record = pending;
          pending = null;
          begin(record, event);
        }
      }
      const drag = state.drag;
      if (!drag || drag.settling || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      clearSelection();
      drag.x = event.clientX;
      drag.y = event.clientY;
      updateAutoScroll(drag);
      if (!drag.raf) drag.raf = requestAnimationFrame(() => {
        drag.raf = 0;
        updateGhost(drag);
        placePlaceholder(drag);
      });
    }, { capture: true, passive: false });

    const finish = (event) => {
      if (pending && pending.id === event.pointerId) { cancelPending(); return; }
      const drag = state.drag;
      if (!drag || drag.settling || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      drag.settling = true;
      document.body.dataset.dragClickUntil = String(Date.now() + 450);
      if (drag.raf) cancelAnimationFrame(drag.raf);
      if (autoScrollRaf) { cancelAnimationFrame(autoScrollRaf); autoScrollRaf = 0; }
      E.canvas.classList.remove('drop-highlight');
      const cancelled = event.type === 'pointercancel' || !Number.isInteger(drag.targetIndex);
      const targetRect = !cancelled && drag.placeholder.isConnected ? drag.placeholder.getBoundingClientRect() : drag.originalRect;
      const scale = Math.max(.72, Math.min(1.04, Math.min(targetRect.width / drag.originalRect.width, targetRect.height / drag.originalRect.height)));
      const targetTransform = 'translate3d(' + targetRect.left + 'px,' + targetRect.top + 'px,0) scale(' + scale + ') rotate(0deg)';
      let animation;
      try {
        animation = drag.ghost.animate([
          { transform: drag.currentTransform, opacity: 1 },
          { transform: targetTransform, opacity: cancelled ? .72 : 1 }
        ], { duration: cancelled ? 220 : 280, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
      } catch (_) {}
      const done = animation?.finished?.catch?.(() => {}) || Promise.resolve();
      done.finally(() => {
        try { drag.source.releasePointerCapture?.(drag.pointerId); } catch (_) {}
        drag.ghost.remove();
        drag.placeholder.remove();
        drag.source.classList.remove('drag-source', 'drag-origin');
        setDraggingUi(false, cardForDrag());
        state.drag = null;
        clearSelection();
        if (cancelled) { renderCanvas(); return; }
        if (drag.kind === 'item') {
          if (state.currentSite !== drag.siteKey || state.currentSection !== drag.sectionId) {
            renderCanvas();
            setStatus('Movimiento cancelado para proteger la sección.');
            return;
          }
          const moved = window.JOHANKARRD_CORE?.moveItemExact({
            sites: state.sites,
            siteKey: drag.siteKey,
            sectionId: drag.sectionId,
            itemId: drag.itemId,
            toIndex: drag.targetIndex
          });
          if (moved?.ok && moved.code === 'moved') {
            commit('Elemento movido', () => { state.sites = moved.sites; state.selectedItemId = drag.itemId; });
            navigator.vibrate?.([10, 24, 14]);
          } else {
            renderCanvas();
            if (moved && !moved.ok) setStatus('Movimiento cancelado (' + moved.code + ').');
          }
        }
        if (drag.kind === 'asset' && drag.asset) {
          addItem({ type: 'image', src: drag.asset }, drag.targetIndex);
          navigator.vibrate?.([10, 24, 14]);
        }
      });
    };

    document.addEventListener('pointerup', finish, { capture: true, passive: false });
    document.addEventListener('pointercancel', finish, { capture: true, passive: false });
    E.canvas.addEventListener('dragover', (event) => { event.preventDefault(); E.canvas.classList.add('drop-highlight'); });
    E.canvas.addEventListener('dragleave', () => E.canvas.classList.remove('drop-highlight'));
    E.canvas.addEventListener('drop', async (event) => {
      event.preventDefault();
      E.canvas.classList.remove('drop-highlight');
      const file = event.dataTransfer.files?.[0];
      if (file?.type.startsWith('image/')) {
        const src = await uploadOrEmbed(file);
        addAssetToLibrary(src);
        addItem({ type: 'image', src });
      }
    });
  }`;

source = replaceFunction(source, 'installDragEngine', appleDragFunction);

const forbidden = ['app-motion.js', 'app-sheet-swipe.js', 'app-prime-safe.js', 'app-fix.js', 'app-upload-fix.js', 'app-product-v58.js', 'app-ux-v58.js', 'app-final-v59.js', 'app-v62-enhance.js'];
const index = await readFile(new URL('../dist/johankarrdbuildr/index.html', import.meta.url), 'utf8');
for (const legacy of forbidden) {
  if (index.includes(legacy)) throw new Error(`Legacy builder layer still loaded: ${legacy}`);
}

for (const required of ['data-canvas', 'data-inspector', 'data-mobile-publish', 'data-export', 'core-v64.js', 'app-v60.js', 'app-v63-hardening.js', 'prime-v63-hardening.css']) {
  if (!index.includes(required)) throw new Error(`Builder smoke check missing: ${required}`);
}

for (const marker of ['johankarrd-dragging', 'selectstart', 'animateFlip', 'translate3d(', 'drag.settling', 'moveItemExact']) {
  if (!source.includes(marker)) throw new Error(`Apple drag marker missing: ${marker}`);
}

if (index.indexOf('core-v64.js') > index.indexOf('app-v60.js')) throw new Error('Core must load before the app');

await writeFile(file, source, 'utf8');
for (const target of [file, coreFile, hardeningFile]) {
  const targetPath = fileURLToPath(target);
  const check = spawnSync(process.execPath, ['--check', targetPath], { encoding: 'utf8' });
  if (check.status !== 0) throw new Error(check.stderr || `Johankarrd syntax check failed: ${targetPath}`);
}

console.log('Johankarrd PRIME QA passed: Apple-feel GPU drag, FLIP spacing, protected reorder, unified state, Spanish UI, export and publish.');
