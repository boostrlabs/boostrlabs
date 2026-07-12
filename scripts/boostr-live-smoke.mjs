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

await check('viewer returns BOOSTR Live HTML', async () => {
  const response = await fetch(`${base}/live/jankodiorr-smoke`, { redirect: 'error' });
  const text = await response.text();
  if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
  if (!text.includes('SMART VIEWER SMOKE TEST')) throw new Error('viewer marker missing');
});

let state;
await check('smoke API returns persistent room state', async () => {
  const response = await fetch(`${base}/api/smoke/live-jankodiorr`, { cache: 'no-store' });
  state = await response.json();
  if (!response.ok || !state.ok) throw new Error(state.message || state.error || `HTTP ${response.status}`);
  if (!state.room?.id || !Number.isInteger(Number(state.room.current_bid_cents))) throw new Error('invalid room payload');
});

await check('server rejects a bid below minimum', async () => {
  const response = await fetch(`${base}/api/smoke/live-jankodiorr`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'bid', public_name: 'Smoke Bot', amount_cents: Number(state.room.current_bid_cents) })
  });
  const result = await response.json();
  if (response.status !== 400 || result.error !== 'bid_too_low') throw new Error(`expected bid_too_low, got ${response.status} ${result.error || ''}`);
});

await check('chat message persists', async () => {
  const marker = `smoke-${Date.now()}`;
  const post = await fetch(`${base}/api/smoke/live-jankodiorr`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'chat', public_name: 'Smoke Bot', role_label: 'QA', body: marker })
  });
  const posted = await post.json();
  if (!post.ok || !posted.ok) throw new Error(posted.message || posted.error || `HTTP ${post.status}`);
  const get = await fetch(`${base}/api/smoke/live-jankodiorr`, { cache: 'no-store' });
  const loaded = await get.json();
  if (!loaded.messages?.some((message) => message.body === marker)) throw new Error('message not persisted');
});

const failed = checks.filter((item) => !item.ok);
console.log(JSON.stringify({ base, ok: failed.length === 0, checks }, null, 2));
if (failed.length) process.exit(1);
