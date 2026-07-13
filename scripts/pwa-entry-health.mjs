import { readFileSync } from 'node:fs';

const failures = [];
const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
const root = readFileSync('index.html', 'utf8');
const sessionUi = readFileSync('public/assets/boostr-mother/session-ui.js', 'utf8');
const app = readFileSync('public/app/index.html', 'utf8');

if (manifest.start_url !== '/app/?source=pwa') failures.push(`Unexpected PWA start_url: ${manifest.start_url}`);
if (manifest.scope !== '/') failures.push(`Unexpected PWA scope: ${manifest.scope}`);
if (manifest.display !== 'standalone') failures.push(`Unexpected PWA display mode: ${manifest.display}`);
if (!root.includes("(display-mode: standalone)")) failures.push('Root page does not detect standalone launch mode');
if (!root.includes("/app/?source=pwa")) failures.push('Root page does not redirect standalone launches to BOOSTR App');
if (!sessionUi.includes('redirectInstalledLaunch')) failures.push('Shared session UI does not repair legacy installed PWA entry routes');
if (!sessionUi.includes('/manifest.webmanifest')) failures.push('Shared session UI does not expose the PWA manifest');
for (const marker of ['SMART PARKING', 'BOOSTR EATS', 'BOOSTR RIDES', 'BOOSTR EXOTIC']) {
  if (!app.includes(marker)) failures.push(`BOOSTR App launcher missing ${marker}`);
}

if (failures.length) {
  console.error('BOOSTR PWA ENTRY HEALTH: FAILED');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('BOOSTR PWA ENTRY HEALTH: PASS');
