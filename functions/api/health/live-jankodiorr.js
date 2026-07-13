import { JANKO_LIVE_HTML } from "../../_lib/janko-live-demo.js";

const requiredMarkers = [
  "BOOSTR Labs",
  "MODO GUEST",
  "LOGIN BOOSTR",
  "STREAM OFFLINE",
  "No hay subasta activa",
  "Último artículo subastado",
  "LOGIN PARA PARTICIPAR"
];

export async function onRequestGet(){
  const missing = requiredMarkers.filter((marker) => !JANKO_LIVE_HTML.includes(marker));
  return new Response(JSON.stringify({
    ok: missing.length === 0,
    service: "boostr-live-jankodiorr",
    route: "/live/jankodiorr",
    build: "live-viewer-offline-v4",
    checks: {
      html_template: true,
      guest_mode: !missing.includes("MODO GUEST"),
      login_cta: !missing.includes("LOGIN BOOSTR"),
      stream_offline_state: !missing.includes("STREAM OFFLINE"),
      auction_empty_state: !missing.includes("No hay subasta activa"),
      last_auction_state: !missing.includes("Último artículo subastado"),
      guest_chat_lock: !missing.includes("LOGIN PARA PARTICIPAR")
    },
    missing
  }, null, 2), {
    status: missing.length === 0 ? 200 : 503,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store",
      "x-boostr-health": missing.length === 0 ? "pass" : "fail"
    }
  });
}
