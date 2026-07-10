import { renderJohankarrdHtml } from '../../_lib/johankarrd-renderer.js';

const MAX_REQUEST_BYTES = 6 * 1024 * 1024;
const MAX_HTML_BYTES = 3 * 1024 * 1024;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  }
});

export async function onRequestPost({ request }) {
  try {
    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (declaredLength > MAX_REQUEST_BYTES) return json({ error: 'Render payload is too large' }, 413);

    const body = await request.json().catch(() => null);
    if (!body?.site || typeof body.site !== 'object' || Array.isArray(body.site)) {
      return json({ error: 'Missing site payload' }, 400);
    }

    const html = renderJohankarrdHtml(body.site);
    if (!html.includes('<!doctype html>') || !html.includes('class="site"') || !html.includes('function show()')) {
      return json({ error: 'Rendered HTML failed safety checks' }, 422);
    }
    if (html.length > MAX_HTML_BYTES) return json({ error: 'Rendered Johankarrd is too large' }, 413);

    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'content-disposition': 'inline',
        'x-content-type-options': 'nosniff',
        'content-security-policy': "default-src 'self' data: blob: https:; img-src 'self' data: blob: https:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"
      }
    });
  } catch (error) {
    return json({ error: error.message || 'Unable to render site' }, 500);
  }
}
