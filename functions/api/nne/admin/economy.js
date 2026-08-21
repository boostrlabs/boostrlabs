import { clean, jsonError, jsonOk, now, requireNneAdmin, writeNneAudit } from "../../../_lib/nne-api.js";
import { ensureNneMarketplace } from "../../../_lib/nne-marketplace.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneMarketplace(env);
  const [beats,services,jobs] = await Promise.all([
    env.DB.prepare(`SELECT b.*,u.username FROM nne_beats b JOIN nne_users u ON u.id=b.owner_user_id ORDER BY CASE b.status WHEN 'submitted' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END,b.created_at DESC LIMIT 100`).all(),
    env.DB.prepare(`SELECT s.*,u.username FROM nne_service_listings s JOIN nne_users u ON u.id=s.seller_user_id ORDER BY s.created_at DESC LIMIT 100`).all(),
    env.DB.prepare(`SELECT j.*,u.username FROM nne_jobs j JOIN nne_users u ON u.id=j.creator_user_id ORDER BY j.created_at DESC LIMIT 100`).all()
  ]);
  return jsonOk({ beats:beats.results||[], services:services.results||[], jobs:jobs.results||[] });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneMarketplace(env);
  const body = await request.json().catch(()=>({}));
  const beatId = clean(body.beat_id,100);
  const action = clean(body.action,40);
  if (!beatId || !['certify_publish','publish','reject','reviewing'].includes(action)) return jsonError('nne_economy_admin_invalid','Acción inválida.',400);
  const timestamp = now();
  if (action === 'certify_publish') await env.DB.prepare(`UPDATE nne_beats SET status='published',westdetro_certified=1,review_note=?,updated_at=? WHERE id=?`).bind(clean(body.note,500)||null,timestamp,beatId).run();
  if (action === 'publish') await env.DB.prepare(`UPDATE nne_beats SET status='published',westdetro_certified=0,review_note=?,updated_at=? WHERE id=?`).bind(clean(body.note,500)||null,timestamp,beatId).run();
  if (action === 'reject') await env.DB.prepare(`UPDATE nne_beats SET status='rejected',westdetro_certified=0,review_note=?,updated_at=? WHERE id=?`).bind(clean(body.note,500)||'No seleccionado',timestamp,beatId).run();
  if (action === 'reviewing') await env.DB.prepare(`UPDATE nne_beats SET status='reviewing',review_note=?,updated_at=? WHERE id=?`).bind(clean(body.note,500)||null,timestamp,beatId).run();
  await writeNneAudit(env,{ actorUserId:auth.user.id, action:`economy.beat.${action}`, entityType:'nne_beat', entityId:beatId, metadata:{ note:clean(body.note,500)||null }, request });
  return jsonOk({ beat_id:beatId, action });
}
