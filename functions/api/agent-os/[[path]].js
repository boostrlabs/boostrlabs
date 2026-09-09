import { paymentRoutes } from './_payments.js';

const enc = new TextEncoder();
const now = () => new Date().toISOString();
const id = p => `${p}_${crypto.randomUUID()}`;
const json = (data,status=200,headers={}) => new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}});
const err = (m,s=400) => json({error:m},s);
const body = async r => { try { return await r.json() } catch { return {} } };
const cookie = (name,val,max=604800) => `${name}=${val}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${max}`;
const bytesToHex = b => [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
const hexToBytes = h => new Uint8Array(h.match(/.{1,2}/g).map(x=>parseInt(x,16)));

async function sha(s){ return bytesToHex(await crypto.subtle.digest("SHA-256",enc.encode(s))) }
async function hashSecret(secret,saltHex=null,iterations=100000){
  const salt=saltHex?hexToBytes(saltHex):crypto.getRandomValues(new Uint8Array(16));
  const key=await crypto.subtle.importKey("raw",enc.encode(secret),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt,iterations},key,256);
  return {hash:bytesToHex(bits),salt:bytesToHex(salt)};
}
async function verify(secret,hash,salt,iterations=100000){ const x=await hashSecret(secret,salt,iterations); return x.hash===hash }
function cookies(req){return Object.fromEntries((req.headers.get("cookie")||"").split(";").map(x=>x.trim().split("=")).filter(x=>x.length===2))}
function pathParts(ctx){const x=ctx.params.path;return Array.isArray(x)?x:String(x||"").split("/").filter(Boolean)}
function weekKey(){
  const d=new Date(), day=d.getUTCDay()||7; d.setUTCDate(d.getUTCDate()-day+1); d.setUTCHours(0,0,0,0); return d.toISOString().slice(0,10)
}
const catalog=[
  {id:"website-basic",name:"Website Basic",price:200,commission:50,description:"Presencia digital simple y lista para vender."},
  {id:"website-pro",name:"Website Pro",price:500,commission:100,description:"Más contenido, estructura y personalización."},
  {id:"website-advanced",name:"Website Advanced / System Build",price:800,commission:160,description:"Procesos, formularios y mayor personalización."},
  {id:"custom-app",name:"Custom App / Business OS",price:null,commission_rate:20,description:"Apps y sistemas hechos a medida."},
  {id:"crm",name:"CRM / Database",price:null,commission_rate:20,description:"Clientes, leads, seguimiento, pipelines y reportes."},
  {id:"parking",name:"Parking System",price:null,commission_rate:20,description:"Cobros, suscripciones y operación."},
  {id:"automotive",name:"Automotive CRM",price:null,commission_rate:20,description:"Financiamiento, mensajes, facturas e inventario."},
  {id:"digital-team",name:"Virtual Assistants / Digital Team",price:null,description:"Soporte, ventas y operación con talento LATAM."},
  {id:"ai-chatbot",name:"AI Chatbots + Human Supervision",price:null,description:"IA supervisada por humanos."},
  {id:"automations",name:"Custom Automations",price:null,commission_rate:20,description:"Seguimientos, formularios, mensajes y procesos."}
];
const scripts=[
  {id:"inbound",title:"Cliente que escribe primero",text:"hola 👋 gracias por escribir a BOOSTR Labs\ncuéntame un poco de tu negocio y qué te gustaría mejorar"},
  {id:"outreach",title:"Outreach",text:"hola! estuve viendo su negocio y creo que hay varias cosas que BOOSTR podría ayudarles a mejorar online\ntrabajamos con páginas web, sistemas, automatización y herramientas para negocios\nsi quieres te puedo enseñar algunas opciones"},
  {id:"interest",title:"Cuando hay interés",text:"perfecto, lo mejor es hacer una llamada corta con nuestro equipo para revisar exactamente lo que necesitas y recomendarte la mejor opción\nqué día y hora te funciona?"},
  {id:"technical",title:"Pregunta técnica que no sabes",text:"esa parte la confirmo con el equipo de BOOSTR para darte información correcta"}
];
const flyers=[
  {id:"website",title:"Website Build",file:"/assets/flyers/website-build.webp",caption:"haz que tu negocio se vea más serio, genere más confianza y convierta visitas en clientes 💻📈"},
  {id:"app",title:"App / Business OS",file:"/assets/flyers/app-business-os.webp",caption:"tu negocio no tiene que funcionar con 10 apps distintas 📲"},
  {id:"team",title:"Digital Team / AI",file:"/assets/flyers/digital-team-ai.webp",caption:"haz crecer tu equipo con asistentes virtuales reales, agentes y automatización con IA 🤖"},
  {id:"parking",title:"Parking System",file:"/assets/flyers/parking-system.webp",caption:"controla tu parking desde un solo sistema 🚗📲"},
  {id:"auto",title:"Automotive CRM",file:"/assets/flyers/automotive-crm.webp",caption:"más leads, más seguimiento y más cierres 🚗📈"},
  {id:"recruit",title:"Trabajo remoto LATAM",file:"/assets/flyers/agent-recruiting.webp",caption:"buscamos agentes en LATAM para trabajar remoto con BOOSTR Labs 🌎"}
];

async function session(ctx){
  const raw=cookies(ctx.request).boostr_agent_session;if(!raw)return null;
  const h=await sha(raw);const row=await ctx.env.AGENT_DB.prepare("SELECT * FROM sessions WHERE token_hash=? AND expires_at>?").bind(h,now()).first();if(!row)return null;
  if(row.role==="ADMIN") return {id:"admin",name:"BOOSTR Admin",email:ctx.env.ADMIN_EMAIL,role:"ADMIN"};
  return await ctx.env.AGENT_DB.prepare("SELECT id,name,email,role FROM users WHERE id=?").bind(row.user_id).first();
}
async function requireUser(ctx,role){
  const u=await session(ctx);if(!u||u.role!==role)return null;return u
}
async function newSession(ctx,userId,role){
  const raw=bytesToHex(crypto.getRandomValues(new Uint8Array(32))), h=await sha(raw);
  const exp=new Date(Date.now()+7*864e5).toISOString();
  await ctx.env.AGENT_DB.prepare("INSERT INTO sessions(token_hash,user_id,role,expires_at,created_at) VALUES(?,?,?,?,?)").bind(h,userId,role,exp,now()).run();
  return cookie("boostr_agent_session",raw)
}
async function settingMap(DB){
  const {results}=await DB.prepare("SELECT key,value FROM settings").all();return Object.fromEntries(results.map(x=>[x.key,x.value]))
}

export async function onRequest(ctx){
  const p=pathParts(ctx), method=ctx.request.method.toUpperCase(), DB=ctx.env.AGENT_DB;
  try{
    if(!DB)return err("Cloudflare D1 binding AGENT_DB is not configured",500);

    const origin=ctx.request.headers.get('origin');
    if(!['GET','HEAD'].includes(method)&&origin&&origin!==new URL(ctx.request.url).origin)return err('Origin not allowed',403);
    if(Number(ctx.request.headers.get('content-length')||0)>32768)return err('Request too large',413);
    if(p[0]==='auth'&&method==='POST'&&p[1]==='login'){
      const k=await sha((ctx.request.headers.get('cf-connecting-ip')||'local')+':'+Math.floor(Date.now()/900000));
      const a=await DB.prepare('INSERT INTO auth_attempts(key,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(k,Date.now()+900000).first();
      if(a.attempts>10)return err('Demasiados intentos. Espera 15 minutos.',429);
    }
    if(p[0]==='stripe'||['sales','stripe-connect','deals','reconcile','payout'].includes(p[1])){
      const result=await paymentRoutes(ctx,await session(ctx),p.join('/'));if(result)return result;
    }
    // Public
    if(method==="GET"&&p.join("/")==="public/catalog")return json(catalog);
    if(method==="GET"&&p.join("/")==="public/scripts")return json(scripts);
    if(method==="GET"&&p.join("/")==="public/flyers")return json(flyers);
    if(method==="GET"&&p.join("/")==="public/settings")return json(await settingMap(DB));
    if(method==="POST"&&p.join("/")==="public/contact"){
      const b=await body(ctx.request);if(!b.name||!b.business_name||!b.message)return err("Completa nombre, negocio y mensaje");
      await DB.prepare("INSERT INTO contact_requests(id,name,business_name,email,whatsapp,message,created_at) VALUES(?,?,?,?,?,?,?)").bind(id("contact"),b.name,b.business_name,b.email||"",b.whatsapp||"",b.message,now()).run();return json({ok:true},201)
    }
    if(method==="POST"&&p.join("/")==="public/applications"){
      const b=await body(ctx.request), req=["name","country","city","whatsapp","email"];if(req.some(k=>!String(b[k]||"").trim()))return err("Completa los campos requeridos");
      await DB.prepare(`INSERT INTO applications(id,name,country,city,whatsapp,instagram,tiktok,email,english_level,sales_experience,service_experience,availability,devices,status,created_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,'NEW',?)`).bind(id("app"),b.name,b.country,b.city,b.whatsapp,b.instagram||"",b.tiktok||"",b.email.toLowerCase(),b.english_level||"",b.sales_experience||"",b.service_experience||"",b.availability||"",b.devices||"",now()).run();return json({ok:true},201)
    }

    // Auth
    if(method==="POST"&&p.join("/")==="auth/login"){
      const b=await body(ctx.request), email=String(b.email||"").toLowerCase().trim(), secret=String(b.secret||""), mode=b.mode==="pin"?"pin":"password";
      if(ctx.env.ADMIN_EMAIL&&ctx.env.ADMIN_PASSWORD&&email===String(ctx.env.ADMIN_EMAIL||"").toLowerCase()&&mode==="password"&&secret===ctx.env.ADMIN_PASSWORD){
        return json({ok:true,role:"ADMIN"},200,{"set-cookie":await newSession(ctx,"admin","ADMIN")})
      }
      const u=await DB.prepare("SELECT * FROM users WHERE email=?").bind(email).first();if(!u)return err("Credenciales incorrectas",401);
      const ok=mode==="pin" ? (u.pin_hash&&/^\d{6}$/.test(secret)&&await verify(secret,u.pin_hash,u.pin_salt,60000)) : await verify(secret,u.password_hash,u.password_salt);
      if(!ok)return err("Credenciales incorrectas",401);
      return json({ok:true,role:u.role},200,{"set-cookie":await newSession(ctx,u.id,u.role)})
    }
    if(method==="POST"&&p.join("/")==="auth/register"){
      const b=await body(ctx.request);if(!b.invite||!b.email||!b.name||!b.password)return err("Faltan datos");
      if(String(b.password).length<8)return err("La contraseña debe tener al menos 8 caracteres");
      if(b.pin&&!/^\d{6}$/.test(b.pin))return err("El PIN debe tener 6 dígitos");
      const th=await sha(b.invite), inv=await DB.prepare("SELECT * FROM invites WHERE token_hash=? AND used_at IS NULL AND expires_at>?").bind(th,now()).first();
      if(!inv)return err("Invitación inválida o vencida",403);if(inv.email.toLowerCase()!==String(b.email).toLowerCase())return err("Usa el email aprobado",403);
      const ph=await hashSecret(b.password);let pin={hash:null,salt:null};if(b.pin)pin=await hashSecret(b.pin,null,60000);
      const userId=id("usr");
      await DB.prepare("INSERT INTO users(id,name,email,role,password_hash,password_salt,pin_hash,pin_salt,created_at) VALUES(?,?,?,'AGENT',?,?,?,?,?)")
        .bind(userId,b.name,String(b.email).toLowerCase(),ph.hash,ph.salt,pin.hash,pin.salt,now()).run();
      await DB.prepare("UPDATE invites SET used_at=? WHERE token_hash=?").bind(now(),th).run();
      return json({ok:true},201,{"set-cookie":await newSession(ctx,userId,"AGENT")})
    }
    if(method==="GET"&&p.join("/")==="auth/me"){const u=await session(ctx);return json({user:u})}
    if(method==="POST"&&p.join("/")==="auth/logout"){
      const raw=cookies(ctx.request).boostr_agent_session;if(raw)await DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha(raw)).run();
      return json({ok:true},200,{"set-cookie":cookie("boostr_agent_session","",0)})
    }

    // Agent
    const agent=await requireUser(ctx,"AGENT");
    if(p[0]==="agent"){
      if(!agent)return err("Unauthorized",401);
      if(method==="POST"&&p.join("/")==="agent/pin"){
        const b=await body(ctx.request);if(!/^\d{6}$/.test(b.pin||""))return err("El PIN debe tener 6 dígitos");
        const x=await hashSecret(b.pin,null,60000);await DB.prepare("UPDATE users SET pin_hash=?,pin_salt=? WHERE id=?").bind(x.hash,x.salt,agent.id).run();return json({ok:true})
      }
      if(method==="GET"&&p.join("/")==="agent/quota"){
        const wk=weekKey(),row=await DB.prepare("SELECT claims FROM weekly_claims WHERE agent_id=? AND week_key=?").bind(agent.id,wk).first(),used=row?.claims||0;return json({limit:10,used,remaining:Math.max(0,10-used),week:wk})
      }
      if(method==="GET"&&p.join("/")==="agent/pool"){
        const {results}=await DB.prepare(`SELECT id,business_name,temperature,industry,suggested_product,city,country,opportunity_summary FROM lead_pool WHERE status='AVAILABLE' ORDER BY created_at DESC LIMIT 100`).all();return json(results)
      }
      if(method==="POST"&&p[1]==="pool"&&p[3]==="claim"){
        const leadId=p[2],wk=weekKey();
        const t=now(),lid=id("lead");
        const results=await DB.batch([
          DB.prepare("INSERT OR IGNORE INTO weekly_claims(agent_id,week_key,claims) VALUES(?,?,0)").bind(agent.id,wk),
          DB.prepare("UPDATE lead_pool SET status='CLAIMED',claimed_by=?,claimed_at=? WHERE id=? AND status='AVAILABLE' AND (SELECT claims FROM weekly_claims WHERE agent_id=? AND week_key=?)<10").bind(agent.id,t,leadId,agent.id,wk),
          DB.prepare(`INSERT INTO leads(id,agent_id,source,pool_lead_id,business_name,contact_name,product_id,temperature,phone,whatsapp,instagram,facebook,email,website,city,country,status,opportunity_summary,recommended_opener,closing_notes,created_at,updated_at)
            SELECT ?,?,'BOOSTR_POOL',id,business_name,contact_name,suggested_product,temperature,phone,whatsapp,instagram,facebook,email,website,city,country,'NUEVO',opportunity_summary,recommended_opener,closing_notes,?,? FROM lead_pool WHERE id=? AND claimed_by=? AND claimed_at=? AND NOT EXISTS(SELECT 1 FROM leads WHERE pool_lead_id=?)`).bind(lid,agent.id,t,t,leadId,agent.id,t,leadId),
          DB.prepare("UPDATE weekly_claims SET claims=(SELECT COUNT(*) FROM leads WHERE agent_id=? AND source='BOOSTR_POOL' AND created_at>=?) WHERE agent_id=? AND week_key=?").bind(agent.id,wk,agent.id,wk)
        ]);
        if(!results[1].meta.changes){
          const quota=await DB.prepare("SELECT claims FROM weekly_claims WHERE agent_id=? AND week_key=?").bind(agent.id,wk).first();
          return quota.claims>=10?err("Ya tomaste 10 leads BOOSTR esta semana",429):err("Este lead ya fue tomado",409);
        }
        return json({ok:true,lead_id:lid},201)
      }
      if(method==="GET"&&p.join("/")==="agent/leads"){
        const {results}=await DB.prepare("SELECT * FROM leads WHERE agent_id=? ORDER BY created_at DESC").bind(agent.id).all();return json(results)
      }
      if(method==="POST"&&p.join("/")==="agent/leads"){
        const b=await body(ctx.request);if(!b.business_name||!b.contact_name)return err("Negocio y contacto son requeridos");
        const t=now();await DB.prepare(`INSERT INTO leads(id,agent_id,source,business_name,contact_name,product_id,temperature,phone,instagram,country,status,notes,created_at,updated_at)
          VALUES(?,?,'AGENT',?,?,?,?,?, ?,?,'NUEVO',?,?,?)`).bind(id("lead"),agent.id,b.business_name,b.contact_name,b.product_id||"",b.temperature||"FRIO",b.phone||"",b.instagram||"",b.country||"",b.notes||"",t,t).run();return json({ok:true},201)
      }
      if(method==="GET"&&p.join("/")==="agent/commissions"){
        const {results}=await DB.prepare("SELECT * FROM commissions WHERE agent_id=? ORDER BY created_at DESC").bind(agent.id).all();return json(results)
      }
      if(method==="GET"&&p.join("/")==="agent/dashboard"){
        const [lr,cr,qr]=await Promise.all([
          DB.prepare("SELECT * FROM leads WHERE agent_id=? ORDER BY created_at DESC").bind(agent.id).all(),
          DB.prepare("SELECT * FROM commissions WHERE agent_id=?").bind(agent.id).all(),
          DB.prepare("SELECT claims FROM weekly_claims WHERE agent_id=? AND week_key=?").bind(agent.id,weekKey()).first()
        ]);
        const cs=cr.results||[];return json({user:agent,leads:lr.results||[],quota:{limit:10,used:qr?.claims||0,remaining:10-(qr?.claims||0)},pendingCommission:cs.filter(x=>["PENDING","APPROVED"].includes(x.status)).reduce((a,x)=>a+x.amount,0),paidCommission:cs.filter(x=>x.status==="PAID").reduce((a,x)=>a+x.amount,0)})
      }
    }

    // Admin
    const admin=await requireUser(ctx,"ADMIN");
    if(p[0]==="admin"){
      if(!admin)return err("Unauthorized",401);
      if(method==="GET"&&p.join("/")==="admin/applications"){
        const {results}=await DB.prepare("SELECT * FROM applications ORDER BY created_at DESC").all();return json(results)
      }
      if(method==="POST"&&p[1]==="applications"&&p[3]==="approve"){
        const appId=p[2],a=await DB.prepare("SELECT * FROM applications WHERE id=?").bind(appId).first();if(!a)return err("Not found",404);
        const raw=bytesToHex(crypto.getRandomValues(new Uint8Array(24))),th=await sha(raw),exp=new Date(Date.now()+14*864e5).toISOString(),invitePath=`/#/agent/create-account?invite=${raw}`;
        await DB.batch([
          DB.prepare("INSERT INTO invites(token_hash,application_id,email,expires_at,created_at) VALUES(?,?,?,?,?)").bind(th,a.id,a.email,exp,now()),
          DB.prepare("UPDATE applications SET status='APPROVED',invite_path=? WHERE id=?").bind(invitePath,a.id)
        ]);return json({ok:true,invite_path:invitePath})
      }
      if(method==="GET"&&p.join("/")==="admin/pool"){const {results}=await DB.prepare("SELECT * FROM lead_pool ORDER BY created_at DESC").all();return json(results)}
      if(method==="POST"&&p.join("/")==="admin/pool"){
        const b=await body(ctx.request);if(!b.business_name||!["FRIO","TIBIO","CALIENTE"].includes(b.temperature))return err("Negocio y temperatura requeridos");
        await DB.prepare(`INSERT INTO lead_pool(id,business_name,temperature,industry,suggested_product,contact_name,contact_role,phone,whatsapp,instagram,facebook,email,website,city,country,language,preferred_channel,opportunity_summary,recommended_opener,closing_notes,status,created_at)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'AVAILABLE',?)`)
          .bind(id("pool"),b.business_name,b.temperature,b.industry||"",b.suggested_product||"",b.contact_name||"",b.contact_role||"",b.phone||"",b.whatsapp||"",b.instagram||"",b.facebook||"",b.email||"",b.website||"",b.city||"",b.country||"",b.language||"",b.preferred_channel||"",b.opportunity_summary||"",b.recommended_opener||"",b.closing_notes||"",now()).run();return json({ok:true},201)
      }
      if(method==="GET"&&p.join("/")==="admin/contacts"){const {results}=await DB.prepare("SELECT * FROM contact_requests ORDER BY created_at DESC").all();return json(results)}
      if(method==="GET"&&p.join("/")==="admin/settings")return json(await settingMap(DB));
      if(method==="PUT"&&p.join("/")==="admin/settings"){
        const b=await body(ctx.request);for(const k of ["instagram","tiktok","x","facebook","whatsapp","email"]){await DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(k,String(b[k]||"")).run()}return json({ok:true})
      }
      if(method==="POST"&&p.join("/")==="admin/commissions"){
        const b=await body(ctx.request);if(!b.agent_id||!Number(b.amount))return err("agent_id y amount requeridos");
        await DB.prepare("INSERT INTO commissions(id,agent_id,lead_id,business_name,amount,status,created_at,updated_at) VALUES(?,?,?,?,?,'PENDING',?,?)").bind(id("com"),b.agent_id,b.lead_id||"",b.business_name||"",Number(b.amount),now(),now()).run();return json({ok:true},201)
      }
    }
    return err("Not found",404)
  }catch(e){console.error('Agent OS request failed',e?.name);return err('No se pudo completar la operación. Revisa los datos o contacta a BOOSTR.',500)}
}


