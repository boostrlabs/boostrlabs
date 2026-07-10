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
  if (['cafe', 'cafe-del-mar', 'cafedelmar'].includes(slug) || ['cafe-del-mar', 'cafedelmar'].includes(label)) return 'cafedelmar';
  if (['inventory', 'solve-inventory', 'solveinventory'].includes(slug) || ['solve-inventory', 'solveinventory'].includes(label)) return 'solveinventory';
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
  return sections.length * 10 + items;
}

function dedupeSites(input = {}) {
  const sites = {};
  for (const [key, value] of Object.entries(input || {})) {
    const normalized = normalizePayload(value, key);
    if (!normalized.slug) continue;
    const targetKey = storageKey(normalized.slug);
    if (!sites[targetKey] || quality(normalized) > quality(sites[targetKey])) sites[targetKey] = normalized;
  }
  return sites;
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
      const normalized = normalizePayload({ ...payload, slug }, slug);
      const key = storageKey(slug);
      if (!sites[key]) sites[key] = normalized;
      published[slug] = { url: `/johankarrd/${slug}/`, updated_at: row.updated_at };
    }

    sites = dedupeSites(sites);
    for (const [key, site] of Object.entries(sites)) {
      if (deleted.has(canonicalSlug(site?.slug || key, site?.name))) delete sites[key];
    }

    return json({ sites, published, deleted: [...deleted] });
  } catch (error) {
    return json({ error: error.message || 'Unable to load Johankarrd sites', sites: {}, published: {}, deleted: [] }, 500);
  }
}
