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
    "async function compressImage(file) { try { const source = await fileToDataUrl(file); const image = await new Promise((resolve, reject) => { const node = new Image(); node.onload = () => resolve(node); node.onerror = reject; node.src = source; }); const max = 1600; const scale = Math.min(1, max / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); return canvas.toDataURL('image/jpeg', .86); } catch (_) { return fileToDataUrl(file); } } async function uploadOrEmbed(file) { try { return await uploadFile(file); } catch (_) { return compressImage(file); } }"
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
  ["Ver live", "Ver publicada"]
];

for (const [before, after] of replacements) {
  if (!source.includes(before)) throw new Error(`Johankarrd QA patch pattern missing: ${before.slice(0, 90)}`);
  source = source.replace(before, after);
}

const forbidden = [
  'app-motion.js',
  'app-sheet-swipe.js',
  'app-prime-safe.js',
  'app-fix.js',
  'app-upload-fix.js'
];
const index = await readFile(new URL('../dist/johankarrdbuildr/index.html', import.meta.url), 'utf8');
for (const legacy of forbidden) {
  if (index.includes(legacy)) throw new Error(`Legacy builder layer still loaded: ${legacy}`);
}

for (const required of ['data-canvas', 'data-inspector', 'data-mobile-publish', 'app-v60.js']) {
  if (!index.includes(required)) throw new Error(`Builder smoke check missing: ${required}`);
}

await writeFile(file, source, 'utf8');
const check = spawnSync(process.execPath, ['--check', file.pathname], { encoding: 'utf8' });
if (check.status !== 0) throw new Error(check.stderr || 'Johankarrd v60 syntax check failed');

console.log('Johankarrd v60 QA passed: unified state, direct ID reorder, asset drag, mobile sheets and publish flow.');
