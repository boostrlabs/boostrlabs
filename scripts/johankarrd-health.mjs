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
  creative: 'public/johankarrdbuildr/app-v66-creative-controls.js',
  baseCss: 'public/johankarrdbuildr/prime-v60.css',
  hardeningCss: 'public/johankarrdbuildr/prime-v63-hardening.css',
  creativeCss: 'public/johankarrdbuildr/prime-v66-creative-controls.css',
  renderer: 'functions/_lib/johankarrd-renderer.js',
  middleware: 'functions/_middleware.js',
  patch: 'scripts/patch-johankarrd-v60.mjs'
};

for (const [name, path] of Object.entries(paths)) {
  const info = await stat(new URL(path, root)).catch(() => null);
  if (!info?.isFile() || info.size < 20) fail(`${name} file is missing or empty: ${path}`);
}

const sources = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, path]) => [key, await read(path)])));
const { index, app, hardening, creative, baseCss, hardeningCss, creativeCss, renderer, middleware, patch, core } = sources;

if (!/<html lang="es">/.test(index)) fail('document language is not Spanish');
if ((index.match(/<script\b/g) || []).length !== 5) fail('builder must load exactly five scripts: data, core, app, hardening and creative controls');

const loadOrder = ['johankarrd-data.js', 'core-v64.js', 'app-v60.js', 'app-v63-hardening.js', 'app-v66-creative-controls.js'].map((name) => index.indexOf(name));
if (loadOrder.some((position) => position < 0) || loadOrder.some((position, i) => i && position <= loadOrder[i - 1])) fail('unsafe script load order');

for (const asset of [
  './johankarrd-data.js?v=66', './core-v64.js?v=66', './app-v60.js?v=66',
  './app-v63-hardening.js?v=66', './app-v66-creative-controls.js?v=66',
  './prime-v60.css?v=66', './prime-v63-hardening.css?v=66', './prime-v66-creative-controls.css?v=66'
]) {
  if (!index.includes(asset)) fail(`missing v66 cache-busted asset: ${asset}`);
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
  if ([index, app, hardening, creative].some((source) => source.includes(phrase))) fail(`English UI copy found: ${phrase}`);
}

for (const capability of ["['text', 'Texto'", "['title', 'Título'", "['divider', 'Divisor'", 'selectedItemId', 'history: []', 'future: []', 'queueSave()', 'saveDraft(false)']) {
  if (!app.includes(capability)) fail(`core capability missing: ${capability}`);
}

for (const marker of ['moveItemExact', 'auditState', 'duplicate-item-id', 'duplicate-section-id', 'duplicate-slug', 'globalThis.JOHANKARRD_CORE']) {
  if (!core.includes(marker)) fail(`audited core marker missing: ${marker}`);
}

for (const marker of [
  'window.JOHANKARRD_CORE?.auditState', 'window.JOHANKARRD_CORE?.moveItemExact',
  'siteKey: state.currentSite', 'sectionId: state.currentSection',
  'Movimiento cancelado para proteger la sección.', 'Cambio cancelado para proteger los datos',
  'compressImage(file)', 'cloudEntries', 'replaceFunction(source', 'appleDragFunction',
  'johankarrd-dragging', 'selectstart', 'animateFlip', 'translate3d(', 'drag.settling',
  'setPointerCapture', 'Suelta aquí'
]) {
  if (!patch.includes(marker) && !hardeningCss.includes(marker)) fail(`Apple drag/build hardening marker missing: ${marker}`);
}

for (const marker of [
  'Cormorant SC', 'Playfair Display', 'Bodoni Moda', 'Divisor creativo',
  'item.letterSpacing', 'item.lineHeight', 'item.buttonHeight', 'item.maxHeight',
  'item.anchor', 'data-v66-resize', 'site.shellMode', 'Página limpia', 'Con barra BOOSTR',
  'johankarrd-custom-fonts-v66'
]) {
  if (!creative.includes(marker) && !creativeCss.includes(marker)) fail(`v66 creative capability missing: ${marker}`);
}

for (const marker of [
  "'cormorant-sc'", "'playfair-display'", "'bodoni-moda'", 'shellMode',
  'letterSpacing', 'lineHeight', 'buttonHeight', 'maxHeight', 'DIVIDER_SYMBOLS',
  'boostr-shell', 'workspace', 'externalAttrs'
]) {
  if (!renderer.includes(marker)) fail(`renderer v66 capability missing: ${marker}`);
}

for (const marker of ['isPublicJohankarrd', 'wantsWorkspaceShell', 'shellRequestedByPage', 'shouldInjectRuntime']) {
  if (!middleware.includes(marker)) fail(`public shell isolation missing: ${marker}`);
}

if (!/path\s*===\s*["']\/johankarrd["']\s*\|\|\s*path\.startsWith\(["']\/johankarrd\/["']\)/.test(middleware)) fail('public Johankarrd route isolation missing');
if (!renderer.includes('<meta name="boostr-shell"')) fail('renderer shell metadata missing');

for (const marker of ['aria-modal', 'aria-live', 'focus', 'Delete', 'Backspace', 'Termina de mover el elemento primero.', 'Texto actualizado.']) {
  if (!hardening.includes(marker)) fail(`interaction hardening missing: ${marker}`);
}

for (const marker of ['prefers-reduced-motion', 'focus-visible', 'mobile-sheet', 'drag-placeholder', 'drag-ghost', 'drag-source', '-webkit-user-select:none', 'touch-action:none']) {
  if (!hardeningCss.includes(marker) && !baseCss.includes(marker)) fail(`motion/accessibility CSS missing: ${marker}`);
}

for (const marker of ['v66-resize-grip', 'v66-shapes', 'v66-segmented', 'v66-section-chips', 'v66-resizing']) {
  if (!creativeCss.includes(marker)) fail(`creative CSS missing: ${marker}`);
}

for (const forbidden of ['location.reload(', 'location.replace(', 'document.location', 'window.location =']) {
  if ([app, hardening, creative, patch].some((source) => source.includes(forbidden))) fail(`reload-based UX found: ${forbidden}`);
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

for (const file of [
  ...Object.values(paths).filter((path) => path.endsWith('.js') || path.endsWith('.mjs')),
  'scripts/johankarrd-core-tests.mjs', 'scripts/johankarrd-dist-health.mjs'
]) {
  const check = spawnSync(process.execPath, ['--check', new URL(file, root).pathname], { encoding: 'utf8' });
  if (check.status !== 0) fail(`${file} has invalid syntax\n${check.stderr}`);
}

const coreTests = spawnSync(process.execPath, [new URL('scripts/johankarrd-core-tests.mjs', root).pathname], { encoding: 'utf8' });
if (coreTests.status !== 0) fail(`core invariant tests failed\n${coreTests.stdout}\n${coreTests.stderr}`);

console.log(coreTests.stdout.trim());
console.log('Johankarrd source health passed: v66 creative controls, client-clean public pages, optional BOOSTR shell, Apple drag, renderer parity and API safety.');
