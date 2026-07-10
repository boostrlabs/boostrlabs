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

function normalizePayload(payload, fallbackSlug) {
  if (!payload || typeof payload !== 'object') payload = {};
  payload.name = payload.name || fallbackSlug;
  payload.slug = safeSlug(payload.slug || fallbackSlug || payload.name);
  payload.sections = Array.isArray(payload.sections) ? payload.sections : [];
  payload.meta = payload.meta || {};
  payload.settings = payload.settings || {};
  return payload;
}

export async function onRequestGet({ env }) {
  try {
    if (!env.DB) return json({ sites: {}, published: {}, deleted: [] });
    await ensureTables(env.DB);
    const deletedRows = await env.DB.prepare('SELECT slug FROM johankarrd_deleted_pages').all();
    const deleted = new Set((deletedRows.results || []).map((row) => row.slug));
    const sites = {};
    const published = {};

    const draft = await env.DB.prepare('SELECT payload FROM johankarrd_drafts WHERE id = ?').bind('johanka-default').first();
    if (draft && draft.payload) {
      try {
        const draftSites = JSON.parse(draft.payload || '{}');
        for (const [key, value] of Object.entries(draftSites || {})) {
          const slug = safeSlug(value?.slug || key);
          if (!slug || deleted.has(slug)) continue;
          sites[slug] = normalizePayload(value, slug);
        }
      } catch (_) {}
    }

    const live = await env.DB.prepare('SELECT slug, payload, updated_at FROM johankarrd_live_pages ORDER BY updated_at DESC').all();
    for (const row of (live.results || [])) {
      const slug = safeSlug(row.slug);
      if (!slug || deleted.has(slug)) continue;
      let payload = {};
      try { payload = JSON.parse(row.payload || '{}'); } catch (_) {}
      sites[slug] = normalizePayload({ ...payload, slug }, slug);
      published[slug] = { url: `/johankarrd/${slug}/`, updated_at: row.updated_at };
    }

    return json({ sites, published, deleted: [...deleted] });
  } catch (error) {
    return json({ error: error.message || 'Unable to load Johankarrd sites', sites: {}, published: {}, deleted: [] }, 500);
  }
}
