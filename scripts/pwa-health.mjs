import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';

const requiredFiles = [
  'index.html',
  'public/manifest.webmanifest',
  'public/service-worker.js',
  'public/pwa-register.js',
  'public/pwa.css',
  'public/offline.html',
  'public/assets/boostr-entry/entry.css',
  'public/assets/boostr-entry/entry.js'
];

for (const file of requiredFiles) await access(file, constants.R_OK);

const [index, manifestText, worker, register, entryJs, entryCss, viteConfig] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('public/manifest.webmanifest', 'utf8'),
  readFile('public/service-worker.js', 'utf8'),
  readFile('public/pwa-register.js', 'utf8'),
  readFile('public/assets/boostr-entry/entry.js', 'utf8'),
  readFile('public/assets/boostr-entry/entry.css', 'utf8'),
  readFile('vite.config.js', 'utf8')
]);

const manifest = JSON.parse(manifestText);
const assertions = [
  [index.includes('id="loginChoice"') && index.includes('href="/login/"'), 'official entry exposes login'],
  [index.includes('id="auditChoice"') && index.includes('href="/audit/"'), 'official entry exposes Audit'],
  [index.includes('/accept-invite/'), 'official entry exposes invitation path'],
  [index.includes('/portfolio/'), 'official entry exposes exploration path'],
  [index.includes('session-ui.js'), 'entry consumes the real session API UI'],
  [manifest.start_url === '/?source=pwa', 'PWA starts at the official entry'],
  [manifest.display === 'standalone', 'manifest uses standalone display'],
  [manifest.shortcuts?.some((item) => item.url.startsWith('/login/')), 'manifest includes login shortcut'],
  [manifest.shortcuts?.some((item) => item.url.startsWith('/audit/')), 'manifest includes Audit shortcut'],
  [worker.includes("'/api/'") && worker.includes("'/login'"), 'service worker protects private routes'],
  [worker.includes('boostr-pwa-v2'), 'service worker cache version is current'],
  [register.includes("serviceWorker.register('/service-worker.js'"), 'service worker registration exists'],
  [entryJs.includes('boostrSessionReady') && entryJs.includes('boostrSessionMissing'), 'entry handles authenticated and guest states'],
  [entryJs.includes("params.get('source') === 'pwa'"), 'installed launch is session aware'],
  [entryCss.includes('@media (max-width: 820px)'), 'mobile layout exists'],
  [viteConfig.includes("href: '/manifest.webmanifest'"), 'Vite injects manifest'],
  [viteConfig.includes("src: '/pwa-register.js'"), 'Vite injects PWA registration'],
  [viteConfig.includes('viewport-fit=cover'), 'iPhone safe-area viewport is enabled']
];

const failures = assertions.filter(([ok]) => !ok).map(([, label]) => label);
if (failures.length) {
  console.error('BOOSTR PWA health failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`BOOSTR PWA health passed (${assertions.length} assertions).`);
