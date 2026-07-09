function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
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
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ error: 'D1 binding DB is not available' }, 503);
    const body = await request.json();
    if (!body || !body.slug || !body.site || !body.html) return json({ error: 'Missing publish payload' }, 400);
    await ensureTables(env.DB);
    if (body.sites) {
      await env.DB.prepare(`
        INSERT INTO johankarrd_drafts (id, owner, payload, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = CURRENT_TIMESTAMP
      `).bind('johanka-default', 'johanka', JSON.stringify(body.sites)).run();
    }
    await env.DB.prepare(`
      INSERT INTO johankarrd_live_pages (slug, payload, html, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET payload = excluded.payload, html = excluded.html, updated_at = CURRENT_TIMESTAMP
    `).bind(String(body.slug), JSON.stringify(body.site), String(body.html)).run();
    return json({ ok: true, slug: String(body.slug) });
  } catch (error) {
    return json({ error: error.message || 'Unable to publish Johankarrd' }, 500);
  }
}
