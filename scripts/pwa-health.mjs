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

const [manifestSource, worker, registration, pwaCss, offline, headers, viteConfig] = await Promise.all([
  read('public/manifest.webmanifest'),
  read('public/service-worker.js'),
  read('public/pwa-register.js'),
  read('public/pwa.css'),
  read('public/offline.html'),
  read('public/_headers'),
  read('vite.config.js')
]);

let manifest;
try {
  manifest = JSON.parse(manifestSource);
} catch (error) {
  failures.push(`manifest.webmanifest is invalid JSON: ${error.message}`);
}

if (manifest) {
  if (manifest.name !== 'BOOSTR Labs') failures.push('manifest name must be BOOSTR Labs');
  if (manifest.short_name !== 'BOOSTR') failures.push('manifest short_name must be BOOSTR');
  if (manifest.display !== 'standalone') failures.push('manifest display must be standalone');
  if (manifest.scope !== '/') failures.push('manifest scope must be /');
  if (!String(manifest.start_url || '').startsWith('/')) failures.push('manifest start_url must be same-origin');
  if (!Array.isArray(manifest.icons) || manifest.icons.length < 1) failures.push('manifest requires at least one icon');
}

const workerRequirements = [
  "request.method !== 'GET'",
  "'/api/'",
  "'/login'",
  "'/manager'",
  "'/pay'",
  "url.searchParams.has('pin')",
  "url.searchParams.has('token')",
  "request.headers.has('authorization')",
  "request.headers.has('x-manager-pin')",
  "request.mode === 'navigate'",
  "cache.match(OFFLINE_URL)",
  "event.data?.type === 'SKIP_WAITING'"
];

for (const requirement of workerRequirements) {
  if (!worker.includes(requirement)) failures.push(`service worker missing privacy/update guard: ${requirement}`);
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

if (failures.length) {
  console.error('BOOSTR PWA HEALTH: FAILED');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('BOOSTR PWA HEALTH: PASSED');
