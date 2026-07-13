export async function onRequestGet({ request, params }) {
  const id = String(params?.id || "").trim();
  if (!id) return new Response("Smart Payment Link missing.", { status: 400 });

  const incoming = new URL(request.url);
  const target = new URL("/pay/", incoming.origin);
  target.searchParams.set("id", id);

  for (const [key, value] of incoming.searchParams.entries()) {
    if (key !== "id") target.searchParams.append(key, value);
  }

  return new Response(null, {
    status: 302,
    headers: {
      location: `${target.pathname}${target.search}`,
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      pragma: "no-cache",
      expires: "0",
      "x-robots-tag": "noindex, nofollow"
    }
  });
}
