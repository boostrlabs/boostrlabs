const enc=new TextEncoder();
const now=()=>new Date().toISOString();
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const err=(m,s=400)=>json({error:m},s);
const body=async r=>{try{return await r.json()}catch{return {}}};
const bytesToHex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function sha(s){return bytesToHex(await crypto.subtle.digest('SHA-256',enc.encode(s)))}
function cookies(req){return Object.fromEntries((req.headers.get('cookie')||'').split(';').map(x=>x.trim().split('=')).filter(x=>x.length===2))}
function parts(ctx){const x=ctx.params.path;return Array.isArray(x)?x:String(x||'').split('/').filter(Boolean)}
async function ensure(DB){await DB.prepare(`CREATE TABLE IF NOT EXISTS agent_credentials(
 user_id TEXT PRIMARY KEY,
 public_slug TEXT NOT NULL UNIQUE,
 photo_url TEXT,
 status TEXT NOT NULL DEFAULT 'ACTIVE',
 active_from TEXT NOT NULL,
 active_to TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
)`).run();await DB.prepare('CREATE INDEX IF NOT EXISTS idx_agent_credentials_slug ON agent_credentials(public_slug)').run()}
async function session(ctx){const raw=cookies(ctx.request).boostr_agent_session;if(!raw)return null;const h=await sha(raw);const row=await ctx.env.AGENT_DB.prepare('SELECT * FROM sessions WHERE token_hash=? AND expires_at>?').bind(h,now()).first();if(!row)return null;if(row.role==='ADMIN')return{id:'admin',name:'BOOSTR Admin',role:'ADMIN'};return await ctx.env.AGENT_DB.prepare('SELECT id,name,email,role,created_at FROM users WHERE id=?').bind(row.user_id).first()}
function slugFromUser(u){const base=String(u.name||'agent').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,28)||'agent';return `${base}-${String(u.id).replace(/^usr_/,'').slice(0,8)}`}
async function ensureCredential(DB,u){let c=await DB.prepare('SELECT * FROM agent_credentials WHERE user_id=?').bind(u.id).first();if(c)return c;const slug=slugFromUser(u),t=now();await DB.prepare('INSERT INTO agent_credentials(user_id,public_slug,status,active_from,created_at,updated_at) VALUES(?,?,\'ACTIVE\',?,?,?)').bind(u.id,slug,u.created_at||t,t,t).run();return await DB.prepare('SELECT * FROM agent_credentials WHERE user_id=?').bind(u.id).first()}
async function publicRow(DB,slug){return await DB.prepare(`SELECT u.id,u.name,u.email,u.created_at,c.public_slug,c.photo_url,c.status,c.active_from,c.active_to,
 (SELECT country FROM applications a WHERE lower(a.email)=lower(u.email) ORDER BY a.created_at DESC LIMIT 1) country,
 (SELECT city FROM applications a WHERE lower(a.email)=lower(u.email) ORDER BY a.created_at DESC LIMIT 1) city,
 (SELECT instagram FROM applications a WHERE lower(a.email)=lower(u.email) ORDER BY a.created_at DESC LIMIT 1) instagram
 FROM agent_credentials c JOIN users u ON u.id=c.user_id WHERE c.public_slug=?`).bind(slug).first()}
export async function onRequest(ctx){const DB=ctx.env.AGENT_DB;if(!DB)return err('AGENT_DB missing',500);await ensure(DB);const p=parts(ctx),method=ctx.request.method.toUpperCase();try{
 if(method==='GET'&&p[0]==='verify'&&p[1]){const row=await publicRow(DB,p[1]);if(!row)return err('Agente no encontrado',404);return json({name:row.name,photo_url:row.photo_url||'',status:row.status,active_from:row.active_from,active_to:row.active_to||'',country:row.country||'',city:row.city||'',instagram:row.instagram||'',public_slug:row.public_slug,verified:true})}
 const u=await session(ctx);
 if(method==='GET'&&p.join('/')==='me'){if(!u||u.role!=='AGENT')return err('Unauthorized',401);const c=await ensureCredential(DB,u);const row=await publicRow(DB,c.public_slug);return json(row)}
 if(method==='PUT'&&p.join('/')==='me'){if(!u||u.role!=='AGENT')return err('Unauthorized',401);const b=await body(ctx.request),url=String(b.photo_url||'').trim();if(url&&!/^https:\/\//i.test(url))return err('La foto debe usar una URL https');const c=await ensureCredential(DB,u);await DB.prepare('UPDATE agent_credentials SET photo_url=?,updated_at=? WHERE user_id=?').bind(url,now(),u.id).run();return json(await publicRow(DB,c.public_slug))}
 if(method==='GET'&&p.join('/')==='admin/agents'){if(!u||u.role!=='ADMIN')return err('Unauthorized',401);const {results}=await DB.prepare(`SELECT u.id,u.name,u.email,u.created_at,c.public_slug,c.photo_url,c.status,c.active_from,c.active_to FROM users u LEFT JOIN agent_credentials c ON c.user_id=u.id WHERE u.role='AGENT' ORDER BY u.created_at DESC`).all();for(const a of results)if(!a.public_slug){const full=await DB.prepare('SELECT * FROM users WHERE id=?').bind(a.id).first();await ensureCredential(DB,full)}const r=await DB.prepare(`SELECT u.id,u.name,u.email,u.created_at,c.public_slug,c.photo_url,c.status,c.active_from,c.active_to FROM users u JOIN agent_credentials c ON c.user_id=u.id WHERE u.role='AGENT' ORDER BY u.created_at DESC`).all();return json(r.results)}
 if(method==='POST'&&p[0]==='admin'&&p[1]==='agents'&&p[2]&&p[3]==='status'){if(!u||u.role!=='ADMIN')return err('Unauthorized',401);const b=await body(ctx.request),status=b.status==='INACTIVE'?'INACTIVE':'ACTIVE';const target=await DB.prepare('SELECT * FROM users WHERE id=? AND role=\'AGENT\'').bind(p[2]).first();if(!target)return err('Agente no encontrado',404);await ensureCredential(DB,target);await DB.prepare('UPDATE agent_credentials SET status=?,active_to=?,updated_at=? WHERE user_id=?').bind(status,status==='INACTIVE'?now():null,now(),target.id).run();return json({ok:true})}
 return err('Not found',404)
}catch(e){console.error(e);return err('No se pudo completar la operación',500)}}
