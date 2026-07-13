import { readFile } from 'node:fs/promises';

const failures = [];

async function read(path) {
  try {
    return await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  } catch (error) {
    failures.push(`${path} could not be read: ${error.message}`);
    return '';
  }
}

const [manifestSource, worker, registration, pwaCss, offline, headers, viteConfig, landing, app, invitation] = await Promise.all([
  read('public/manifest.webmanifest'),
  read('public/service-worker.js'),
  read('public/pwa-register.js'),
  read('public/pwa.css'),
  read('public/offline.html'),
  read('public/_headers'),
  read('vite.config.js'),
  read('index.html'),
  read('public/app/index.html'),
  read('public/accept-invite/index.html')
]);

let manifest;
try {
  manifest = JSON.parse(manifestSource);
} catch (error) {
  failures.push(`manifest.webmanifest is invalid JSON: ${error.message}`);
}

if (manifest) {
  if (manifest.name !== 'BOOSTR') failures.push('manifest name must be BOOSTR');
  if (manifest.short_name !== 'BOOSTR') failures.push('manifest short_name must be BOOSTR');
  if (manifest.display !== 'standalone') failures.push('manifest display must be standalone');
  if (manifest.scope !== '/') failures.push('manifest scope must be /');
  if (manifest.start_url !== '/app/?source=pwa') failures.push('manifest must launch the BOOSTR App module launcher');
  if (!Array.isArray(manifest.icons) || manifest.icons.length < 1) failures.push('manifest requires at least one icon');
}

const workerRequirements = [
  "request.method !== 'GET'",
  "'/api/'",
  "'/login'",
  "'/manager'",
  "'/app'",
  "'/pay'",
  "url.searchParams.has('pin')",
  "url.searchParams.has('token')",
  "request.headers.has('authorization')",
  "request.headers.has('x-manager-pin')",
  "request.mode === 'navigate'",
  'cache.match(OFFLINE_URL)',
  "event.data?.type === 'SKIP_WAITING'",
  "boostr-pwa-v2"
];

for (const requirement of workerRequirements) {
  if (!worker.includes(requirement)) failures.push(`service worker missing privacy/update guard: ${requirement}`);
}

for (const requirement of ["location.replace(target)", "'/app/?source=pwa'", 'Abriendo BOOSTR App']) {
  if (!landing.includes(requirement)) failures.push(`PWA root redirect missing requirement: ${requirement}`);
}

for (const requirement of ['SMART PARKING', 'BOOSTR EATS', 'BOOSTR RIDES', 'BOOSTR EXOTIC', 'id="guestPanel"', 'id="privatePanel" hidden', "fetch('/api/session'", "cache:'no-store'", '/login/?next=/app/']) {
  if (!app.includes(requirement)) failures.push(`BOOSTR App missing requirement: ${requirement}`);
}

for (const forbidden of ['boostr-mother/console.js', 'class="sidebar', 'Rutas del ecosistema', 'Manager Missions', 'Creative Missions']) {
  if (app.includes(forbidden)) failures.push(`BOOSTR App exposes internal guest UI: ${forbidden}`);
}

const inlineScripts = [...app.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
for (const [index, script] of inlineScripts.entries()) {
  try { new Function(script); }
  catch (error) { failures.push(`BOOSTR App inline script ${index + 1} failed: ${error.message}`); }
}

const invitationRequirements = [
  'Tu espacio BOOSTR está listo.',
  'No necesitas ingresar información de pago.',
  'id="invite_token"',
  'normalizeToken',
  "fetch('/api/invitations/accept'",
  'data-i18n="tokenLabel"',
  'safeDestination'
];

for (const requirement of invitationRequirements) {
  if (!invitation.includes(requirement)) failures.push(`invitation experience missing requirement: ${requirement}`);
}

if (!registration.includes("register('/service-worker.js'")) failures.push('service worker is not registered');
if (!registration.includes('Update BOOSTR')) failures.push('controlled update action is missing');
if (!registration.includes('Add to Home Screen')) failures.push('iPhone install guidance is missing');
if (!pwaCss.includes('safe-area-inset-bottom')) failures.push('safe-area support is missing');
if (!pwaCss.includes('display-mode: standalone') && !pwaCss.includes('boostr-standalone')) failures.push('standalone styling is missing');
if (!offline.includes('did not load stored business data')) failures.push('offline page must state that current business data was not loaded');
if (!headers.includes('/service-worker.js') || !headers.includes('no-cache, no-store')) failures.push('service worker cache headers are missing');
if (!headers.includes('/api/*') || !headers.includes('no-store')) failures.push('API no-store header is missing');
if (!viteConfig.includes("href: '/manifest.webmanifest'")) failures.push('manifest is not injected into the root page');
if (!viteConfig.includes("src: '/pwa-register.js'")) failures.push('PWA registration script is not injected into the root page');
if (!viteConfig.includes('apple-mobile-web-app-capable')) failures.push('Apple standalone metadata is missing');
if (!viteConfig.includes('viewport-fit=cover')) failures.push('iPhone viewport safe-area support is missing');

if (failures.length) {
  console.error('BOOSTR PWA HEALTH: FAILED');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('BOOSTR PWA HEALTH: PASSED');
