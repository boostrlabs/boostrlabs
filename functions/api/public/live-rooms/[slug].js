import { clean, json, jsonError, requireDb } from "../../../_lib/api.js";

async function ensureSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS live_rooms (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, created_by_user_id TEXT, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, status TEXT DEFAULT 'draft', primary_platform TEXT DEFAULT 'youtube', youtube_url TEXT, twitch_url TEXT, kick_url TEXT, chat_mode TEXT DEFAULT 'boostr', auction_link_id TEXT, description TEXT, created_at TEXT, updated_at TEXT)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS live_chat_messages (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, user_id TEXT, public_name TEXT NOT NULL, body TEXT NOT NULL, role_label TEXT, status TEXT DEFAULT 'visible', created_at TEXT)`).run();
}

export async function onRequestOptions(){return json({ok:true})}
export async function onRequestGet({env,params}){
  const db=requireDb(env); if(!db.ok)return db.response; await ensureSchema(env);
  const slug=clean(params.slug,120);
  const room=await env.DB.prepare(`SELECT live_rooms.*, workspaces.name AS workspace_name FROM live_rooms LEFT JOIN workspaces ON workspaces.id=live_rooms.workspace_id WHERE live_rooms.slug=? AND live_rooms.status='active' LIMIT 1`).bind(slug).first();
  if(!room?.id)return jsonError('live_room_not_found','La sala no existe o no está activa.',404);
  const messages=await env.DB.prepare(`SELECT id,public_name,body,role_label,created_at FROM live_chat_messages WHERE room_id=? AND status='visible' ORDER BY created_at DESC LIMIT 60`).bind(room.id).all();
  return json({ok:true,room,messages:(messages.results||[]).reverse()});
}
