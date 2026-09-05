import { jsonOk, requireNneSession } from "../../_lib/nne-api.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneSession(request, env);
  if (!auth.ok) return auth.response;

  const result = await env.DB.prepare(
    `SELECT b.id, b.slug, b.title, b.producer_name, b.description, b.bpm, b.musical_key,
            b.sale_mode, b.lease_price_credits, b.exclusive_price_credits, b.status,
            CASE WHEN b.stream_object_key IS NOT NULL THEN 1 ELSE 0 END AS stream_ready,
            CASE WHEN b.artwork_object_key IS NOT NULL THEN 1 ELSE 0 END AS artwork_ready,
            l.id AS license_id, l.license_type, l.license_number, l.created_at AS licensed_at,
            CASE WHEN b.status = 'sold' AND l.id IS NULL THEN 0 ELSE 1 END AS available
     FROM nne_secure_beats b
     LEFT JOIN nne_beat_licenses l
       ON l.beat_id = b.id AND l.user_id = ? AND l.status = 'active'
     WHERE b.status = 'published'
        OR (b.status = 'sold' AND EXISTS (
          SELECT 1 FROM nne_beat_licenses owned
          WHERE owned.beat_id = b.id AND owned.user_id = ? AND owned.status = 'active'
        ))
     ORDER BY b.sort_order, b.created_at DESC`
  ).bind(auth.user.id, auth.user.id).all();

  const beats = (result.results || []).map((beat) => ({
    ...beat,
    artwork_url: beat.artwork_ready ? `/api/nne/beats/${encodeURIComponent(beat.id)}/artwork` : null
  }));
  return jsonOk({ beats });
}
