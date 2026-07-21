import QRCode from "qrcode";
import { clean } from "../../_lib/api.js";
import { verifyToyotaPass } from "../../_lib/toyota-qr.js";

const svgResponse = (body, status = 200) => new Response(body, {
  status,
  headers: {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff"
  }
});

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = clean(url.searchParams.get("token"), 3000);
  const result = await verifyToyotaPass(env, token);
  if (!result.ok) return svgResponse("<svg xmlns='http://www.w3.org/2000/svg'/>", 400);

  const validationUrl = `${url.origin}/verify/?token=${encodeURIComponent(token)}`;
  const svg = await QRCode.toString(validationUrl, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 720,
    color: { dark: "#111111", light: "#ffffff" }
  });
  return svgResponse(svg);
}
