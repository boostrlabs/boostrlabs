const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

async function ensureTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS hummus_creative_missions (
      mission_code TEXT PRIMARY KEY,
      note TEXT NOT NULL DEFAULT '',
      asset_key TEXT,
      asset_name TEXT,
      asset_type TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    )
  `).run();
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: 'GET, POST, OPTIONS' } });
}

export async function onRequestGet({ request, env }) {
  if (!env.DB || !env.BOOSTR_ASSETS) return json({ ok: false, error: 'storage_unavailable' }, 503);
  await ensureTable(env);
  const url = new URL(request.url);
  const assetKey = url.searchParams.get('asset');

  if (assetKey) {
    if (!assetKey.startsWith('hummusfl/creative-missions/')) return json({ ok: false, error: 'invalid_asset' }, 400);
    const object = await env.BOOSTR_ASSETS.get(assetKey);
    if (!object) return json({ ok: false, error: 'asset_not_found' }, 404);
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'private, max-age=60');
    return new Response(object.body, { headers });
  }

  const result = await env.DB.prepare(`
    SELECT mission_code, note, asset_key, asset_name, asset_type, completed, updated_at
    FROM hummus_creative_missions
    ORDER BY updated_at DESC
  `).all();

  const rows = (result.results || []).map((row) => ({
    ...row,
    completed: Boolean(row.completed),
    asset_url: row.asset_key ? `/api/hummus-missions?asset=${encodeURIComponent(row.asset_key)}` : null
  }));

  return json({ ok: true, rows });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB || !env.BOOSTR_ASSETS) return json({ ok: false, error: 'storage_unavailable' }, 503);
  await ensureTable(env);

  const form = await request.formData();
  const missionCode = String(form.get('mission_code') || '').trim().slice(0, 80);
  const note = String(form.get('note') || '').trim().slice(0, 12000);
  const completed = String(form.get('completed') || '') === 'true' ? 1 : 0;
  const file = form.get('asset');

  if (!/^[A-Z0-9_]+$/.test(missionCode)) return json({ ok: false, error: 'invalid_mission_code' }, 400);

  const existing = await env.DB.prepare(
    `SELECT asset_key, asset_name, asset_type FROM hummus_creative_missions WHERE mission_code = ?`
  ).bind(missionCode).first();

  let assetKey = existing?.asset_key || null;
  let assetName = existing?.asset_name || null;
  let assetType = existing?.asset_type || null;

  if (file && typeof file === 'object' && typeof file.arrayBuffer === 'function' && file.size > 0) {
    if (file.size > MAX_IMAGE_BYTES) return json({ ok: false, error: 'image_too_large', max_mb: 8 }, 413);
    if (!ALLOWED_TYPES.has(file.type)) return json({ ok: false, error: 'unsupported_image_type' }, 415);

    if (assetKey) await env.BOOSTR_ASSETS.delete(assetKey);
    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : file.type === 'image/gif' ? 'gif' : 'jpg';
    assetKey = `hummusfl/creative-missions/${missionCode.toLowerCase()}-${crypto.randomUUID()}.${extension}`;
    assetName = String(file.name || `${missionCode}.${extension}`).slice(0, 220);
    assetType = file.type;
    await env.BOOSTR_ASSETS.put(assetKey, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { missionCode, originalName: assetName }
    });
  }

  const updatedAt = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO hummus_creative_missions
      (mission_code, note, asset_key, asset_name, asset_type, completed, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(mission_code) DO UPDATE SET
      note = excluded.note,
      asset_key = excluded.asset_key,
      asset_name = excluded.asset_name,
      asset_type = excluded.asset_type,
      completed = excluded.completed,
      updated_at = excluded.updated_at
  `).bind(missionCode, note, assetKey, assetName, assetType, completed, updatedAt).run();

  return json({
    ok: true,
    row: {
      mission_code: missionCode,
      note,
      asset_key: assetKey,
      asset_name: assetName,
      asset_type: assetType,
      completed: Boolean(completed),
      updated_at: updatedAt,
      asset_url: assetKey ? `/api/hummus-missions?asset=${encodeURIComponent(assetKey)}` : null
    }
  });
}