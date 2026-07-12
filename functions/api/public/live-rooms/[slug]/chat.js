import { clean, json, jsonError, now, requireDb, requireSession } from "../../../../_lib/api.js";

export async function onRequestOptions(){return json({ok:true})}

export async function onRequestGet({env,params}){
  const db=requireDb(env); if(!db.ok)return db.response;
  const room=await env.DB.prepare("SELECT id FROM live_rooms WHERE slug=? AND status='active' LIMIT 1").bind(clean(params.slug,120)).first();
  if(!room?.id)return jsonError('live_room_not_found','Sala no disponible.',404);
  const rows=await env.DB.prepare("SELECT id,public_name,body,role_label,created_at FROM live_chat_messages WHERE room_id=? AND status='visible' ORDER BY created_at DESC LIMIT 60").bind(room.id).all();
  return json({ok:true,messages:(rows.results||[]).reverse()});
}

export async function onRequestPost({request,env,params}){
  const db=requireDb(env); if(!db.ok)return db.response;
  const room=await env.DB.prepare("SELECT id FROM live_rooms WHERE slug=? AND status='active' LIMIT 1").bind(clean(params.slug,120)).first();
  if(!room?.id)return jsonError('live_room_not_found','Sala no disponible.',404);
  const payload=await request.json().catch(()=>({}));
  const body=clean(payload.body,280); if(!body)return jsonError('message_required','Escribe un mensaje.',400);
  let auth=null; try{const result=await requireSession(request,env); if(result.ok)auth=result}catch{}
  const publicName=clean(payload.public_name || auth?.user?.display_name || auth?.user?.email?.split('@')[0] || 'Invitado',60);
  const roleLabel=clean(payload.role_label || (auth?.user?'Verificado':'Invitado'),30);
  const id=crypto.randomUUID(); const ts=now();
  await env.DB.prepare("INSERT INTO live_chat_messages (id,room_id,user_id,public_name,body,role_label,status,created_at) VALUES (?,?,?,?,?,?,'visible',?)").bind(id,room.id,auth?.user?.id||null,publicName,body,roleLabel,ts).run();
  return json({ok:true,message:{id,public_name:publicName,body,role_label:roleLabel,created_at:ts}},201);
}
