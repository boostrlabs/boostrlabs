const base = (process.env.BOOSTR_BASE_URL || 'https://boostrlabs.pages.dev').replace(/\/$/, '');
const checks = [];

async function check(name, fn) {
  try {
    await fn();
    checks.push({ name, ok: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    checks.push({ name, ok: false, error: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

await check('health endpoint returns PASS', async () => {
  const response = await fetch(`${base}/api/health/live-jankodiorr`, { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.missing?.join(', ') || data.error || `HTTP ${response.status}`);
});

await check('canonical viewer returns HTML directly', async () => {
  const response = await fetch(`${base}/live/jankodiorr`, { redirect: 'manual', cache: 'no-store' });
  const text = await response.text();
  if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
  if (response.headers.get('location')) throw new Error(`unexpected redirect to ${response.headers.get('location')}`);
  if (!text.includes('BOOSTR Labs')) throw new Error('BOOSTR branding missing');
  if (!text.includes('MODO GUEST')) throw new Error('guest mode missing');
  if (!text.includes('LOGIN BOOSTR')) throw new Error('login CTA missing');
  if (!text.includes('STREAM OFFLINE')) throw new Error('offline state missing');
  if (!text.includes('No hay subasta activa')) throw new Error('auction empty state missing');
  if (!text.includes('Último artículo subastado')) throw new Error('last auction state missing');
});

await check('logo asset is available', async () => {
  const response = await fetch(`${base}/assets/logos/boostr-logo-nav.png`, { redirect: 'manual', cache: 'no-store' });
  const type = response.headers.get('content-type') || '';
  if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
  if (!type.includes('image/')) throw new Error(`unexpected content-type ${type || 'missing'}`);
});

const failed = checks.filter((item) => !item.ok);
console.log(JSON.stringify({ base, ok: failed.length === 0, checks }, null, 2));
if (failed.length) process.exit(1);
