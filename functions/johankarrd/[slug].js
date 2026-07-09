import { renderJohankarrdHtml, safeSlug } from '../_lib/johankarrd-renderer.js';

async function ensureTables(db) {
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

const notFound = () => new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Johankarrd not found</title><style>html,body{margin:0;height:100%;background:#000;color:#fff;font-family:Arial,sans-serif}body{display:grid;place-items:center}.box{text-align:center}.box a{color:#feedb9;font-weight:900}</style></head><body><div class="box"><h1>Johankarrd not found</h1><a href="/johankarrd/">Back to Johanka Carrds</a></div></body></html>`, {
  status: 404,
  headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
});

export const onRequest = async ({ env, params }) => {
  try {
    if (!env.DB) return notFound();
    const slug = safeSlug(params.slug || '');
    if (!slug) return notFound();
    await ensureTables(env.DB);
    const deleted = await env.DB.prepare('SELECT slug FROM johankarrd_deleted_pages WHERE slug = ?').bind(slug).first();
    if (deleted) return notFound();
    const row = await env.DB.prepare('SELECT payload FROM johankarrd_live_pages WHERE slug = ?').bind(slug).first();
    if (!row || !row.payload) return notFound();
    const html = renderJohankarrdHtml(JSON.parse(row.payload));
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
    });
  } catch (_) {
    return notFound();
  }
};
