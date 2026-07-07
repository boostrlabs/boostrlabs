export async function onRequestGet() {
  return Response.json({
    ok: true,
    service: 'boostr-labs',
    target: 'cloudflare-pages',
    checkedAt: new Date().toISOString()
  });
}
