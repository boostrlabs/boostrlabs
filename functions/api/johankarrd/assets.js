const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}

function bucket(env) {
  return env.JOHANKARRD_ASSETS || env.BOOSTR_ASSETS || env.ASSETS_BUCKET || env.R2_BUCKET || null;
}

function safeName(name = 'asset') {
  return String(name || 'asset').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'asset';
}

function extFromType(type = '') {
  if (type.includes('jpeg')) return 'jpg';
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('gif')) return 'gif';
  return 'bin';
}

function dataUrlToBytes(dataUrl = '') {
  const match = String(dataUrl).match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;
  const contentType = match[1] || 'application/octet-stream';
  if (!ALLOWED_TYPES.has(contentType)) return null;
  const binary = atob(match[2]);
  if (binary.length > MAX_BYTES) return null;
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { bytes, contentType };
}

function validAssetKey(key = '') {
  return /^johankarrd\/[a-zA-Z0-9._/-]+$/.test(String(key || '')) && !String(key).includes('..');
}

export async function onRequestGet({ request, env }) {
  try {
    const store = bucket(env);
    if (!store) return json({ error: 'R2 binding missing. Expected BOOSTR_ASSETS or JOHANKARRD_ASSETS.' }, 503);
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    if (!validAssetKey(key)) return json({ error: 'Invalid key' }, 400);
    const object = await store.get(key);
    if (!object) return json({ error: 'Not found' }, 404);
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=31536000, immutable');
    headers.set('x-content-type-options', 'nosniff');
    headers.set('content-security-policy', "default-src 'none'; sandbox");
    return new Response(object.body, { headers });
  } catch (error) {
    return json({ error: error.message || 'Unable to read asset' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const store = bucket(env);
    if (!store) return json({ error: 'R2 binding missing. Expected BOOSTR_ASSETS or JOHANKARRD_ASSETS.' }, 503);

    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (declaredLength > MAX_BYTES + 1024 * 1024) return json({ error: 'File is too large' }, 413);

    const contentType = request.headers.get('content-type') || '';
    let body;
    let fileName = 'asset';
    let mime = 'application/octet-stream';
    let size = 0;

    if (contentType.includes('application/json')) {
      const payload = await request.json().catch(() => null);
      if (!payload) return json({ error: 'Invalid JSON payload' }, 400);
      const parsed = dataUrlToBytes(payload.dataUrl || payload.data_url || '');
      if (!parsed) return json({ error: 'Invalid, unsupported, or oversized image data' }, 400);
      body = parsed.bytes;
      size = parsed.bytes.byteLength;
      mime = parsed.contentType;
      fileName = payload.filename || `asset.${extFromType(mime)}`;
    } else {
      const form = await request.formData();
      const file = form.get('file');
      if (!file || typeof file === 'string') return json({ error: 'Missing file' }, 400);
      mime = file.type || 'application/octet-stream';
      if (!ALLOWED_TYPES.has(mime)) return json({ error: 'Unsupported image type' }, 415);
      if (file.size > MAX_BYTES) return json({ error: 'File is too large' }, 413);
      fileName = file.name || `asset.${extFromType(mime)}`;
      body = await file.arrayBuffer();
      size = body.byteLength;
    }

    if (!ALLOWED_TYPES.has(mime)) return json({ error: 'Unsupported image type' }, 415);
    if (!size || size > MAX_BYTES) return json({ error: 'Invalid file size' }, 413);

    const key = `johankarrd/${Date.now()}-${crypto.randomUUID()}-${safeName(fileName)}`;
    await store.put(key, body, {
      httpMetadata: { contentType: mime },
      customMetadata: { source: 'Johankarrd BUILDR', size: String(size) }
    });

    return json({ ok: true, key, url: `/api/johankarrd/assets?key=${encodeURIComponent(key)}`, bytes: size });
  } catch (error) {
    return json({ error: error.message || 'Unable to upload asset' }, 500);
  }
}
