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

function canonicalSlug(value = '', name = '') {
  const slug = safeSlug(value || name);
  const label = safeSlug(name);
  if (['cafe', 'cafe-del-mar', 'cafedelmar'].includes(slug) || ['cafe-del-mar', 'cafedelmar'].includes(label)) return 'cafedelmar';
  if (['inventory', 'solve-inventory', 'solveinventory'].includes(slug) || ['solve-inventory', 'solveinventory'].includes(label)) return 'solveinventory';
  return slug;
}

function storageKey(slug) {
  if (slug === 'cafedelmar') return 'cafe';
  if (slug === 'solveinventory') return 'inventory';
  return slug;
}

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
  return new Set((rows.results || []).map((row) => canonicalSlug(row.slug)).filter(Boolean));
}

function parseSites(payload) {
  try {
    const sites = JSON.parse(payload || '{}');
    return sites && typeof sites === 'object' ? sites : {};
  } catch (_) {
    return {};
  }
}

function quality(site = {}) {
  const sections = Array.isArray(site.sections) ? site.sections : [];
  return sections.length * 10 + sections.reduce((total, section) => total + (Array.isArray(section?.items) ? section.items.length : 0), 0);
}

function normalizeSite(site = {}, fallback = '') {
  const slug = canonicalSlug(site?.slug || fallback || site?.name, site?.name);
  return {
    ...(site || {}),
    name: site?.name || slug,
    slug,
    sections: Array.isArray(site?.sections) ? site.sections : []
  };
}

function dedupeSites(input = {}, deleted = new Set()) {
  const sites = {};
  for (const [key, value] of Object.entries(input || {})) {
    const normalized = normalizeSite(value, key);
    if (!normalized.slug || deleted.has(normalized.slug)) continue;
    const targetKey = storageKey(normalized.slug);
    if (!sites[targetKey] || quality(normalized) > quality(sites[targetKey])) sites[targetKey] = normalized;
  }
  return sites;
}

async function mergeLiveSites(db, draftSites, deleted) {
  const sites = dedupeSites(draftSites, deleted);
  const live = await db.prepare('SELECT slug, payload FROM johankarrd_live_pages ORDER BY updated_at DESC').all();
  for (const row of (live.results || [])) {
    const slug = canonicalSlug(row.slug);
    if (!slug || deleted.has(slug)) continue;
    const key = storageKey(slug);
    if (sites[key]) continue;
    let payload = {};
    try { payload = JSON.parse(row.payload || '{}'); } catch (_) {}
    sites[key] = normalizeSite({ ...payload, slug }, slug);
  }
  return dedupeSites(sites, deleted);
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
