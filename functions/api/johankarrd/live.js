function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

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

export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB) return json({ html: null, error: 'D1 binding DB is not available' }, 503);
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    if (!slug) return json({ error: 'Missing slug' }, 400);
    await ensureTable(env.DB);
    const row = await env.DB.prepare('SELECT html, payload, updated_at FROM johankarrd_live_pages WHERE slug = ?')
      .bind(slug)
      .first();
    if (!row) return json({ html: null, payload: null, updated_at: null });
    return json({ html: row.html, payload: JSON.parse(row.payload), updated_at: row.updated_at });
  } catch (error) {
    return json({ html: null, error: error.message || 'Unable to read live Johankarrd' }, 500);
  }
}
