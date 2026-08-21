import { jsonOk, requireNneSession } from "../../../_lib/nne-api.js";
import { ensureNneMarketplace } from "../../../_lib/nne-marketplace.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneMarketplace(env);

  const [beats, services, academy, jobs, seller] = await Promise.all([
    env.DB.prepare(`SELECT b.id,b.title,b.bpm,b.musical_key,b.tags,b.preview_url,b.artwork_url,b.lease_price_cents,b.exclusive_price_cents,b.westdetro_certified,u.username
      FROM nne_beats b JOIN nne_users u ON u.id=b.owner_user_id WHERE b.status='published' ORDER BY b.westdetro_certified DESC,b.updated_at DESC LIMIT 24`).all(),
    env.DB.prepare(`SELECT s.id,s.category,s.title,s.description,s.price_cents,s.turnaround_days,u.username
      FROM nne_service_listings s JOIN nne_users u ON u.id=s.seller_user_id WHERE s.status='published' ORDER BY s.updated_at DESC LIMIT 24`).all(),
    env.DB.prepare(`SELECT id,title,description,category,cost_nne FROM nne_academy_items WHERE status='published' ORDER BY updated_at DESC LIMIT 24`).all(),
    env.DB.prepare(`SELECT j.id,j.title,j.description,j.category,j.compensation_type,j.budget_cents,j.budget_nne,u.username
      FROM nne_jobs j JOIN nne_users u ON u.id=j.creator_user_id WHERE j.status='open' ORDER BY j.created_at DESC LIMIT 24`).all(),
    env.DB.prepare(`SELECT COALESCE(SUM(amount_cents),0) AS balance_cents FROM nne_seller_ledger WHERE user_id=?`).bind(auth.user.id).first()
  ]);

  return jsonOk({
    seller_balance_cents: Number(seller?.balance_cents || 0),
    nne_credits: Number(auth.user.credits || 0),
    beats: beats.results || [],
    services: services.results || [],
    academy: academy.results || [],
    jobs: jobs.results || [],
    rules: {
      nne_purchasable_with_cash: false,
      nne_cashout: false,
      seller_earnings_cashout: true,
      academy_payment: 'nne_only',
      marketplace_payment: 'usd'
    }
  });
}
