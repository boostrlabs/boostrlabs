import { clean, jsonError, jsonOk, now, requireNneSession } from "../../../_lib/nne-api.js";
import { centsFromUsd, ensureNneEconomicOs } from "../../../_lib/nne-economic-os.js";

const SERVICE_CATEGORIES = new Set(['mix_master','production','design','video','songwriting','content','marketing','other']);
const JOB_BUDGET_TYPES = new Set(['usd','nne','mixed']);

export async function onRequestGet({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneEconomicOs(env);

  const [beats, services, jobs, academy, earnings, mineBeats, mineServices] = await Promise.all([
    env.DB.prepare(`SELECT b.id,b.title,b.producer_name,b.bpm,b.musical_key,b.tags,b.preview_url,b.artwork_url,b.lease_price_cents,b.exclusive_price_cents,b.westdetro_status,u.username FROM nne_marketplace_beats b JOIN nne_users u ON u.id=b.seller_user_id WHERE b.marketplace_status='published' ORDER BY (b.westdetro_status='certified') DESC,b.created_at DESC LIMIT 60`).all(),
    env.DB.prepare(`SELECT s.id,s.title,s.category,s.description,s.price_cents,s.delivery_days,s.revisions,u.username FROM nne_marketplace_services s JOIN nne_users u ON u.id=s.seller_user_id WHERE s.status='published' ORDER BY s.created_at DESC LIMIT 60`).all(),
    env.DB.prepare(`SELECT j.id,j.title,j.category,j.description,j.budget_type,j.budget_amount,j.deadline_at,u.username FROM nne_jobs j JOIN nne_users u ON u.id=j.client_user_id WHERE j.status='open' ORDER BY j.created_at DESC LIMIT 60`).all(),
    env.DB.prepare(`SELECT id,title,category,description,cost_credits,preview_url FROM nne_academy_items WHERE status='published' ORDER BY sort_order,created_at DESC LIMIT 100`).all(),
    env.DB.prepare(`SELECT COALESCE(SUM(CASE WHEN status='available' THEN amount_cents ELSE 0 END),0) AS available_cents,COALESCE(SUM(CASE WHEN kind='sale' THEN amount_cents ELSE 0 END),0) AS lifetime_cents FROM nne_seller_earnings WHERE user_id=?`).bind(auth.user.id).first(),
    env.DB.prepare(`SELECT id,title,westdetro_status,marketplace_status,created_at FROM nne_marketplace_beats WHERE seller_user_id=? ORDER BY created_at DESC LIMIT 20`).bind(auth.user.id).all(),
    env.DB.prepare(`SELECT id,title,status,created_at FROM nne_marketplace_services WHERE seller_user_id=? ORDER BY created_at DESC LIMIT 20`).bind(auth.user.id).all()
  ]);

  return jsonOk({
    beats: beats.results || [],
    services: services.results || [],
    jobs: jobs.results || [],
    academy: academy.results || [],
    wallet: { available_cents: Number(earnings?.available_cents || 0), lifetime_cents: Number(earnings?.lifetime_cents || 0), currency: 'usd', cashout_source: 'seller_earnings_only' },
    mine: { beats: mineBeats.results || [], services: mineServices.results || [] },
    economics: { nne_credits_purchasable: false, nne_credits_cashout: false, seller_earnings_cashout: true, event_cashback_percent: 20 }
  });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneEconomicOs(env);
  const body = await request.json().catch(() => null);
  const action = clean(body?.action, 40);
  const timestamp = now();

  if (action === 'submit_beat') {
    const title = clean(body?.title, 140);
    const producer = clean(body?.producer_name || auth.user.name || auth.user.username, 140);
    const previewUrl = clean(body?.preview_url, 1000);
    const lease = centsFromUsd(body?.lease_price_usd);
    const exclusive = body?.exclusive_price_usd ? centsFromUsd(body.exclusive_price_usd) : 0;
    const bpm = Math.max(0, Math.min(300, Number(body?.bpm || 0))) || null;
    if (!title || !previewUrl || !lease) return jsonError('nne_beat_invalid','Título, preview y precio de lease son obligatorios.',400);
    const id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO nne_marketplace_beats (id,seller_user_id,title,producer_name,bpm,musical_key,tags,preview_url,lease_price_cents,exclusive_price_cents,currency,westdetro_status,marketplace_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,'usd','submitted','pending',?,?)`)
      .bind(id,auth.user.id,title,producer,bpm,clean(body?.musical_key,30)||null,clean(body?.tags,500)||null,previewUrl,lease,exclusive||null,timestamp,timestamp).run();
    return jsonOk({ id, status:'pending', westdetro_status:'submitted' });
  }

  if (action === 'submit_service') {
    const title = clean(body?.title, 140);
    const description = clean(body?.description, 1200);
    const category = SERVICE_CATEGORIES.has(body?.category) ? body.category : 'other';
    const price = centsFromUsd(body?.price_usd);
    const days = Math.max(1, Math.min(90, Number(body?.delivery_days || 7)));
    if (!title || !description || !price) return jsonError('nne_service_invalid','Título, descripción y precio son obligatorios.',400);
    const id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO nne_marketplace_services (id,seller_user_id,title,category,description,price_cents,currency,delivery_days,revisions,status,created_at,updated_at) VALUES (?,?,?,?,?,?,'usd',?,?,'pending',?,?)`)
      .bind(id,auth.user.id,title,category,description,price,days,Math.max(0,Math.min(20,Number(body?.revisions ?? 1))),timestamp,timestamp).run();
    return jsonOk({ id, status:'pending' });
  }

  if (action === 'post_job') {
    const title = clean(body?.title, 140);
    const description = clean(body?.description, 1600);
    const category = clean(body?.category, 80) || 'other';
    const budgetType = JOB_BUDGET_TYPES.has(body?.budget_type) ? body.budget_type : 'usd';
    const budgetAmount = budgetType === 'usd' ? centsFromUsd(body?.budget_amount) : Math.round(Number(body?.budget_amount || 0) * 100);
    if (!title || !description || budgetAmount <= 0) return jsonError('nne_job_invalid','Título, descripción y presupuesto son obligatorios.',400);
    const id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO nne_jobs (id,client_user_id,title,category,description,budget_type,budget_amount,deadline_at,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?, 'open',?,?)`)
      .bind(id,auth.user.id,title,category,description,budgetType,budgetAmount,clean(body?.deadline_at,50)||null,timestamp,timestamp).run();
    return jsonOk({ id, status:'open' });
  }

  return jsonError('nne_economic_action_invalid','Acción no soportada.',400);
}
