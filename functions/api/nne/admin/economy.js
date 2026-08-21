import { clean, jsonError, jsonOk, now, requireNneAdmin, writeNneAudit } from "../../../_lib/nne-api.js";
import { ensureNneMarketplace, safeCategory } from "../../../_lib/nne-marketplace.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneMarketplace(env);
  const [beats,services,jobs,academy,bounties,partners,drops,payouts] = await Promise.all([
    env.DB.prepare(`SELECT b.*,u.username FROM nne_beats b JOIN nne_users u ON u.id=b.owner_user_id ORDER BY CASE b.status WHEN 'submitted' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END,b.created_at DESC LIMIT 100`).all(),
    env.DB.prepare(`SELECT s.*,u.username FROM nne_service_listings s JOIN nne_users u ON u.id=s.seller_user_id ORDER BY s.created_at DESC LIMIT 100`).all(),
    env.DB.prepare(`SELECT j.*,u.username FROM nne_jobs j JOIN nne_users u ON u.id=j.creator_user_id ORDER BY j.created_at DESC LIMIT 100`).all(),
    env.DB.prepare(`SELECT * FROM nne_academy_items ORDER BY created_at DESC LIMIT 100`).all(),
    env.DB.prepare(`SELECT * FROM nne_bounties ORDER BY created_at DESC LIMIT 100`).all(),
    env.DB.prepare(`SELECT * FROM nne_partner_offers ORDER BY created_at DESC LIMIT 100`).all(),
    env.DB.prepare(`SELECT * FROM nne_drops ORDER BY created_at DESC LIMIT 100`).all(),
    env.DB.prepare(`SELECT p.*,u.username FROM nne_seller_payout_requests p JOIN nne_users u ON u.id=p.user_id ORDER BY p.created_at DESC LIMIT 100`).all()
  ]);
  return jsonOk({ beats:beats.results||[], services:services.results||[], jobs:jobs.results||[], academy:academy.results||[], bounties:bounties.results||[], partners:partners.results||[], drops:drops.results||[], payouts:payouts.results||[] });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneMarketplace(env);
  const body = await request.json().catch(()=>({}));
  const action = clean(body.action,60);
  const timestamp = now();

  if (['certify_publish','publish','reject','reviewing'].includes(action)) {
    const beatId = clean(body.beat_id,100);
    if (!beatId) return jsonError('nne_economy_admin_invalid','Beat inválido.',400);
    const note = clean(body.note,500) || null;
    if (action === 'certify_publish') await env.DB.prepare(`UPDATE nne_beats SET status='published',westdetro_certified=1,review_note=?,updated_at=? WHERE id=?`).bind(note,timestamp,beatId).run();
    if (action === 'publish') await env.DB.prepare(`UPDATE nne_beats SET status='published',westdetro_certified=0,review_note=?,updated_at=? WHERE id=?`).bind(note,timestamp,beatId).run();
    if (action === 'reject') await env.DB.prepare(`UPDATE nne_beats SET status='rejected',westdetro_certified=0,review_note=?,updated_at=? WHERE id=?`).bind(note || 'No seleccionado',timestamp,beatId).run();
    if (action === 'reviewing') await env.DB.prepare(`UPDATE nne_beats SET status='reviewing',review_note=?,updated_at=? WHERE id=?`).bind(note,timestamp,beatId).run();
    await writeNneAudit(env,request,auth.user.id,`economy.beat.${action}`,'nne_beat',beatId,{ note });
    return jsonOk({ beat_id:beatId, action });
  }

  if (action === 'academy_create') {
    const title=clean(body.title,160),description=clean(body.description,1200),category=safeCategory(body.category,'other'),cost=Number(body.cost_nne||0),asset=clean(body.asset_url,500);
    if(!title||!description||cost<=0)return jsonError('nne_academy_invalid','Completa título, descripción y costo.',400);
    const id=crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO nne_academy_items (id,title,description,category,cost_nne,asset_url,status,created_at,updated_at) VALUES (?,?,?,?,?,?,'published',?,?)`).bind(id,title,description,category,cost,asset||null,timestamp,timestamp).run();
    await writeNneAudit(env,request,auth.user.id,'economy.academy.create','nne_academy_item',id,{title,cost_nne:cost});
    return jsonOk({id,status:'published'});
  }

  if (action === 'bounty_create') {
    const title=clean(body.title,160),description=clean(body.description,1200),rewardNne=Number(body.reward_nne||0),rewardUsdCents=Math.max(0,Math.round(Number(body.reward_usd||0)*100)),winnerCount=Math.max(1,Math.min(20,Number(body.winner_count||1))),endsAt=clean(body.ends_at,60)||null;
    if(!title||!description||(rewardNne<=0&&rewardUsdCents<=0))return jsonError('nne_bounty_invalid','Completa el bounty y su premio.',400);
    const id=crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO nne_bounties (id,created_by,title,description,reward_nne,reward_usd_cents,winner_count,status,starts_at,ends_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'open',?,?,?,?)`).bind(id,auth.user.id,title,description,rewardNne,rewardUsdCents||null,winnerCount,timestamp,endsAt,timestamp,timestamp).run();
    await writeNneAudit(env,request,auth.user.id,'economy.bounty.create','nne_bounty',id,{title,reward_nne:rewardNne,reward_usd_cents:rewardUsdCents});
    return jsonOk({id,status:'open'});
  }

  if (action === 'partner_create') {
    const partner=clean(body.partner_name,160),title=clean(body.title,160),description=clean(body.description,1200),cashback=Number(body.cashback_percent||0),cost=Number(body.redemption_cost_nne||0),url=clean(body.external_url,500);
    if(!partner||!title||!description)return jsonError('nne_partner_invalid','Completa la oferta del partner.',400);
    const id=crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO nne_partner_offers (id,partner_name,title,description,cashback_percent,redemption_cost_nne,external_url,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'active',?,?)`).bind(id,partner,title,description,cashback>0?cashback:null,cost>0?cost:null,url||null,timestamp,timestamp).run();
    await writeNneAudit(env,request,auth.user.id,'economy.partner.create','nne_partner_offer',id,{partner,title});
    return jsonOk({id,status:'active'});
  }

  if (action === 'drop_create') {
    const title=clean(body.title,160),description=clean(body.description,1200),dropType=safeCategory(body.drop_type,'academy'),targetId=clean(body.target_id,120),cost=Number(body.cost_nne||0),inventory=body.inventory==null||body.inventory===''?null:Math.max(0,Number(body.inventory)),startsAt=clean(body.starts_at,60)||timestamp,endsAt=clean(body.ends_at,60)||null;
    if(!title||!description)return jsonError('nne_drop_invalid','Completa el drop.',400);
    const id=crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO nne_drops (id,title,description,drop_type,target_id,cost_nne,inventory,starts_at,ends_at,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,'active',?,?)`).bind(id,title,description,dropType,targetId||null,cost>0?cost:null,inventory,startsAt,endsAt,timestamp,timestamp).run();
    await writeNneAudit(env,request,auth.user.id,'economy.drop.create','nne_drop',id,{title,drop_type:dropType});
    return jsonOk({id,status:'active'});
  }

  if (action === 'payout_update') {
    const payoutId=clean(body.payout_id,120),status=['approved','fulfilled','rejected'].includes(String(body.status))?String(body.status):'';
    if(!payoutId||!status)return jsonError('nne_payout_invalid','Solicitud inválida.',400);
    const payout=await env.DB.prepare(`SELECT * FROM nne_seller_payout_requests WHERE id=? LIMIT 1`).bind(payoutId).first();
    if(!payout?.id)return jsonError('nne_payout_not_found','Solicitud no encontrada.',404);
    const externalReference=clean(body.external_reference,240)||null;
    const statements=[env.DB.prepare(`UPDATE nne_seller_payout_requests SET status=?,external_reference=COALESCE(?,external_reference),updated_at=? WHERE id=?`).bind(status,externalReference,timestamp,payoutId)];
    if(status==='fulfilled') statements.push(env.DB.prepare(`INSERT OR IGNORE INTO nne_seller_ledger (id,user_id,amount_cents,kind,source_type,source_id,description,created_at) VALUES (?,?,?,'cashout','payout_request',?,'Seller cashout',?)`).bind(crypto.randomUUID(),payout.user_id,-Math.abs(Number(payout.amount_cents)),payoutId,timestamp));
    await env.DB.batch(statements);
    await writeNneAudit(env,request,auth.user.id,`economy.payout.${status}`,'nne_seller_payout',payoutId,{external_reference:externalReference});
    return jsonOk({id:payoutId,status});
  }

  return jsonError('nne_economy_admin_invalid','Acción inválida.',400);
}
