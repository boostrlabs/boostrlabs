import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
const middleware = read('functions/_middleware.js');
const themeRuntime = read('public/assets/boostr-theme/theme-runtime.js');
const sharedRuntime = read('public/assets/boostr-theme/shared-ui-runtime.js');
const sharedCss = read('public/assets/boostr-theme/shared-ui-v2.css');
const themeLib = read('functions/_lib/theme.js');
const app = read('public/app/index.html');
const home = read('public/home/index.html');
const payment = read('public/smart-payment-link/index.html');
const modules = read('public/modules/index.html');

assert.ok(middleware.includes('shared-ui-v2.css'));
assert.ok(middleware.includes('shared-ui-runtime.js'));
assert.ok(middleware.includes('data-boostr-shared-ui'));
assert.ok(middleware.includes('boostr_system_theme_v2'));

for (const route of ['/app/janko','/app/johanka','/app/82ngel','/app/parking','/hummusfl','/parking','/jankodiorr','/82ngel']) {
  assert.ok(middleware.includes(`"${route}"`));
}

assert.ok(themeRuntime.includes('boostr_system_theme_v2'));
assert.ok(themeRuntime.includes('LEGACY_STORAGE_KEY'));
assert.ok(themeLib.includes('BOOSTR_THEME_REVISION = 2'));
assert.ok(themeLib.includes('revision INTEGER'));
assert.ok(sharedRuntime.includes('boostrSharedUi'));
assert.ok(sharedRuntime.includes('boostr-production-context'));
assert.ok(sharedRuntime.includes('makeTablesScrollable'));
assert.ok(sharedCss.includes('.boostr-app-shell'));
assert.ok(sharedCss.includes('.boostr-payment-grid'));
assert.ok(sharedCss.includes('One shared mobile dock'));

for (const marker of ['class="app"','class="card access"','assets/logos/boostr-logo-nav.png','/parking/omni-jr/','function d(s)','maximum-scale=1','user-scalable=no']) {
  assert.ok(app.includes(marker), `Missing app marker: ${marker}`);
}
for (const removed of ['class="card login-preview"','id="quickLoginForm"','boostr-mother/i18n.js']) {
  assert.ok(!app.includes(removed), `Removed app marker returned: ${removed}`);
}

assert.ok(home.includes('boostr-app-shell'));
assert.ok(home.includes('boostr-hero-grid'));
assert.ok(home.includes('data-control-tab'));
assert.ok(!home.includes('boostr-mother/i18n.js'));
assert.ok(payment.includes('boostr-payment-grid'));
assert.ok(payment.includes('boostr-segments'));
assert.ok(payment.includes('NO REAL PAYMENT PROCESSING'));
assert.ok(modules.includes('data-filter="[data-search-item]"'));
assert.ok(!modules.includes('boostr-mother/i18n.js'));

console.log('Shared UI v2 health: OK');