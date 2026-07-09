const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  }
});

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

export async function onRequestGet({ env }) {
  try {
    if (!env.DB) return json({ pages: [] });
    await ensureTable(env.DB);
    const result = await env.DB.prepare('SELECT slug, payload, updated_at FROM johankarrd_live_pages ORDER BY updated_at DESC').all();
    const pages = (result.results || []).map((row) => {
      let payload = {};
      try { payload = JSON.parse(row.payload || '{}'); } catch (_) {}
      return {
        slug: row.slug,
        name: payload.name || row.slug,
        updated_at: row.updated_at,
        url: `/johankarrd/${row.slug}/`
      };
    });
    return json({ pages });
  } catch (_) {
    return json({ pages: [] });
  }
}
