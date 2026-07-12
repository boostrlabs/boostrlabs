export async function onRequest() {
  return Response.redirect('/app/products-v3/', 302);
}
