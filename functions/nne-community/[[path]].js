const assetExtension = /\.[a-z0-9]{2,8}$/i;

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const isAsset = url.pathname.startsWith("/nne-community/assets/") || assetExtension.test(url.pathname);
  const target = isAsset
    ? url
    : new URL("/nne-community/spa-shell", url.origin);

  const response = await env.ASSETS.fetch(new Request(target, request));
  if (isAsset) return response;

  const headers = new Headers(response.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "no-cache");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
