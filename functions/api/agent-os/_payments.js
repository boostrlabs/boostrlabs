import { getStripeCredentials, stripeRequest, stripeForm } from '../../_lib/stripe.js';
const response = (data, status=200) => new Response(JSON.stringify(data), {status,headers:{'content-type':'application/json','cache-control':'no-store'}});
export async function paymentRoutes(ctx, user, path) {
  const db=ctx.env.AGENT_DB, method=ctx.request.method;
  if(path==='stripe/webhook' && method==='POST') {
    const secret=await db.prepare("SELECT value FROM private_settings WHERE key='stripe_webhook'").first();
    if(!secret) return response({error:'Webhook unavailable'},503);
    const raw=await ctx.request.text(), header=ctx.request.headers.get('stripe-signature')||'';
    const parts=header.split(',').map(s=>s.split('=')), timestamp=parts.find(p=>p[0]==='t')?.[1];
    if(!timestamp||Math.abs(Date.now()/1000-Number(timestamp))>300) return response({error:'Invalid signature'},400);
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret.value),{name:'HMAC',hash:'SHA-256'},false,['verify']);
    let valid=false;
    for(const [,sig] of parts.filter(p=>p[0]==='v1')) {
      if(!/^[a-f0-9]{64}$/i.test(sig)) continue;
      if(await crypto.subtle.verify('HMAC',key,Uint8Array.from(sig.match(/../g),x=>parseInt(x,16)),new TextEncoder().encode(`${timestamp}.${raw}`))) valid=true;
    }
    if(!valid) return response({error:'Invalid signature'},400);
    const event=JSON.parse(raw), invoice=event.data?.object;
    if(event.type==='invoice.paid') await recordPaid(db,invoice);
    return response({received:true});
  }
  if(!path.startsWith('admin/')) return null;
  if(user?.role!=='ADMIN') return response({error:'Unauthorized'},401);
  if(path==='admin/sales'&&method==='GET') {
    const [leads,deals,commissions]=await Promise.all([db.prepare('SELECT l.*,u.name AS agent_name FROM leads l JOIN users u ON u.id=l.agent_id ORDER BY l.created_at DESC').all(),db.prepare('SELECT * FROM deals ORDER BY created_at DESC').all(),db.prepare('SELECT c.*,u.name AS agent_name FROM commissions c JOIN users u ON u.id=c.agent_id ORDER BY c.created_at DESC').all()]);
    return response({leads:leads.results,deals:deals.results,commissions:commissions.results});
  }
  if(path==='admin/stripe-connect'&&method==='POST') {
    const {secretKey,mode}=await getStripeCredentials(ctx.env);
    const url=new URL('/api/agent-os/stripe/webhook',ctx.request.url).href;
    const existing=await db.prepare("SELECT value FROM private_settings WHERE key='stripe_webhook_url'").first();
    if(existing?.value===url) return response({ok:true,mode});
    const endpoint=await stripeRequest(secretKey,'/webhook_endpoints',{method:'POST',body:stripeForm({url,'enabled_events[0]':'invoice.paid',description:'BOOSTR Agent OS commissions'})});
    await db.batch([db.prepare("INSERT OR REPLACE INTO private_settings(key,value) VALUES('stripe_webhook',?)").bind(endpoint.secret),db.prepare("INSERT OR REPLACE INTO private_settings(key,value) VALUES('stripe_webhook_url',?)").bind(url)]);
    return response({ok:true,mode});
  }
  if(path==='admin/deals'&&method==='POST') {
    const b=await ctx.request.json(), amount=Math.round(Number(b.amount)*100), commission=Math.round(Number(b.commission)*100);
    if(!Number.isSafeInteger(amount)||amount<20000||!Number.isSafeInteger(commission)||commission<=0||commission>amount||!b.scope?.trim()||!b.terms?.trim()||!/^\S+@\S+\.\S+$/.test(b.customer_email||'')) return response({error:'Revisa importe, comisión, email, alcance y términos'},400);
    const lead=await db.prepare('SELECT * FROM leads WHERE id=?').bind(b.lead_id).first();
    if(!lead) return response({error:'Lead no encontrado'},404);
    if(b.scope.length>3000||b.terms.length>3000) return response({error:'Máximo 3000 caracteres por campo'},400);
    const {secretKey,mode}=await getStripeCredentials(ctx.env);
    if(mode!=='live') return response({error:'Stripe está en modo prueba. Configura la cuenta live antes de cobrar.'},409);
    const deal='deal_'+crypto.randomUUID();
    await db.prepare('INSERT INTO deals(id,lead_id,agent_id,business_name,customer_email,amount_cents,commission_cents,scope,terms,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(deal,lead.id,lead.agent_id,lead.business_name,b.customer_email,amount,commission,b.scope,b.terms,new Date().toISOString()).run();
    const customer=await stripeRequest(secretKey,'/customers',{method:'POST',idempotencyKey:deal+'-customer',body:stripeForm({email:b.customer_email,name:lead.business_name})});
    const inv=await stripeRequest(secretKey,'/invoices',{method:'POST',idempotencyKey:deal+'-invoice',body:stripeForm({customer:customer.id,collection_method:'send_invoice',days_until_due:7,auto_advance:false,description:b.scope,footer:b.terms,'metadata[boostr_agent_deal]':deal})});
    await db.prepare('UPDATE deals SET stripe_invoice_id=? WHERE id=?').bind(inv.id,deal).run();
    await stripeRequest(secretKey,'/invoiceitems',{method:'POST',idempotencyKey:deal+'-item',body:stripeForm({customer:customer.id,invoice:inv.id,currency:'usd',amount,description:b.scope})});
    const finalized=await stripeRequest(secretKey,`/invoices/${inv.id}/finalize`,{method:'POST',idempotencyKey:deal+'-finalize',body:stripeForm({auto_advance:false})});
    await db.prepare("UPDATE deals SET status='OPEN',invoice_url=? WHERE id=?").bind(finalized.hosted_invoice_url,deal).run();
    return response({ok:true,invoice_url:finalized.hosted_invoice_url},201);
  }
  if(path==='admin/reconcile'&&method==='POST') {
    const {secretKey}=await getStripeCredentials(ctx.env), {results}=await db.prepare("SELECT stripe_invoice_id FROM deals WHERE status='OPEN'").all();
    for(const d of results) await recordPaid(db,await stripeRequest(secretKey,`/invoices/${d.stripe_invoice_id}`));
    return response({ok:true});
  }
  if(path==='admin/payout'&&method==='POST') {
    const b=await ctx.request.json();
    if(!['Zelle','PayPal','Crypto','Moneda local'].includes(b.method)||!b.reference?.trim()) return response({error:'Método y comprobante requeridos'},400);
    const result=await db.prepare("UPDATE commissions SET status='PAID',payout_method=?,payout_reference=?,updated_at=? WHERE id=? AND status='APPROVED'").bind(b.method,b.reference,new Date().toISOString(),b.id).run();
    return response({ok:result.meta.changes===1});
  }
  return null;
}
async function recordPaid(db,invoice) {
  if(invoice.status!=='paid'||!invoice.metadata?.boostr_agent_deal||invoice.paid_out_of_band) return;
  const d=await db.prepare('SELECT * FROM deals WHERE id=? AND stripe_invoice_id=?').bind(invoice.metadata.boostr_agent_deal,invoice.id).first();
  if(!d||invoice.currency!=='usd'||invoice.amount_paid<d.amount_cents) return;
  const t=new Date().toISOString();
  await db.batch([
    db.prepare("UPDATE deals SET status='PAID' WHERE id=?").bind(d.id),
    db.prepare("UPDATE leads SET status='CERRADO',sale_amount=?,updated_at=? WHERE id=?").bind(d.amount_cents/100,t,d.lead_id),
    db.prepare("INSERT OR IGNORE INTO commissions(id,agent_id,lead_id,business_name,amount,status,created_at,updated_at) VALUES(?,?,?,?,?,'APPROVED',?,?)").bind('com_'+d.id,d.agent_id,d.id,d.business_name,d.commission_cents/100,t,t)
  ]);
}
