import { clean, jsonError, jsonOk, now, requireNneSession } from "../../../_lib/nne-api.js";
import { ensureNneMarketplace, safeCategory } from "../../../_lib/nne-marketplace.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneMarketplace(env);
  const [portfolio,bounties,wishlist,drops,partners,applications] = await Promise.all([
    env.DB.prepare(`SELECT id,item_type,title,description,url,status,created_at FROM nne_portfolio_items WHERE user_id=? AND status='published' ORDER BY created_at DESC LIMIT 30`).bind(auth.user.id).all(),
    env.DB.prepare(`SELECT id,title,description,reward_nne,reward_usd_cents,winner_count,status,starts_at,ends_at FROM nne_bounties WHERE status IN ('open','judging') ORDER BY created_at DESC LIMIT 30`).all(),
    env.DB.prepare(`SELECT id,target_type,target_id,target_name,target_cost_nne,status FROM nne_wishlist WHERE user_id=? AND status='active' ORDER BY created_at DESC LIMIT 30`).bind(auth.user.id).all(),
    env.DB.prepare(`SELECT id,title,description,drop_type,target_id,cost_nne,inventory,starts_at,ends_at,status FROM nne_drops WHERE status='published' OR status='active' ORDER BY created_at DESC LIMIT 30`).all(),
    env.DB.prepare(`SELECT id,partner_name,title,description,cashback_percent,redemption_cost_nne,external_url,status FROM nne_partner_offers WHERE status='published' OR status='active' ORDER BY created_at DESC LIMIT 30`).all(),
    env.DB.prepare(`SELECT a.id,a.job_id,a.pitch,a.portfolio_url,a.status,a.created_at,j.title job_title FROM nne_job_applications a JOIN nne_jobs j ON j.id=a.job_id WHERE a.applicant_user_id=? ORDER BY a.created_at DESC LIMIT 30`).bind(auth.user.id).all()
  ]);
  return jsonOk({ portfolio:portfolio.results||[], bounties:bounties.results||[], wishlist:wishlist.results||[], drops:drops.results||[], partners:partners.results||[], job_applications:applications.results||[] });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneMarketplace(env);
  const body = await request.json().catch(() => ({}));
  const action = clean(body.action, 60);
  const timestamp = now();

  if (action === 'portfolio_add') {
    const title=clean(body.title,140), description=clean(body.description,800), url=clean(body.url,500), itemType=safeCategory(body.item_type,'work');
    if (!title || !description) return jsonError('nne_portfolio_invalid','Agrega título y descripción.',400);
    const id=crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO nne_portfolio_items (id,user_id,item_type,title,description,url,status,created_at,updated_at) VALUES (?,?,?,?,?,?,'published',?,?)`).bind(id,auth.user.id,itemType,title,description,url||null,timestamp,timestamp).run();
    return jsonOk({id,status:'published'});
  }

  if (action === 'wishlist_add') {
    const targetType=safeCategory(body.target_type,'reward'), targetId=clean(body.target_id,120), targetName=clean(body.target_name,160), targetCost=Number(body.target_cost_nne||0);
    if (!targetId || !targetName || targetCost<=0) return jsonError('nne_wishlist_invalid','Meta inválida.',400);
    const id=crypto.randomUUID();
    await env.DB.prepare(`INSERT OR IGNORE INTO nne_wishlist (id,user_id,target_type,target_id,target_name,target_cost_nne,status,created_at,updated_at) VALUES (?,?,?,?,?,?,'active',?,?)`).bind(id,auth.user.id,targetType,targetId,targetName,targetCost,timestamp,timestamp).run();
    return jsonOk({id,status:'active'});
  }

  if (action === 'job_apply') {
    const jobId=clean(body.job_id,120), pitch=clean(body.pitch,1200), portfolioUrl=clean(body.portfolio_url,500);
    const job=jobId?await env.DB.prepare(`SELECT id,creator_user_id,status FROM nne_jobs WHERE id=? LIMIT 1`).bind(jobId).first():null;
    if (!job?.id || job.status!=='open') return jsonError('nne_job_closed','Este trabajo no está abierto.',404);
    if (job.creator_user_id===auth.user.id) return jsonError('nne_job_self_apply','No puedes aplicar a tu propio trabajo.',400);
    if (!pitch) return jsonError('nne_pitch_required','Escribe un pitch corto.',400);
    const id=crypto.randomUUID();
    await env.DB.prepare(`INSERT OR IGNORE INTO nne_job_applications (id,job_id,applicant_user_id,pitch,portfolio_url,status,created_at,updated_at) VALUES (?,?,?,?,?,'submitted',?,?)`).bind(id,jobId,auth.user.id,pitch,portfolioUrl||null,timestamp,timestamp).run();
    return jsonOk({id,status:'submitted'});
  }

  if (action === 'bounty_enter') {
    const bountyId=clean(body.bounty_id,120), submissionUrl=clean(body.submission_url,500), note=clean(body.note,800);
    const bounty=bountyId?await env.DB.prepare(`SELECT id,status FROM nne_bounties WHERE id=? LIMIT 1`).bind(bountyId).first():null;
    if (!bounty?.id || bounty.status!=='open') return jsonError('nne_bounty_closed','Este bounty no está abierto.',404);
    if (!submissionUrl && !note) return jsonError('nne_bounty_entry_invalid','Agrega evidencia o una nota.',400);
    const id=crypto.randomUUID();
    await env.DB.prepare(`INSERT OR REPLACE INTO nne_bounty_entries (id,bounty_id,user_id,submission_url,note,status,created_at,updated_at) VALUES (?,?,?,?,?,'submitted',?,?)`).bind(id,bountyId,auth.user.id,submissionUrl||null,note||null,timestamp,timestamp).run();
    return jsonOk({id,status:'submitted'});
  }

  return jsonError('nne_economy_action_invalid','Acción no disponible.',400);
}
