import { authCanSeeAll, jsonError, jsonOk, requireSession, requireWorkspaceAccess } from '../_lib/api.js';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const WORKSPACE_SLUGS = ['hummus-fl', 'hummusfl'];

async function ensureTables(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS hummus_creative_missions (
      mission_code TEXT PRIMARY KEY,
      note TEXT NOT NULL DEFAULT '',
      asset_key TEXT,
      asset_name TEXT,
      asset_type TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      version_number INTEGER NOT NULL DEFAULT 0,
      updated_by_user_id TEXT,
      updated_at TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS hummus_mission_versions (
      id TEXT PRIMARY KEY,
      mission_code TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      version_label TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      asset_key TEXT,
      asset_name TEXT,
      asset_type TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      created_by_user_id TEXT,
      created_at TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS hummus_mission_progress (
      user_id TEXT PRIMARY KEY,
      current_index INTEGER NOT NULL DEFAULT 0,
      completed_json TEXT NOT NULL DEFAULT '[]',
      opened INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    )
  `).run();

  const columns = await env.DB.prepare(`PRAGMA table_info(hummus_creative_missions)`).all();
  const names = new Set((columns.results || []).map((column) => column.name));
  const additions = [
    ['version_number', 'INTEGER NOT NULL DEFAULT 0'],
    ['updated_by_user_id', 'TEXT']
  ];
  for (const [name, definition] of additions) {
    if (!names.has(name)) await env.DB.prepare(`ALTER TABLE hummus_creative_missions ADD COLUMN ${name} ${definition}`).run();
  }
}

async function authorize(request, env) {
  const auth = await requireSession(request, env);
  if (!auth.ok) return auth;
  if (authCanSeeAll(auth)) return auth;

  const placeholders = WORKSPACE_SLUGS.map(() => '?').join(',');
  const workspace = await env.DB.prepare(`SELECT id FROM workspaces WHERE slug IN (${placeholders}) LIMIT 1`)
    .bind(...WORKSPACE_SLUGS)
    .first();
  if (!workspace?.id) return { ok: false, response: jsonError('hummus_workspace_missing', 'Hummus FL workspace is not configured.', 403) };
  const access = requireWorkspaceAccess(auth, workspace.id);
  if (!access.ok) return access;
  return auth;
}

const assetUrl = (key) => key ? `/api/hummus-missions?asset=${encodeURIComponent(key)}` : null;
const versionLabel = (number) => `v0.${number}`;

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { allow: 'GET, POST, OPTIONS' } });
}

export async function onRequestGet({ request, env }) {
  if (!env.DB || !env.BOOSTR_ASSETS) return jsonError('storage_unavailable', 'Storage unavailable.', 503);
  const auth = await authorize(request, env);
  if (!auth.ok) return auth.response;
  await ensureTables(env);

  const url = new URL(request.url);
  const assetKey = url.searchParams.get('asset');
  if (assetKey) {
    if (!assetKey.startsWith('hummusfl/creative-missions/')) return jsonError('invalid_asset', 'Invalid asset.', 400);
    const object = await env.BOOSTR_ASSETS.get(assetKey);
    if (!object) return jsonError('asset_not_found', 'Asset not found.', 404);
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'private, max-age=60');
    headers.set('content-disposition', 'inline');
    return new Response(object.body, { headers });
  }

  if (url.searchParams.get('progress') === '1') {
    const row = await env.DB.prepare(`SELECT current_index, completed_json, opened, updated_at FROM hummus_mission_progress WHERE user_id = ?`)
      .bind(auth.user.id)
      .first();
    return jsonOk({ progress: row ? { current: row.current_index, completed: JSON.parse(row.completed_json || '[]'), opened: Boolean(row.opened), updated_at: row.updated_at } : null });
  }

  const result = await env.DB.prepare(`
    SELECT mission_code, note, asset_key, asset_name, asset_type, completed, version_number, updated_at
    FROM hummus_creative_missions ORDER BY updated_at DESC
  `).all();
  const rows = (result.results || []).map((row) => ({
    ...row,
    completed: Boolean(row.completed),
    version_label: row.version_number ? versionLabel(row.version_number) : null,
    asset_url: assetUrl(row.asset_key)
  }));
  return jsonOk({ rows });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB || !env.BOOSTR_ASSETS) return jsonError('storage_unavailable', 'Storage unavailable.', 503);
  const auth = await authorize(request, env);
  if (!auth.ok) return auth.response;
  await ensureTables(env);

  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const payload = await request.json().catch(() => null);
    if (!payload || payload.action !== 'progress') return jsonError('invalid_progress_payload', 'Invalid progress payload.', 400);
    const current = Math.max(0, Math.min(24, Number(payload.current) || 0));
    const completed = Array.isArray(payload.completed)
      ? [...new Set(payload.completed.map(Number).filter((value) => Number.isInteger(value) && value >= 0 && value <= 24))]
      : [];
    const updatedAt = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO hummus_mission_progress (user_id, current_index, completed_json, opened, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET current_index=excluded.current_index, completed_json=excluded.completed_json, opened=excluded.opened, updated_at=excluded.updated_at
    `).bind(auth.user.id, current, JSON.stringify(completed), payload.opened ? 1 : 0, updatedAt).run();
    return jsonOk({ progress: { current, completed, opened: Boolean(payload.opened), updated_at: updatedAt } });
  }

  const form = await request.formData();
  const missionCode = String(form.get('mission_code') || '').trim().slice(0, 80);
  const note = String(form.get('note') || '').trim().slice(0, 12000);
  const completed = String(form.get('completed') || '') === 'true' ? 1 : 0;
  const file = form.get('asset');
  if (!/^[A-Z0-9_]+$/.test(missionCode)) return jsonError('invalid_mission_code', 'Invalid mission code.', 400);

  const existing = await env.DB.prepare(`SELECT asset_key, asset_name, asset_type, version_number FROM hummus_creative_missions WHERE mission_code = ?`)
    .bind(missionCode).first();
  const nextVersion = Number(existing?.version_number || 0) + 1;
  let assetKey = existing?.asset_key || null;
  let assetName = existing?.asset_name || null;
  let assetType = existing?.asset_type || null;

  if (file && typeof file === 'object' && typeof file.arrayBuffer === 'function' && file.size > 0) {
    if (file.size > MAX_IMAGE_BYTES) return jsonError('image_too_large', 'Image too large.', 413, { max_mb: 8 });
    if (!ALLOWED_TYPES.has(file.type)) return jsonError('unsupported_image_type', 'Unsupported image type.', 415);
    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : file.type === 'image/gif' ? 'gif' : 'jpg';
    assetKey = `hummusfl/creative-missions/${missionCode.toLowerCase()}/${versionLabel(nextVersion)}-${crypto.randomUUID()}.${extension}`;
    assetName = String(file.name || `${missionCode}.${extension}`).slice(0, 220);
    assetType = file.type;
    await env.BOOSTR_ASSETS.put(assetKey, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type, contentDisposition: 'inline' },
      customMetadata: { missionCode, originalName: assetName, version: versionLabel(nextVersion), userId: auth.user.id }
    });
  }

  const updatedAt = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO hummus_creative_missions
      (mission_code, note, asset_key, asset_name, asset_type, completed, version_number, updated_by_user_id, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(mission_code) DO UPDATE SET
      note=excluded.note, asset_key=excluded.asset_key, asset_name=excluded.asset_name, asset_type=excluded.asset_type,
      completed=excluded.completed, version_number=excluded.version_number, updated_by_user_id=excluded.updated_by_user_id, updated_at=excluded.updated_at
  `).bind(missionCode, note, assetKey, assetName, assetType, completed, nextVersion, auth.user.id, updatedAt).run();
  await env.DB.prepare(`
    INSERT INTO hummus_mission_versions
      (id, mission_code, version_number, version_label, note, asset_key, asset_name, asset_type, completed, created_by_user_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(crypto.randomUUID(), missionCode, nextVersion, versionLabel(nextVersion), note, assetKey, assetName, assetType, completed, auth.user.id, updatedAt).run();

  return jsonOk({ row: {
    mission_code: missionCode, note, asset_key: assetKey, asset_name: assetName, asset_type: assetType,
    completed: Boolean(completed), version_number: nextVersion, version_label: versionLabel(nextVersion),
    updated_at: updatedAt, asset_url: assetUrl(assetKey)
  } });
}