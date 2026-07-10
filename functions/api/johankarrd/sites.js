const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

async function ensureTables(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS johankarrd_drafts (id TEXT PRIMARY KEY, owner TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS johankarrd_live_pages (slug TEXT PRIMARY KEY, payload TEXT NOT NULL, html TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS johankarrd_deleted_pages (slug TEXT PRIMARY KEY, deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
}

function safeSlug(value = '') {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function canonicalSlug(value = '', name = '') {
  const slug = safeSlug(value || name);
  const label = safeSlug(name);
  const joined = `${slug} ${label}`;
  if (/\bcafe-del-mar\b|\bcafedelmar\b/.test(joined) && !/\bcopy\b|\bcopia\b/.test(joined)) return 'cafedelmar';
  if (/\bsolve-inventory\b|\bsolveinventory\b|\binventory-solve\b/.test(joined) && !/\bcopy\b|\bcopia\b/.test(joined)) return 'solveinventory';
  if (slug === 'cafe' && /cafe-del-mar|cafedelmar/.test(label)) return 'cafedelmar';
  if (slug === 'inventory' && /solve-inventory|solveinventory/.test(label)) return 'solveinventory';
  return slug;
}

function storageKey(slug) {
  if (slug === 'cafedelmar') return 'cafe';
  if (slug === 'solveinventory') return 'inventory';
  return slug;
}

function normalizePayload(payload, fallbackSlug) {
  if (!payload || typeof payload !== 'object') payload = {};
  const slug = canonicalSlug(payload.slug || fallbackSlug || payload.name, payload.name);
  return {
    ...payload,
    name: payload.name || slug,
    slug,
    sections: Array.isArray(payload.sections) ? payload.sections : [],
    meta: payload.meta || {},
    settings: payload.settings || {}
  };
}

function quality(site = {}) {
  const sections = Array.isArray(site.sections) ? site.sections : [];
  const items = sections.reduce((total, section) => total + (Array.isArray(section?.items) ? section.items.length : 0), 0);
  const populated = sections.reduce((total, section) => total + (section?.items || []).filter((item) => item && Object.keys(item).length > 1).length, 0);
  const publishedBonus = site.status === 'published' || site.published ? 25 : 0;
  return sections.length * 100 + items * 10 + populated + publishedBonus;
}

function contentSignature(site = {}) {
  const sections = (site.sections || []).map((section) => ({
    id: safeSlug(section?.id || section?.label || ''),
    items: (section?.items || []).map((item) => ({
      type: item?.type || '',
      text: item?.text || '',
      src: item?.src || '',
      imgs: Array.isArray(item?.imgs) ? item.imgs.slice(0, 4) : []
    }))
  }));
  try { return JSON.stringify(sections); } catch (_) { return ''; }
}

function identity(key, site = {}) {
  const canonical = canonicalSlug(site.slug || key, site.name);
  if (canonical === 'cafedelmar' || canonical === 'solveinventory') return canonical;
  const name = safeSlug(site.name || '');
  const signature = contentSignature(site);
  return signature ? `${name || canonical || safeSlug(key)}::${signature}` : (name || canonical || safeSlug(key));
}

function dedupeSites(input = {}) {
  const grouped = new Map();
  for (const [key, value] of Object.entries(input || {})) {
    const normalized = normalizePayload(value, key);
    if (!normalized.slug) continue;
    const id = identity(key, normalized);
    const targetKey = storageKey(normalized.slug);
    const previous = grouped.get(id);
    if (!previous || quality(normalized) > quality(previous.site)) grouped.set(id, { key: targetKey, site: normalized });
  }
  const sites = {};
  for (const { key, site } of grouped.values()) {
    if (!sites[key] || quality(site) > quality(sites[key])) sites[key] = site;
  }
  return sites;
}

async function persistCleanDraft(db, sites) {
  await db.prepare(`
    INSERT INTO johankarrd_drafts (id, owner, payload, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = CURRENT_TIMESTAMP
  `).bind('johanka-default', 'johanka', JSON.stringify(sites)).run();
}

export async function onRequestGet({ env }) {
  try {
    if (!env.DB) return json({ sites: {}, published: {}, deleted: [] });
    await ensureTables(env.DB);
    const deletedRows = await env.DB.prepare('SELECT slug FROM johankarrd_deleted_pages').all();
    const deleted = new Set((deletedRows.results || []).map((row) => canonicalSlug(row.slug)).filter(Boolean));
    let sites = {};
    const published = {};

    const draft = await env.DB.prepare('SELECT payload FROM johankarrd_drafts WHERE id = ?').bind('johanka-default').first();
    if (draft?.payload) {
      try { sites = dedupeSites(JSON.parse(draft.payload || '{}')); } catch (_) {}
    }

    const live = await env.DB.prepare('SELECT slug, payload, updated_at FROM johankarrd_live_pages ORDER BY updated_at DESC').all();
    for (const row of (live.results || [])) {
      const slug = canonicalSlug(row.slug);
      if (!slug || deleted.has(slug)) continue;
      let payload = {};
      try { payload = JSON.parse(row.payload || '{}'); } catch (_) {}
      const normalized = normalizePayload({ ...payload, slug, published: true, status: 'published' }, slug);
      sites = dedupeSites({ ...sites, [`live-${slug}`]: normalized });
      if (!published[slug]) published[slug] = { url: `/johankarrd/${slug}/`, updated_at: row.updated_at };
    }

    sites = dedupeSites(sites);
    for (const [key, site] of Object.entries(sites)) {
      if (deleted.has(canonicalSlug(site?.slug || key, site?.name))) delete sites[key];
    }

    await persistCleanDraft(env.DB, sites);
    return json({ sites, published, deleted: [...deleted] });
  } catch (error) {
    return json({ error: error.message || 'Unable to load Johankarrd sites', sites: {}, published: {}, deleted: [] }, 500);
  }
}
