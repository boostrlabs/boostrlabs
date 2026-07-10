import { isRenderable, normalizeSite, renderJohankarrdHtml, safeSlug } from '../../_lib/johankarrd-renderer.js';

const MAX_REQUEST_BYTES = 8 * 1024 * 1024;
const MAX_SITE_BYTES = 5 * 1024 * 1024;
const MAX_HTML_BYTES = 3 * 1024 * 1024;
const MAX_VERSIONS_PER_SLUG = 30;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
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
    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (declaredLength > MAX_REQUEST_BYTES) return json({ error: 'Publish payload is too large' }, 413);

    const body = await request.json().catch(() => null);
    if (!body || !body.site || typeof body.site !== 'object' || Array.isArray(body.site)) return json({ error: 'Missing site payload' }, 400);

    const site = normalizeSite(body.site);
    const slug = safeSlug(body.slug || site.slug || site.name);
    site.slug = slug;

    if (!isRenderable(site)) return json({ error: 'Johankarrd is not renderable' }, 422);

    const payload = JSON.stringify(site);
    if (payload.length > MAX_SITE_BYTES) return json({ error: 'Johankarrd payload is too large' }, 413);

    const html = renderJohankarrdHtml(site);
    if (!html.includes('<!doctype html>') || !html.includes('function show()') || !html.includes('class="site"')) {
      return json({ error: 'Rendered HTML failed safety checks' }, 422);
    }
    if (html.length > MAX_HTML_BYTES) return json({ error: 'Rendered Johankarrd is too large' }, 413);

    await ensureTables(env.DB);

    const statements = [];
    if (body.sites && typeof body.sites === 'object' && !Array.isArray(body.sites)) {
      const sitesPayload = JSON.stringify(body.sites);
      if (sitesPayload.length > MAX_SITE_BYTES) return json({ error: 'Draft collection is too large' }, 413);
      statements.push(env.DB.prepare(`
        INSERT INTO johankarrd_drafts (id, owner, payload, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = CURRENT_TIMESTAMP
      `).bind('johanka-default', 'johanka', sitesPayload));
    }

    statements.push(env.DB.prepare(`
      INSERT INTO johankarrd_versions (slug, payload, html, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(slug, payload, html));

    statements.push(env.DB.prepare(`
      INSERT INTO johankarrd_live_pages (slug, payload, html, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET payload = excluded.payload, html = excluded.html, updated_at = CURRENT_TIMESTAMP
    `).bind(slug, payload, html));

    await env.DB.batch(statements);

    await env.DB.prepare(`
      DELETE FROM johankarrd_versions
      WHERE slug = ? AND id NOT IN (
        SELECT id FROM johankarrd_versions WHERE slug = ? ORDER BY id DESC LIMIT ?
      )
    `).bind(slug, slug, MAX_VERSIONS_PER_SLUG).run();

    return json({ ok: true, slug, html_bytes: html.length, retained_versions: MAX_VERSIONS_PER_SLUG });
  } catch (error) {
    return json({ error: error.message || 'Unable to publish Johankarrd' }, 500);
  }
}
