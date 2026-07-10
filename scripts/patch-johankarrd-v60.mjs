import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const file = new URL('../dist/johankarrdbuildr/app-v60.js', import.meta.url);
let source = await readFile(file, 'utf8');

const replacements = [
  [
    "state.sites = dedupeSites({ ...state.sites, ...(data.sites || {}) });",
    "const cloudEntries = Object.fromEntries(Object.entries(data.sites || {}).map(([key, value]) => [`cloud-${key}`, value])); state.sites = dedupeSites({ ...state.sites, ...cloudEntries });"
  ],
  [
    "async function uploadOrEmbed(file) { try { return await uploadFile(file); } catch (_) { return fileToDataUrl(file); } }",
    "async function compressImage(file) { try { const source = await fileToDataUrl(file); const image = await new Promise((resolve, reject) => { const node = new Image(); node.onload = () => resolve(node); node.onerror = reject; node.src = source; }); const max = 1600; const scale = Math.min(1, max / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); let quality = .86; let output = canvas.toDataURL('image/jpeg', quality); while (output.length > 1750000 && quality > .46) { quality -= .1; output = canvas.toDataURL('image/jpeg', quality); } return output; } catch (_) { return fileToDataUrl(file); } } async function uploadOrEmbed(file) { try { return await uploadFile(file); } catch (_) { return compressImage(file); } }"
  ],
  [
    "if (!source || event.target.closest('button,a,input,textarea,select,label')) return; const kind = source.hasAttribute('data-item-id') ? 'item' : 'asset';",
    "if (!source) return; const kind = source.hasAttribute('data-item-id') ? 'item' : 'asset'; if (kind === 'item' && event.target.closest('a,input,textarea,select,label,button')) return; if (kind === 'asset' && event.target.closest('input,textarea,select,label')) return;"
  ],
  [
    "const ordered = Array.from(card.children).filter((node) => node === drag.placeholder || node.matches?.('[data-item-id]')); drag.targetIndex = ordered.indexOf(drag.placeholder);",
    "const ordered = Array.from(card.children).filter((node) => (node === drag.placeholder || node.matches?.('[data-item-id]')) && node !== drag.source); drag.targetIndex = ordered.indexOf(drag.placeholder);"
  ],
  [
    "let to = Math.max(0, Math.min(drag.targetIndex, items.length - 1)); if (from >= 0 && from !== to) commit('Elemento movido', () => { const [item] = items.splice(from, 1); if (to > from) to -= 1; items.splice(to, 0, item); state.selectedItemId = item.id; });",
    "const to = Math.max(0, Math.min(drag.targetIndex, items.length - 1)); if (from >= 0 && from !== to) commit('Elemento movido', () => { const [item] = items.splice(from, 1); items.splice(to, 0, item); state.selectedItemId = item.id; });"
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

const forbidden = ['app-motion.js', 'app-sheet-swipe.js', 'app-prime-safe.js', 'app-fix.js', 'app-upload-fix.js', 'app-product-v58.js'];
const index = await readFile(new URL('../dist/johankarrdbuildr/index.html', import.meta.url), 'utf8');
for (const legacy of forbidden) {
  if (index.includes(legacy)) throw new Error(`Legacy builder layer still loaded: ${legacy}`);
}

for (const required of ['data-canvas', 'data-inspector', 'data-mobile-publish', 'data-export', 'app-v60.js']) {
  if (!index.includes(required)) throw new Error(`Builder smoke check missing: ${required}`);
}

await writeFile(file, source, 'utf8');
const check = spawnSync(process.execPath, ['--check', file.pathname], { encoding: 'utf8' });
if (check.status !== 0) throw new Error(check.stderr || 'Johankarrd v60 syntax check failed');

console.log('Johankarrd PRIME QA passed: unified store, stable IDs, direct reorder, mobile sheets, assets, export and publish.');
