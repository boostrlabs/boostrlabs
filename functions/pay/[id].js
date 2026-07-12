export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const assetUrl = new URL('/pay/index.html', url.origin);

  if (env.ASSETS?.fetch) {
    const response = await env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    if (response.ok) return response;
  }

  return new Response('BOOSTR Smart Pay unavailable.', {
    status: 503,
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
}
