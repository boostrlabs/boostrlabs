import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const fail = (message) => { throw new Error(`Johankarrd health check failed: ${message}`); };

const paths = {
  index: 'public/johankarrdbuildr/index.html',
  data: 'public/johankarrdbuildr/johankarrd-data.js',
  core: 'public/johankarrdbuildr/core-v64.js',
  app: 'public/johankarrdbuildr/app-v60.js',
  hardening: 'public/johankarrdbuildr/app-v63-hardening.js',
  baseCss: 'public/johankarrdbuildr/prime-v60.css',
  hardeningCss: 'public/johankarrdbuildr/prime-v63-hardening.css',
  renderer: 'functions/_lib/johankarrd-renderer.js',
  patch: 'scripts/patch-johankarrd-v60.mjs'
};

for (const [name, path] of Object.entries(paths)) {
  const info = await stat(new URL(path, root)).catch(() => null);
  if (!info?.isFile() || info.size < 20) fail(`${name} file is missing or empty: ${path}`);
}

const [index, data, core, app, hardening, baseCss, hardeningCss, renderer, patch] = await Promise.all(Object.values(paths).map(read));

if (!/<html lang="es">/.test(index)) fail('document language is not Spanish');
if ((index.match(/<script\b/g) || []).length !== 4) fail('builder must load exactly four scripts: data, core, app and hardening');

const loadOrder = ['johankarrd-data.js', 'core-v64.js', 'app-v60.js', 'app-v63-hardening.js'].map((name) => index.indexOf(name));
if (loadOrder.some((position) => position < 0) || loadOrder.some((position, i) => i && position <= loadOrder[i - 1])) fail('unsafe script load order');

for (const asset of ['./johankarrd-data.js?v=64', './core-v64.js?v=64', './app-v60.js?v=64', './app-v63-hardening.js?v=64', './prime-v60.css?v=64', './prime-v63-hardening.css?v=64']) {
  if (!index.includes(asset)) fail(`missing v64 cache-busted asset: ${asset}`);
}

const forbiddenLayers = ['app-motion.js', 'app-sheet-swipe.js', 'app-prime-safe.js', 'app-fix.js', 'app-upload-fix.js', 'app-product-v58.js', 'app-ux-v58.js', 'app-final-v59.js', 'app-v62-enhance.js'];
for (const name of forbiddenLayers) if (index.includes(name)) fail(`legacy layer still loaded: ${name}`);

for (const required of ['data-canvas', 'data-inspector', 'data-mobile-publish', 'data-export', 'data-modal-root', 'data-toast-root']) {
  if (!index.includes(required)) fail(`index is missing ${required}`);
}

for (const copy of [
  'Full Pro Premium HD Extreme Platinum',
  'Johankarrds disponibles',
  'Ser esposa del BURLIGAN CORP CEO y, por consecuencia, también CEO.',
  'Duración: de por vida o hasta que te divorcies de Janko.'
]) {
  if (!index.includes(copy) && !app.includes(copy)) fail(`BURLI CLUB copy changed: ${copy}`);
}

for (const phrase of [
  'Add divider', 'Ghost spacer', 'Optional label', 'Tap action', 'No action',
  'Upload asset', 'Quick actions', 'Site manager', 'Open live', 'Delete item',
  'Add element', 'New section', 'Choose image'
]) {
  if ([index, app, hardening].some((source) => source.includes(phrase))) fail(`English UI copy found: ${phrase}`);
}

for (const capability of ["['text', 'Texto'", "['title', 'Título'", "['divider', 'Divisor'", 'selectedItemId', 'history: []', 'future: []', 'queueSave()', 'saveDraft(false)']) {
  if (!app.includes(capability)) fail(`core capability missing: ${capability}`);
}

for (const marker of ['moveItemExact', 'auditState', 'duplicate-item-id', 'duplicate-section-id', 'duplicate-slug', 'globalThis.JOHANKARRD_CORE']) {
  if (!core.includes(marker)) fail(`audited core marker missing: ${marker}`);
}

for (const marker of [
  'window.JOHANKARRD_CORE?.auditState',
  'window.JOHANKARRD_CORE?.moveItemExact',
  'siteKey: state.currentSite, sectionId: state.currentSection',
  'Movimiento cancelado para proteger la sección.',
  'Cambio cancelado para proteger los datos',
  'compressImage(file)',
  'cloudEntries'
]) {
  if (!patch.includes(marker)) fail(`build hardening marker missing: ${marker}`);
}

for (const rendererCapability of ["type === 'text'", "type === 'title'", "type === 'divider'", "type === 'gallery'", "type === 'links'", 'fontFamily']) {
  if (!renderer.includes(rendererCapability)) fail(`renderer capability missing: ${rendererCapability}`);
}

for (const marker of ['aria-modal', 'aria-live', 'focus', 'Delete', 'Backspace', 'Termina de mover el elemento primero.', 'Texto actualizado.']) {
  if (!hardening.includes(marker)) fail(`interaction hardening missing: ${marker}`);
}

for (const marker of ['prefers-reduced-motion', 'focus-visible', 'mobile-sheet', 'drag-placeholder']) {
  if (!hardeningCss.includes(marker) && !baseCss.includes(marker)) fail(`motion/accessibility CSS missing: ${marker}`);
}

for (const forbidden of ['location.reload(', 'location.replace(', 'document.location', 'window.location =']) {
  if ([app, hardening, patch].some((source) => source.includes(forbidden))) fail(`reload-based UX found: ${forbidden}`);
}

const endpointPaths = [
  'functions/api/johankarrd/sites.js',
  'functions/api/johankarrd/drafts.js',
  'functions/api/johankarrd/render.js',
  'functions/api/johankarrd/publish.js',
  'functions/api/johankarrd/delete.js',
  'functions/api/johankarrd/assets.js'
];
for (const endpoint of endpointPaths) {
  const info = await stat(new URL(endpoint, root)).catch(() => null);
  if (!info?.isFile() || info.size < 20) fail(`API endpoint missing: ${endpoint}`);
}

for (const file of [...Object.values(paths).filter((path) => path.endsWith('.js') || path.endsWith('.mjs')), 'scripts/johankarrd-core-tests.mjs', 'scripts/johankarrd-dist-health.mjs']) {
  const check = spawnSync(process.execPath, ['--check', new URL(file, root).pathname], { encoding: 'utf8' });
  if (check.status !== 0) fail(`${file} has invalid syntax\n${check.stderr}`);
}

const coreTests = spawnSync(process.execPath, [new URL('scripts/johankarrd-core-tests.mjs', root).pathname], { encoding: 'utf8' });
if (coreTests.status !== 0) fail(`core invariant tests failed\n${coreTests.stdout}\n${coreTests.stderr}`);

console.log(coreTests.stdout.trim());
console.log('Johankarrd source health passed: strict load order, audited mutations, protected reorder, Spanish UI, renderer parity, APIs and accessibility gates.');
