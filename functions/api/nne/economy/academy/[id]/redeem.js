import { jsonError, jsonOk, now, requireNneSession } from "../../../../../_lib/nne-api.js";
import { ensureNneMarketplace } from "../../../../../_lib/nne-marketplace.js";

export async function onRequestPost({ request, env, params }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneMarketplace(env);
  const itemId = String(params.id || "");
  const item = await env.DB.prepare(`SELECT id,title,cost_nne,asset_url FROM nne_academy_items WHERE id=? AND status='published' LIMIT 1`).bind(itemId).first();
  if (!item?.id) return jsonError("nne_academy_not_found","Recurso no disponible.",404);
  const existing = await env.DB.prepare(`SELECT id FROM nne_academy_redemptions WHERE item_id=? AND user_id=? LIMIT 1`).bind(itemId,auth.user.id).first();
  if (existing?.id) return jsonOk({ already_owned:true, asset_url:item.asset_url || null });
  const balance = Number(auth.user.credits || 0);
  const cost = Number(item.cost_nne || 0);
  if (balance < cost) return jsonError("nne_insufficient_credits","No tienes suficientes NNE Credits.",409);
  const timestamp = now();
  const redemptionId = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO nne_academy_redemptions (id,item_id,user_id,cost_nne,created_at) VALUES (?,?,?,?,?)`).bind(redemptionId,itemId,auth.user.id,cost,timestamp),
    env.DB.prepare(`INSERT INTO nne_credit_transactions (id,user_id,amount,kind,source_type,source_id,description,created_at) VALUES (?,?,?,?,?,?,?,?)`)
      .bind(crypto.randomUUID(),auth.user.id,-cost,"reward_redemption","academy_item",redemptionId,`NNE Academy: ${item.title}`,timestamp)
  ]);
  return jsonOk({ redeemed:true, item_id:itemId, cost_nne:cost, asset_url:item.asset_url || null });
}
