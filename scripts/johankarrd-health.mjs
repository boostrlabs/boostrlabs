import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const fail = (message) => { throw new Error(`Johankarrd health check failed: ${message}`); };

const [index, app, hardening, renderer] = await Promise.all([
  read('public/johankarrdbuildr/index.html'),
  read('public/johankarrdbuildr/app-v60.js'),
  read('public/johankarrdbuildr/app-v63-hardening.js'),
  read('functions/_lib/johankarrd-renderer.js')
]);

const forbiddenLayers = ['app-motion.js', 'app-sheet-swipe.js', 'app-prime-safe.js', 'app-fix.js', 'app-upload-fix.js', 'app-product-v58.js', 'app-ux-v58.js', 'app-final-v59.js', 'app-v62-enhance.js'];
for (const name of forbiddenLayers) if (index.includes(name)) fail(`legacy layer still loaded: ${name}`);

for (const required of ['app-v60.js', 'app-v63-hardening.js', 'prime-v63-hardening.css', 'data-canvas', 'data-inspector', 'data-mobile-publish']) {
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

for (const phrase of ['Add divider', 'Ghost spacer', 'Optional label', 'Tap action', 'No action', 'Upload asset', 'Quick actions']) {
  if (index.includes(phrase) || app.includes(phrase) || hardening.includes(phrase)) fail(`English UI copy found: ${phrase}`);
}

for (const capability of ["['text', 'Texto'", "['title', 'Título'", "['divider', 'Divisor'", 'selectedItemId', 'history: []', 'future: []']) {
  if (!app.includes(capability)) fail(`core capability missing: ${capability}`);
}

for (const rendererCapability of ["type === 'text'", "type === 'title'", "type === 'divider'", 'fontFamily']) {
  if (!renderer.includes(rendererCapability)) fail(`renderer capability missing: ${rendererCapability}`);
}

for (const file of ['public/johankarrdbuildr/app-v60.js', 'public/johankarrdbuildr/app-v63-hardening.js', 'scripts/patch-johankarrd-v60.mjs']) {
  const check = spawnSync(process.execPath, ['--check', new URL(file, root).pathname], { encoding: 'utf8' });
  if (check.status !== 0) fail(`${file} has invalid syntax\n${check.stderr}`);
}

console.log('Johankarrd health check passed: unified core, Spanish UI, stable editing, renderer parity and no legacy layers.');
