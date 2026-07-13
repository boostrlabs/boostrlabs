import { clean, json, jsonError, now, requireDb } from "../../_lib/api.js";

const ROOM_ID = "smoke-jankodiorr-westdetro";

async function ensureSchema(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS live_smoke_rooms (
    id TEXT PRIMARY KEY, creator_slug TEXT NOT NULL, title TEXT NOT NULL,
    starting_bid_cents INTEGER NOT NULL, min_increment_cents INTEGER NOT NULL,
    current_bid_cents INTEGER NOT NULL, bid_count INTEGER NOT NULL DEFAULT 0,
    ends_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', updated_at TEXT NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS live_smoke_bids (
    id TEXT PRIMARY KEY, room_id TEXT NOT NULL, public_name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL, created_at TEXT NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS live_smoke_messages (
    id TEXT PRIMARY KEY, room_id TEXT NOT NULL, public_name TEXT NOT NULL,
    role_label TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL
  )`).run();

  const existing = await env.DB.prepare("SELECT id FROM live_smoke_rooms WHERE id=?").bind(ROOM_ID).first();
  if (!existing?.id) {
    const endsAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const ts = now();
    await env.DB.prepare(`INSERT INTO live_smoke_rooms
      (id,creator_slug,title,starting_bid_cents,min_increment_cents,current_bid_cents,bid_count,ends_at,status,updated_at)
      VALUES (?,?,?,?,?,?,0,?,'active',?)`)
      .bind(ROOM_ID,"jankodiorr","WESTDETRO Beat Auction",65000,2500,65000,endsAt,ts).run();
    const seed = [
      ["@82NGEL","Artista","el beat está demasiado duro"],
      ["Postor verificado #18","Postor","¿incluye stems y licencia exclusiva?"],
      ["WESTDETRO","Host","Sí. WAV, stems y contrato BOOSTR incluidos."]
    ];
    for (const [name,role,body] of seed) {
      await env.DB.prepare("INSERT INTO live_smoke_messages (id,room_id,public_name,role_label,body,created_at) VALUES (?,?,?,?,?,?)")
        .bind(crypto.randomUUID(),ROOM_ID,name,role,body,ts).run();
    }
  }
}

async function readState(env) {
  const room = await env.DB.prepare("SELECT * FROM live_smoke_rooms WHERE id=?").bind(ROOM_ID).first();
  const bids = await env.DB.prepare("SELECT id,public_name,amount_cents,created_at FROM live_smoke_bids WHERE room_id=? ORDER BY created_at DESC LIMIT 20").bind(ROOM_ID).all();
  const messages = await env.DB.prepare("SELECT id,public_name,role_label,body,created_at FROM live_smoke_messages WHERE room_id=? ORDER BY created_at DESC LIMIT 50").bind(ROOM_ID).all();
  return { room, bids: bids.results || [], messages: (messages.results || []).reverse() };
}

export async function onRequestOptions(){ return json({ok:true}); }

export async function onRequestGet({env}) {
  const db = requireDb(env); if (!db.ok) return db.response;
  await ensureSchema(env);
  return json({ok:true, smoke_test:true, ...(await readState(env))});
}

export async function onRequestPost({request,env}) {
  const db = requireDb(env); if (!db.ok) return db.response;
  await ensureSchema(env);
  const payload = await request.json().catch(()=>({}));
  const action = clean(payload.action,30);
  const publicName = clean(payload.public_name || "Invitado",60);
  const ts = now();

  if (action === "chat") {
    const body = clean(payload.body,280);
    if (!body) return jsonError("message_required","Escribe un mensaje.",400);
    const role = clean(payload.role_label || "Invitado",30);
    await env.DB.prepare("INSERT INTO live_smoke_messages (id,room_id,public_name,role_label,body,created_at) VALUES (?,?,?,?,?,?)")
      .bind(crypto.randomUUID(),ROOM_ID,publicName,role,body,ts).run();
    return json({ok:true, ...(await readState(env))},201);
  }

  if (action === "bid") {
    const room = await env.DB.prepare("SELECT * FROM live_smoke_rooms WHERE id=?").bind(ROOM_ID).first();
    if (!room || room.status !== "active") return jsonError("auction_closed","La subasta no está activa.",409);
    if (new Date(room.ends_at).getTime() <= Date.now()) return jsonError("auction_ended","La subasta terminó.",409);
    const requested = Number(payload.amount_cents);
    const minimum = Number(room.current_bid_cents) + Number(room.min_increment_cents);
    if (!Number.isInteger(requested) || requested < minimum) return jsonError("bid_too_low",`La oferta mínima es $${(minimum/100).toFixed(2)}.`,400,{minimum_amount_cents:minimum});
    await env.DB.prepare("INSERT INTO live_smoke_bids (id,room_id,public_name,amount_cents,created_at) VALUES (?,?,?,?,?)")
      .bind(crypto.randomUUID(),ROOM_ID,publicName,requested,ts).run();
    await env.DB.prepare("UPDATE live_smoke_rooms SET current_bid_cents=?,bid_count=bid_count+1,updated_at=? WHERE id=?")
      .bind(requested,ts,ROOM_ID).run();
    return json({ok:true, ...(await readState(env))},201);
  }

  return jsonError("invalid_action","Acción no válida.",400);
}
