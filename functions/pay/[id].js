export async function onRequestGet({ request, params }) {
  const url = new URL(request.url);
  const id = String(params?.id || "").trim();
  if (!id) return Response.redirect(new URL('/pay/', url.origin).toString(), 302);
  const target = new URL('/pay/', url.origin);
  target.searchParams.set('id', id);
  for (const [key, value] of url.searchParams.entries()) target.searchParams.set(key, value);
  return Response.redirect(target.toString(), 302);
}
