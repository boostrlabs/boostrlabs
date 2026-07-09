import { isRenderable, normalizeSite, renderJohankarrdHtml, safeSlug } from '../../_lib/johankarrd-renderer.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  }
});

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
    CREATE TABLE IF NOT EXISTS johankarrd_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL,
      payload TEXT NOT NULL,
      html TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ error: 'D1 binding DB is not available' }, 503);
    const body = await request.json();
    if (!body || !body.site || typeof body.site !== 'object') return json({ error: 'Missing site payload' }, 400);

    const site = normalizeSite(body.site);
    const slug = safeSlug(body.slug || site.slug || site.name);
    site.slug = slug;

    if (!isRenderable(site)) return json({ error: 'Johankarrd is not renderable' }, 422);
    const html = renderJohankarrdHtml(site);
    if (!html.includes('<!doctype html>') || !html.includes('function show()') || !html.includes('class="site"')) {
      return json({ error: 'Rendered HTML failed safety checks' }, 422);
    }

    await ensureTables(env.DB);

    if (body.sites && typeof body.sites === 'object') {
      await env.DB.prepare(`
        INSERT INTO johankarrd_drafts (id, owner, payload, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = CURRENT_TIMESTAMP
      `).bind('johanka-default', 'johanka', JSON.stringify(body.sites)).run();
    }

    await env.DB.prepare(`
      INSERT INTO johankarrd_versions (slug, payload, html, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(slug, JSON.stringify(site), html).run();

    await env.DB.prepare(`
      INSERT INTO johankarrd_live_pages (slug, payload, html, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET payload = excluded.payload, html = excluded.html, updated_at = CURRENT_TIMESTAMP
    `).bind(slug, JSON.stringify(site), html).run();

    return json({ ok: true, slug, html_bytes: html.length });
  } catch (error) {
    return json({ error: error.message || 'Unable to publish Johankarrd' }, 500);
  }
}
