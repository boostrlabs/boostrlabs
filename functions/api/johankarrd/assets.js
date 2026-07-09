function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function bucket(env) {
  return env.JOHANKARRD_ASSETS || env.BOOSTR_ASSETS || env.ASSETS_BUCKET || env.R2_BUCKET || null;
}

function safeName(name = 'asset') {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'asset';
}

export async function onRequestGet({ request, env }) {
  const store = bucket(env);
  if (!store) return json({ error: 'R2 binding missing' }, 503);
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) return json({ error: 'Missing key' }, 400);
  const object = await store.get(key);
  if (!object) return json({ error: 'Not found' }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}

export async function onRequestPost({ request, env }) {
  const store = bucket(env);
  if (!store) return json({ error: 'R2 binding missing' }, 503);
  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ error: 'Missing file' }, 400);
  const key = `johankarrd/${Date.now()}-${crypto.randomUUID()}-${safeName(file.name)}`;
  await store.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream'
    },
    customMetadata: {
      source: 'Johankarrd BUILDR'
    }
  });
  return json({ ok: true, key, url: `/api/johankarrd/assets?key=${encodeURIComponent(key)}` });
}
