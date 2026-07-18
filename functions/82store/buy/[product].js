import { ensure82StoreProduct, get82StoreProduct } from "../../_lib/store-82.js";

export async function onRequestGet({ env, params }) {
  const slug = String(params?.product || "").trim().toLowerCase();
  if (!get82StoreProduct(slug)) return new Response("82 Store product not found.", { status: 404 });
  if (!env?.DB) return new Response("Payments are temporarily unavailable.", { status: 503 });
  try {
    const { linkId } = await ensure82StoreProduct(env, slug);
    return new Response(null, { status: 302, headers: { location: `/pay/${encodeURIComponent(linkId)}`, "cache-control": "no-store" } });
  } catch (error) {
    console.error("82 Store checkout provisioning failed", { product: slug, error: String(error?.message || error) });
    return new Response("We could not prepare the secure checkout. Please try again.", { status: 503, headers: { "cache-control": "no-store" } });
  }
}
