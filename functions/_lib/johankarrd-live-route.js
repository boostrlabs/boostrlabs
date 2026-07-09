import { renderJohankarrdHtml, safeSlug } from './johankarrd-renderer.js';

async function ensureTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS johankarrd_live_pages (
      slug TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      html TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

export async function serveJohankarrd({ env, request }, slug, fallbackSite) {
  try {
    if (!env.DB) throw new Error('missing DB');
    await ensureTable(env.DB);
    const row = await env.DB.prepare('SELECT payload FROM johankarrd_live_pages WHERE slug = ?')
      .bind(safeSlug(slug))
      .first();
    if (row && row.payload) {
      const html = renderJohankarrdHtml(JSON.parse(row.payload));
      return new Response(html, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store'
        }
      });
    }
  } catch (_) {}

  if (env.ASSETS && request) {
    try {
      const asset = await env.ASSETS.fetch(request);
      if (asset && asset.ok) return asset;
    } catch (_) {}
  }

  return new Response(renderJohankarrdHtml(fallbackSite), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}
