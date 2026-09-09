const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const err=(m,s=400)=>json({error:m},s);
const now=()=>new Date().toISOString();
const id=p=>`${p}_${crypto.randomUUID()}`;
export async function onRequestPost(ctx){
  const DB=ctx.env.AGENT_DB;if(!DB)return err('AGENT_DB missing',500);
  const origin=ctx.request.headers.get('origin');if(origin&&origin!==new URL(ctx.request.url).origin)return err('Origin not allowed',403);
  let b={};try{b=await ctx.request.json()}catch{}
  const name=String(b.name||'').trim(),business=String(b.business_name||'').trim(),message=String(b.message||'').trim();
  if(!name||!business||!message)return err('Completa nombre, negocio y qué quieres mejorar');
  const email=String(b.email||'').trim(),whatsapp=String(b.whatsapp||'').trim(),website=String(b.website||'').trim(),instagram=String(b.instagram||'').trim(),channel=String(b.preferred_channel||'').trim()||'WhatsApp';
  const t=now(),contactId=id('contact'),poolId=id('pool');
  await DB.batch([
    DB.prepare('INSERT INTO contact_requests(id,name,business_name,email,whatsapp,message,created_at) VALUES(?,?,?,?,?,?,?)').bind(contactId,name,business,email,whatsapp,message,t),
    DB.prepare(`INSERT INTO lead_pool(id,business_name,temperature,industry,suggested_product,contact_name,contact_role,phone,whatsapp,instagram,facebook,email,website,city,country,language,preferred_channel,opportunity_summary,recommended_opener,closing_notes,status,created_at)
      VALUES(?,?,'TIBIO','','',?,'','',?,?,'',?,?,'','','',?,?,'','Lead capturado desde campaña / landing BOOSTR.','AVAILABLE',?)`)
      .bind(poolId,business,name,whatsapp,instagram,email,website,channel,message,t)
  ]);
  return json({ok:true,lead_pool_id:poolId},201);
}
