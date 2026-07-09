const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  }
});

async function ensureTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS johankarrd_drafts (
      id TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

export async function onRequestGet({ env }) {
  try {
    if (!env.DB) return json({ error: 'D1 binding DB is not available' }, 503);
    await ensureTable(env.DB);
    const row = await env.DB.prepare('SELECT payload, updated_at FROM johankarrd_drafts WHERE id = ?')
      .bind('johanka-default')
      .first();
    if (!row) return json({ sites: null, updated_at: null });
    return json({ sites: JSON.parse(row.payload), updated_at: row.updated_at });
  } catch (error) {
    return json({ error: error.message || 'Unable to read Johankarrd draft' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ error: 'D1 binding DB is not available' }, 503);
    const body = await request.json();
    if (!body || !body.sites || typeof body.sites !== 'object') {
      return json({ error: 'Missing sites payload' }, 400);
    }
    await ensureTable(env.DB);
    await env.DB.prepare(`
      INSERT INTO johankarrd_drafts (id, owner, payload, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = CURRENT_TIMESTAMP
    `).bind('johanka-default', 'johanka', JSON.stringify(body.sites)).run();
    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message || 'Unable to save Johankarrd draft' }, 500);
  }
}
