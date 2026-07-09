const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  }
});

const safeSlug = (value = '') => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 80);

const protectedSlugs = new Set(['cafe', 'cafedelmar', 'inventory', 'solveinventory']);

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
    CREATE TABLE IF NOT EXISTS johankarrd_deleted_pages (
      slug TEXT PRIMARY KEY,
      deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ error: 'D1 binding DB is not available' }, 503);
    const body = await request.json().catch(() => ({}));
    const slug = safeSlug(body.slug);
    const confirmation = String(body.confirmation || '').trim();
    if (!slug) return json({ error: 'Missing slug' }, 400);
    if (protectedSlugs.has(slug)) return json({ error: 'This system Johankarrd cannot be deleted' }, 403);
    if (confirmation !== `BORRAR ${slug}`) return json({ error: 'Confirmation mismatch' }, 422);

    await ensureTables(env.DB);

    const draft = await env.DB.prepare('SELECT payload FROM johankarrd_drafts WHERE id = ?')
      .bind('johanka-default')
      .first();
    if (draft && draft.payload) {
      let sites = {};
      try { sites = JSON.parse(draft.payload || '{}'); } catch (_) {}
      if (sites && typeof sites === 'object' && sites[slug]) {
        delete sites[slug];
        await env.DB.prepare(`
          INSERT INTO johankarrd_drafts (id, owner, payload, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = CURRENT_TIMESTAMP
        `).bind('johanka-default', 'johanka', JSON.stringify(sites)).run();
      }
    }

    await env.DB.prepare('DELETE FROM johankarrd_live_pages WHERE slug = ?').bind(slug).run();
    await env.DB.prepare('INSERT INTO johankarrd_deleted_pages (slug, deleted_at) VALUES (?, CURRENT_TIMESTAMP) ON CONFLICT(slug) DO UPDATE SET deleted_at = CURRENT_TIMESTAMP').bind(slug).run();

    return json({ ok: true, slug });
  } catch (error) {
    return json({ error: error.message || 'Unable to delete Johankarrd' }, 500);
  }
}
