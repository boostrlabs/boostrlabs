import { clean } from "../_lib/nne-api.js";

export async function onRequestGet({ env, params }) {
  const channel = clean(params.channel, 20).toLowerCase();
  if (!['whatsapp', 'telegram', 'instagram'].includes(channel)) {
    return new Response("Canal no encontrado.", { status: 404 });
  }
  const row = await env.DB.prepare(
    "SELECT join_url,status FROM nne_channel_settings WHERE channel=? LIMIT 1"
  ).bind(channel).first();
  if (row?.status === "active" && /^https:\/\//i.test(row.join_url || "")) {
    return Response.redirect(row.join_url, 302);
  }
  return new Response(
    "Este canal se está conectando. Vuelve a intentar en unos minutos.",
    { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } }
  );
}
