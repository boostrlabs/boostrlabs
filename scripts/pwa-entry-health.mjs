import { readFileSync } from 'node:fs';

const failures = [];
const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
const root = readFileSync('index.html', 'utf8');
const sessionUi = readFileSync('public/assets/boostr-mother/session-ui.js', 'utf8');
const productionShell = readFileSync('public/assets/boostr-mother/production-shell.js', 'utf8');
const middleware = readFileSync('functions/_middleware.js', 'utf8');
const app = readFileSync('public/app/index.html', 'utf8');
const workspace = readFileSync('public/app/workspace/index.html', 'utf8');
const login = readFileSync('public/login/index.html', 'utf8');

if (manifest.start_url !== '/app/?source=pwa') failures.push(`Unexpected PWA start_url: ${manifest.start_url}`);
if (manifest.scope !== '/') failures.push(`Unexpected PWA scope: ${manifest.scope}`);
if (manifest.display !== 'standalone') failures.push(`Unexpected PWA display mode: ${manifest.display}`);
if (!root.includes('(display-mode: standalone)')) failures.push('Root page does not detect standalone launch mode');
if (!root.includes("const target = standalone ? '/app/?source=pwa' : '/app/'")) failures.push('Root domain does not route every launch to BOOSTR App');
if (!root.includes('window.location.replace(target)')) failures.push('Root page does not replace the legacy landing with BOOSTR App');
for (const legacyMarker of ['The system layer behind modern businesses.', 'Mother UI', 'Backend/auth/data pending Codex']) {
  if (root.includes(legacyMarker)) failures.push(`Root domain still exposes legacy landing marker: ${legacyMarker}`);
}
if (!sessionUi.includes('redirectInstalledLaunch')) failures.push('Shared session UI does not repair legacy installed PWA entry routes');
if (!sessionUi.includes('/manifest.webmanifest')) failures.push('Shared session UI does not expose the PWA manifest');

for (const marker of ['SMART PARKING', 'BOOSTR EATS', 'BOOSTR RIDES', 'BOOSTR EXOTIC', 'SERVICIOS', 'OMNI JR Parking']) {
  if (!app.includes(marker)) failures.push(`BOOSTR App gateway missing ${marker}`);
}
for (const marker of ['/assets/logos/boostr-logo-nav.png', 'Inicia sesión con tus credenciales BOOSTR.', 'id="quickLoginForm"', 'También puedes abrir un servicio disponible sin iniciar sesión.']) {
  if (!app.includes(marker)) failures.push(`BOOSTR App brand or access entry missing marker: ${marker}`);
}
for (const marker of ['data-autofill-proof="contenteditable"', 'contenteditable="plaintext-only"', 'id="boostrIdentifier"', 'id="boostrPassword"', 'class="credential-field masked-secret"', 'systemSecretPattern', 'looksLikeSystemSecret', 'validIdentifier', 'Ese valor parece una clave de sistema']) {
  if (!app.includes(marker)) failures.push(`BOOSTR App credential isolation missing marker: ${marker}`);
}
const appCredentialStart = app.indexOf('data-autofill-proof="contenteditable"');
const appCredentialEnd = app.indexOf('<div class="login-links">', appCredentialStart);
const appCredentialBlock = appCredentialStart >= 0 && appCredentialEnd > appCredentialStart ? app.slice(appCredentialStart, appCredentialEnd) : '';
if (!appCredentialBlock) failures.push('BOOSTR App credential block could not be isolated');
for (const forbidden of ['<input', '<form', 'autocomplete=', 'name="boostr_account_identifier"', 'name="boostr_account_secret"', 'type="password"']) {
  if (appCredentialBlock.includes(forbidden)) failures.push(`BOOSTR App credential block still exposes Safari autofill trigger: ${forbidden}`);
}
for (const marker of ['🍽️', '🚘', '🏎️', 'PRÓXIMAMENTE', 'aria-disabled="true"']) {
  if (!app.includes(marker)) failures.push(`BOOSTR App unavailable-service presentation missing marker: ${marker}`);
}
for (const forbidden of ['¿Qué necesitas resolver hoy?', 'Pagar parking', 'Iniciar Audit', 'Tu cuenta.<br>Tu OS.', 'Entra a tu espacio.', '¿Aún no tienes sistema?', 'href="/audit/"']) {
  if (app.includes(forbidden)) failures.push(`BOOSTR App still exposes rejected landing content: ${forbidden}`);
}

for (const marker of ['id="accessPanel"', 'id="memberPanel" hidden', 'roleContext(session)', '/accept-invite/', "fetch('/api/session'", "method:'POST'"]) {
  if (!app.includes(marker)) failures.push(`BOOSTR App persona router or inline login missing marker: ${marker}`);
}
for (const forbidden of ['boostr-mother/console.js', 'class="sidebar', 'Rutas del ecosistema', 'Manager Missions', 'Creative Missions']) {
  if (app.includes(forbidden)) failures.push(`BOOSTR App still exposes internal UI: ${forbidden}`);
}

if (!middleware.includes('const isPublicAppGateway = path === "/app"')) failures.push('Middleware does not classify exact /app as public');
if (!middleware.includes('const isNestedAppSurface = path.startsWith("/app/")')) failures.push('Middleware does not protect nested /app routes');
if (!middleware.includes('const isPublicExperience = isPublicAppGateway')) failures.push('Public app gateway can still receive the private runtime');
if (!productionShell.includes("const isPublicAppGateway = path === '/app'")) failures.push('Production shell does not exempt exact /app');
if (!productionShell.includes("const isNestedAppSurface = path.startsWith('/app/')")) failures.push('Production shell does not protect nested app routes');
if (!productionShell.includes("'/app/workspace'")) failures.push('Private workspace is not recognized by the production shell');

for (const marker of ['ESPACIO PRIVADO', '/api/session', '/api/dashboard', '/login/?next=/app/workspace/']) {
  if (!workspace.includes(marker)) failures.push(`Private workspace missing marker: ${marker}`);
}
for (const marker of ['roleDestination(data)', "return'/app/workspace/'", 'Usar servicios como guest', 'Bienvenido<br>de vuelta.', '/assets/logos/boostr-logo-nav.png']) {
  if (!login.includes(marker)) failures.push(`Login role router or brand UI missing marker: ${marker}`);
}
for (const marker of ['data-autofill-proof="contenteditable"', 'contenteditable="plaintext-only"', 'id="boostrLoginIdentifier"', 'id="boostrLoginSecret"', 'class="credential-field masked-secret"', 'looksLikeSystemSecret', 'validIdentifier', 'Ese valor parece una clave de sistema']) {
  if (!login.includes(marker)) failures.push(`Dedicated login credential isolation missing marker: ${marker}`);
}
const loginCredentialStart = login.indexOf('data-autofill-proof="contenteditable"');
const loginCredentialEnd = login.indexOf('<div class="links">', loginCredentialStart);
const loginCredentialBlock = loginCredentialStart >= 0 && loginCredentialEnd > loginCredentialStart ? login.slice(loginCredentialStart, loginCredentialEnd) : '';
if (!loginCredentialBlock) failures.push('Dedicated login credential block could not be isolated');
for (const forbidden of ['<input', '<form', 'autocomplete=', 'name="boostr_login_identifier"', 'name="boostr_login_secret"', 'type="password"']) {
  if (loginCredentialBlock.includes(forbidden)) failures.push(`Dedicated login still exposes Safari autofill trigger: ${forbidden}`);
}

for (const [name, html] of [['app', app], ['workspace', workspace], ['login', login]]) {
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  for (const [index, script] of scripts.entries()) {
    try { new Function(script); }
    catch (error) { failures.push(`${name} inline script ${index + 1} failed: ${error.message}`); }
  }
}

if (failures.length) {
  console.error('BOOSTR PWA ENTRY HEALTH: FAILED');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('BOOSTR PWA ENTRY HEALTH: PASS');