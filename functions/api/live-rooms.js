import { clean, json, jsonError, now, readJson, requireDb, requireSession, requireWorkspaceAccess } from "../_lib/api.js";

async function ensureSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS live_rooms (
    id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, created_by_user_id TEXT,
    title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, status TEXT DEFAULT 'draft',
    primary_platform TEXT DEFAULT 'youtube', youtube_url TEXT, twitch_url TEXT, kick_url TEXT,
    chat_mode TEXT DEFAULT 'boostr', auction_link_id TEXT, description TEXT,
    created_at TEXT, updated_at TEXT
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS live_chat_messages (
    id TEXT PRIMARY KEY, room_id TEXT NOT NULL, user_id TEXT, public_name TEXT NOT NULL,
    body TEXT NOT NULL, role_label TEXT, status TEXT DEFAULT 'visible', created_at TEXT
  )`).run();
}

function slugify(v){return clean(v,120).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)}

export async function onRequestOptions(){return json({ok:true})}

export async function onRequestGet({request,env}){
  const db=requireDb(env); if(!db.ok)return db.response;
  const auth=await requireSession(request,env); if(!auth.ok)return auth.response;
  await ensureSchema(env);
  const url=new URL(request.url); const workspaceId=clean(url.searchParams.get('workspace_id'),120)||auth.active_workspace_id;
  const access=requireWorkspaceAccess(auth,workspaceId); if(!access.ok)return access.response;
  const rows=await env.DB.prepare("SELECT * FROM live_rooms WHERE workspace_id=? ORDER BY updated_at DESC").bind(workspaceId).all();
  return json({ok:true,rooms:rows.results||[]});
}

export async function onRequestPost({request,env}){
  const db=requireDb(env); if(!db.ok)return db.response;
  const auth=await requireSession(request,env); if(!auth.ok)return auth.response;
  await ensureSchema(env);
  const parsed=await readJson(request); if(!parsed.ok)return parsed.response; const p=parsed.payload||{};
  const workspaceId=clean(p.workspace_id,120)||auth.active_workspace_id; const access=requireWorkspaceAccess(auth,workspaceId); if(!access.ok)return access.response;
  const title=clean(p.title,180); if(!title)return jsonError('title_required','Escribe un nombre para la sala.',400);
  const id=crypto.randomUUID(); const slug=slugify(p.slug||title)+'-'+id.slice(0,6); const ts=now();
  await env.DB.prepare(`INSERT INTO live_rooms (id,workspace_id,created_by_user_id,title,slug,status,primary_platform,youtube_url,twitch_url,kick_url,chat_mode,auction_link_id,description,created_at,updated_at) VALUES (?,?,?,?,?,'active',?,?,?,?,?,?,?,?,?)`).bind(
    id,workspaceId,auth.user?.id||null,title,slug,clean(p.primary_platform||'youtube',20),clean(p.youtube_url,500)||null,clean(p.twitch_url,500)||null,clean(p.kick_url,500)||null,clean(p.chat_mode||'boostr',30),clean(p.auction_link_id,120)||null,clean(p.description,1200)||null,ts,ts
  ).run();
  return json({ok:true,room:{id,slug,public_url:`/live/${slug}`}},201);
}
