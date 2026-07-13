import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const middleware = read('functions/_middleware.js');
const themeRuntime = read('public/assets/boostr-theme/theme-runtime.js');
const sharedRuntime = read('public/assets/boostr-theme/shared-ui-runtime.js');
const sharedCss = read('public/assets/boostr-theme/shared-ui-v2.css');
const themeLib = read('functions/_lib/theme.js');
const app = read('public/app/index.html');
const home = read('public/home/index.html');
const payment = read('public/smart-payment-link/index.html');
const modules = read('public/modules/index.html');

assert.match(middleware, /shared-ui-v2\.css/);
assert.match(middleware, /shared-ui-runtime\.js/);
assert.match(middleware, /data-boostr-shared-ui/);
assert.match(middleware, /boostr_system_theme_v2/);

for (const protectedRoute of [
  '/app/janko',
  '/app/johanka',
  '/app/82ngel',
  '/app/parking',
  '/hummusfl',
  '/parking',
  '/jankodiorr',
  '/82ngel'
]) {
  assert.ok(middleware.includes(`"${protectedRoute}"`), `Missing custom-route protection: ${protectedRoute}`);
}

assert.match(themeRuntime, /boostr_system_theme_v2/);
assert.match(themeRuntime, /LEGACY_STORAGE_KEY/);
assert.match(themeLib, /BOOSTR_THEME_REVISION = 2/);
assert.match(themeLib, /revision INTEGER/);

assert.match(sharedRuntime, /boostrSharedUi/);
assert.match(sharedRuntime, /boostr-production-context/);
assert.match(sharedRuntime, /makeTablesScrollable/);
assert.match(sharedCss, /\.boostr-app-shell/);
assert.match(sharedCss, /\.boostr-payment-grid/);
assert.match(sharedCss, /One shared mobile dock/);

assert.match(app, /class="app"/);
assert.match(app, /class="card login-preview"/);
assert.match(app, /assets\/logos\/boostr-logo-nav\.png/);
assert.match(app, /SMART PARKING/);
assert.match(app, /function roleContext/);
assert.doesNotMatch(app, /boostr-mother\/i18n\.js/);

assert.match(home, /boostr-app-shell/);
assert.match(home, /boostr-hero-grid/);
assert.match(home, /data-control-tab/);
assert.doesNotMatch(home, /boostr-mother\/i18n\.js/);

assert.match(payment, /boostr-payment-grid/);
assert.match(payment, /boostr-segments/);
assert.match(payment, /NO REAL PAYMENT PROCESSING/);

assert.match(modules, /data-filter="\[data-search-item\]"/);
assert.doesNotMatch(modules, /boostr-mother\/i18n\.js/);

console.log('Shared UI v2 health: OK');
