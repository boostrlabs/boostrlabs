import { clean, jsonError, jsonOk, now, requireNneSession } from "../../../_lib/nne-api.js";
import { ensureNneMarketplace, money, safeCategory } from "../../../_lib/nne-marketplace.js";

export async function onRequestPost({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneMarketplace(env);
  const body = await request.json().catch(() => ({}));
  const title = clean(body.title, 140);
  const description = clean(body.description, 1200);
  const category = safeCategory(body.category, "music_service");
  const priceCents = money(body.price_usd);
  const turnaroundDays = Math.max(1, Math.min(90, Number(body.turnaround_days || 7)));
  if (!title || !description || priceCents <= 0) return jsonError("nne_service_invalid", "Agrega título, descripción y precio.", 400);
  const id = crypto.randomUUID();
  const timestamp = now();
  await env.DB.prepare(`INSERT INTO nne_service_listings (id,seller_user_id,category,title,description,price_cents,turnaround_days,status,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,'published',?,?)`).bind(id,auth.user.id,category,title,description,priceCents,turnaroundDays,timestamp,timestamp).run();
  return jsonOk({ id, status: "published" });
}
