const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  }
});

const safeSlug = (value = '') => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 80);

async function ensureTables(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS johankarrd_drafts (
      id TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS johankarrd_live_pages (
      slug TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      html TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS johankarrd_deleted_pages (
      slug TEXT PRIMARY KEY,
      deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

async function deletedSlugs(db) {
  const rows = await db.prepare('SELECT slug FROM johankarrd_deleted_pages').all();
  return new Set((rows.results || []).map((row) => safeSlug(row.slug)).filter(Boolean));
}

function parseSites(payload) {
  try {
    const sites = JSON.parse(payload || '{}');
    return sites && typeof sites === 'object' ? sites : {};
  } catch (_) {
    return {};
  }
}

function indexBySlug(sites) {
  const index = new Map();
  for (const [key, site] of Object.entries(sites || {})) {
    const slug = safeSlug(site?.slug || key);
    if (slug) index.set(slug, key);
  }
  return index;
}

async function mergeLiveSites(db, draftSites, deleted) {
  const sites = { ...(draftSites || {}) };
  const bySlug = indexBySlug(sites);
  const live = await db.prepare('SELECT slug, payload FROM johankarrd_live_pages ORDER BY updated_at DESC').all();
  for (const row of (live.results || [])) {
    const slug = safeSlug(row.slug);
    if (!slug || deleted.has(slug) || bySlug.has(slug)) continue;
    let payload = {};
    try { payload = JSON.parse(row.payload || '{}'); } catch (_) {}
    if (!payload || typeof payload !== 'object') payload = {};
    payload.slug = slug;
    payload.name = payload.name || slug;
    payload.sections = Array.isArray(payload.sections) ? payload.sections : [];
    sites[slug] = payload;
    bySlug.set(slug, slug);
  }
  for (const [key, site] of Object.entries(sites)) {
    const slug = safeSlug(site?.slug || key);
    if (slug && deleted.has(slug)) delete sites[key];
  }
  return sites;
}

export async function onRequestGet({ env }) {
  try {
    if (!env.DB) return json({ error: 'D1 binding DB is not available' }, 503);
    await ensureTables(env.DB);
    const row = await env.DB.prepare('SELECT payload, updated_at FROM johankarrd_drafts WHERE id = ?')
      .bind('johanka-default')
      .first();
    const deleted = await deletedSlugs(env.DB);
    const sites = await mergeLiveSites(env.DB, parseSites(row?.payload), deleted);
    return json({ sites, updated_at: row?.updated_at || null });
  } catch (error) {
    return json({ error: error.message || 'Unable to read Johankarrd draft' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ error: 'D1 binding DB is not available' }, 503);
    const body = await request.json();
    if (!body || !body.sites || typeof body.sites !== 'object') {
      return json({ error: 'Missing sites payload' }, 400);
    }
    await ensureTables(env.DB);
    const deleted = await deletedSlugs(env.DB);
    const sites = await mergeLiveSites(env.DB, body.sites, deleted);
    await env.DB.prepare(`
      INSERT INTO johankarrd_drafts (id, owner, payload, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = CURRENT_TIMESTAMP
    `).bind('johanka-default', 'johanka', JSON.stringify(sites)).run();
    return json({ ok: true, sites });
  } catch (error) {
    return json({ error: error.message || 'Unable to save Johankarrd draft' }, 500);
  }
}