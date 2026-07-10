import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const root = new URL('../dist/johankarrdbuildr/', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const fail = (message) => { throw new Error(`Johankarrd dist health failed: ${message}`); };

const files = ['index.html', 'johankarrd-data.js', 'core-v64.js', 'app-v60.js', 'app-v63-hardening.js', 'prime-v60.css', 'prime-v63-hardening.css'];
for (const file of files) {
  const info = await stat(new URL(file, root)).catch(() => null);
  if (!info?.isFile() || info.size < 20) fail(`missing or empty ${file}`);
}

const [index, core, app, hardening, css] = await Promise.all([
  read('index.html'),
  read('core-v64.js'),
  read('app-v60.js'),
  read('app-v63-hardening.js'),
  read('prime-v63-hardening.css')
]);

for (const asset of ['./johankarrd-data.js?v=64', './core-v64.js?v=64', './app-v60.js?v=64', './app-v63-hardening.js?v=64']) {
  if (!index.includes(asset)) fail(`cache-busted asset missing: ${asset}`);
}

const order = ['johankarrd-data.js', 'core-v64.js', 'app-v60.js', 'app-v63-hardening.js'].map((name) => index.indexOf(name));
if (order.some((value) => value < 0) || order.some((value, index) => index && value <= order[index - 1])) fail('script load order is unsafe');

for (const marker of [
  'window.JOHANKARRD_CORE?.auditState',
  'window.JOHANKARRD_CORE?.moveItemExact',
  'siteKey: state.currentSite, sectionId: state.currentSection',
  'Movimiento cancelado para proteger la sección.',
  'Cambio cancelado para proteger los datos',
  'compressImage(file)',
  'cloudEntries',
  'data-export-site'
]) {
  if (!app.includes(marker)) fail(`built app missing hardening marker: ${marker}`);
}

for (const marker of ['moveItemExact', 'auditState', 'duplicate-item-id', 'duplicate-section-id', 'duplicate-slug']) {
  if (!core.includes(marker)) fail(`core missing invariant marker: ${marker}`);
}

for (const marker of ['aria-modal', 'focus', 'pointerup', 'Termina de mover el elemento primero.', 'Texto actualizado.']) {
  if (!hardening.includes(marker)) fail(`hardening layer missing ${marker}`);
}

for (const marker of ['prefers-reduced-motion', 'focus-visible', 'mobile-sheet', 'drag-placeholder']) {
  if (!css.includes(marker)) fail(`hardening CSS missing ${marker}`);
}

for (const forbidden of ['location.reload(', 'location.replace(', 'app-motion.js', 'app-v62-enhance.js', 'Add divider', 'Ghost spacer', 'Tap action', 'No action']) {
  if (index.includes(forbidden) || app.includes(forbidden) || hardening.includes(forbidden)) fail(`forbidden artifact found: ${forbidden}`);
}

for (const file of ['core-v64.js', 'app-v60.js', 'app-v63-hardening.js']) {
  const check = spawnSync(process.execPath, ['--check', new URL(file, root).pathname], { encoding: 'utf8' });
  if (check.status !== 0) fail(`${file} has invalid syntax\n${check.stderr}`);
}

console.log('Johankarrd dist health passed: v64 load order, audited mutations, protected drag, Spanish UI and built artifact integrity.');
