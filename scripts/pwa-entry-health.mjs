import { readFileSync } from 'node:fs';

const failures = [];
const read = (path) => readFileSync(path, 'utf8');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const root = read('index.html');
const app = read('public/app/index.html');
const login = read('public/login/index.html');
const workspace = read('public/app/workspace/index.html');
const clientAudit = read('public/client-audit/index.html');
const registry = read('public/assets/boostr-launcher/registry.js');
const osSymbols = read('public/assets/boostr-launcher/os-symbols.svg');
const hummusWordmark = read('public/assets/boostr-launcher/hummus-wordmark.svg');
const middleware = read('functions/_middleware.js');
const shell = read('public/assets/boostr-mother/production-shell.js');
const sessionUi = read('public/assets/boostr-mother/session-ui.js');

const need = (source, markers, label) => markers.forEach((marker) => {
  if (!source.includes(marker)) failures.push(`${label}: ${marker}`);
});
const forbid = (source, markers, label) => markers.forEach((marker) => {
  if (source.includes(marker)) failures.push(`${label}: ${marker}`);
});

if (manifest.start_url !== '/app/?source=pwa') failures.push('manifest start_url');
if (manifest.scope !== '/') failures.push('manifest scope');
if (manifest.display !== 'standalone') failures.push('manifest display');
need(root, ['(display-mode: standalone)', "const target = standalone ? '/app/?source=pwa' : '/app/'", 'window.location.replace(target)'], 'root');
need(sessionUi, ['redirectInstalledLaunch', '/manifest.webmanifest'], 'session ui');

need(app, [
  'data-no-marketplace="true"',
  'data-launcher-level="os-only"',
  'Operating Systems',
  '/assets/boostr-launcher/registry.js',
  '/assets/boostr-launcher/os-symbols.svg#',
  'Entrar al BOOSTR WORKER OS',
  '¿Nuevo en BOOSTR?',
  'Soy negocio',
  'Soy cliente',
  'href="/audit/"',
  'href="/client-audit/"',
  "fetch('/api/session'",
  'maximum-scale=1',
  'user-scalable=no',
  "addEventListener('gesturestart'",
  "addEventListener('gesturechange'",
  "addEventListener('touchmove'"
], 'app');
forbid(app, [
  'id="quickLoginForm"',
  'boostrIdentifier',
  'boostrPassword',
  '¿Qué necesitas resolver hoy?',
  'Pagar parking',
  'Iniciar Audit',
  'href="/ecosystem/"',
  'href="/modules/"',
  'href="/hummusfl/"',
  'href="/jankodiorr/"',
  'href="/82ngel/"'
], 'app forbidden');

need(registry, [
  'BOOSTR_OS_LAUNCHER',
  "id: 'worker'",
  "name: 'BOOSTR WORKER OS'",
  "id: 'parking'",
  "name: 'PARKING OS'",
  "id: 'restaurant'",
  "name: 'RESTAURANT OS'",
  "id: 'automotive'",
  "name: 'AUTOMOTIVE OS'",
  "id: 'artist'",
  "name: 'ARTIST OS'",
  "id: 'payments'",
  "name: 'PAYMENTS OS'",
  "id: 'beauty'",
  "name: 'BEAUTY OS'",
  "guestState: 'public'",
  "publicRoute: '/parking/omni-jr/'",
  "guestState: 'locked'",
  'visible_modules',
  'workspaces',
  'personas',
  'resolveSystems',
  '/assets/omni-jr/omni-jr-logo-black.svg',
  '/assets/boostr-launcher/hummus-wordmark.svg',
  '/assets/link/janko/janko-logo-white-hd.png',
  '/assets/link/82ngel/logo.png'
], 'launcher registry');
forbid(registry, [
  "publicRoute: '/hummusfl/'",
  "publicRoute: '/jankodiorr/'",
  "publicRoute: '/82ngel/'",
  "publicRoute: '/ecosystem/'"
], 'registry public navigation');

for (const symbol of ['worker', 'parking', 'restaurant', 'automotive', 'artist', 'payments', 'beauty', 'core']) {
  if (!osSymbols.includes(`id="${symbol}"`)) failures.push(`OS symbol missing: ${symbol}`);
}
need(hummusWordmark, ['Hummus Mediterranean Food', 'HUMMUS', 'MEDITERRANEAN FOOD'], 'Hummus wordmark');

need(clientAudit, [
  'data-no-marketplace="true"',
  'BOOSTR PARA CLIENTES',
  'No es un marketplace.',
  'Entras desde un negocio, una invitación o un servicio conectado.',
  'Tengo una invitación',
  'Ya tengo cuenta',
  '/accept-invite/',
  '/login/',
  'maximum-scale=1',
  'user-scalable=no'
], 'client audit');

need(login, [
  '/assets/logos/boostr-logo-nav.png',
  'data-autofill-proof="native-input"',
  'id="boostrLoginIdentifier"',
  'id="boostrLoginSecret"',
  'class="editor secret"',
  'type="text"',
  'type="password"',
  'autocomplete="username"',
  'autocomplete="current-password"',
  'validIdentifier',
  'looksLikeSecret',
  "method:'POST'",
  'maximum-scale=1',
  'user-scalable=no',
  "addEventListener('gesturestart'",
  "addEventListener('gesturechange'",
  "addEventListener('touchmove'"
], 'login');
const credentialStart = login.indexOf('data-autofill-proof="native-input"');
const credentialEnd = login.indexOf('<nav class="actions"', credentialStart);
const credentialBlock = credentialStart >= 0 && credentialEnd > credentialStart ? login.slice(credentialStart, credentialEnd) : '';
if (!credentialBlock) failures.push('credential block');
forbid(credentialBlock, ['<form', 'contenteditable', 'plaintext-only', 'Bienvenido', 'Entrar a BOOSTR', 'Olvidé mi clave'], 'login forbidden');

need(workspace, ['ESPACIO PRIVADO', '/api/session', '/api/dashboard', '/login/?next=/app/workspace/'], 'workspace');
need(middleware, ['const isPublicAppGateway = path === "/app"', 'const isNestedAppSurface = path.startsWith("/app/")', 'const isPublicExperience = isPublicAppGateway'], 'middleware');
need(shell, ["const isPublicAppGateway = path === '/app'", "const isNestedAppSurface = path.startsWith('/app/')", "'/app/workspace'"], 'shell');

try { new Function(registry); }
catch (error) { failures.push(`registry script: ${error.message}`); }
for (const [name, html] of [['app', app], ['client-audit', clientAudit], ['login', login], ['workspace', workspace]]) {
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  scripts.forEach((match, index) => {
    try { new Function(match[1]); }
    catch (error) { failures.push(`${name} script ${index + 1}: ${error.message}`); }
  });
}

if (failures.length) {
  console.error('BOOSTR PWA ENTRY HEALTH: FAILED');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('BOOSTR PWA ENTRY HEALTH: PASS');
