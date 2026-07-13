import { clean } from "../../_lib/api.js";

function clampSize(value) {
  const size = Number(value || 720);
  if (!Number.isFinite(size)) return 720;
  return Math.min(1400, Math.max(180, Math.round(size)));
}

async function fetchProvider(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "BOOSTR-Smart-Parking/1.0" },
    cf: { cacheEverything: true, cacheTtl: 86400 }
  });
  if (!response.ok) throw new Error(`qr_provider_${response.status}`);
  const type = response.headers.get("content-type") || "image/png";
  if (!type.startsWith("image/")) throw new Error("qr_provider_invalid_type");
  return { bytes: await response.arrayBuffer(), type };
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const text = clean(url.searchParams.get("text"), 1800);
  const size = clampSize(url.searchParams.get("size"));
  if (!text) return new Response("QR text required.", { status: 400 });

  const encoded = encodeURIComponent(text);
  const providers = [
    `https://quickchart.io/qr?size=${size}&margin=2&ecLevel=H&format=png&text=${encoded}`,
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encoded}`
  ];

  for (const provider of providers) {
    try {
      const result = await fetchProvider(provider);
      return new Response(result.bytes, {
        headers: {
          "content-type": result.type,
          "cache-control": "public, max-age=86400, s-maxage=604800",
          "access-control-allow-origin": "*"
        }
      });
    } catch {}
  }

  return new Response("QR temporarily unavailable.", {
    status: 503,
    headers: { "cache-control": "no-store" }
  });
}
