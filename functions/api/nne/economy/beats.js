import { clean, jsonError, jsonOk, now, requireNneSession } from "../../../_lib/nne-api.js";
import { ensureNneMarketplace, money } from "../../../_lib/nne-marketplace.js";

export async function onRequestPost({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneMarketplace(env);
  const body = await request.json().catch(() => ({}));
  const title = clean(body.title, 120);
  const bpm = Number(body.bpm || 0);
  const musicalKey = clean(body.musical_key, 24);
  const tags = clean(body.tags, 300);
  const previewUrl = clean(body.preview_url, 500);
  const leasePrice = money(body.lease_price_usd);
  const exclusivePrice = money(body.exclusive_price_usd);
  if (!title || (!leasePrice && !exclusivePrice)) return jsonError("nne_beat_invalid", "Agrega título y al menos un precio.", 400);
  const id = crypto.randomUUID();
  const timestamp = now();
  await env.DB.prepare(`INSERT INTO nne_beats (id,owner_user_id,title,bpm,musical_key,tags,preview_url,lease_price_cents,exclusive_price_cents,status,westdetro_certified,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,'submitted',0,?,?)`).bind(id,auth.user.id,title,bpm || null,musicalKey || null,tags || null,previewUrl || null,leasePrice || null,exclusivePrice || null,timestamp,timestamp).run();
  return jsonOk({ id, status: "submitted", message: "Beat enviado a revisión WESTDETRO." });
}
