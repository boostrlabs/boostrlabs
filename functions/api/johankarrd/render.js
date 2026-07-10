import { renderJohankarrdHtml } from '../../_lib/johankarrd-renderer.js';

export async function onRequestPost({ request }) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body?.site || typeof body.site !== 'object') {
      return new Response(JSON.stringify({ error: 'Missing site payload' }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      });
    }
    return new Response(renderJohankarrdHtml(body.site), {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'content-disposition': 'inline'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Unable to render site' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
    });
  }
}
