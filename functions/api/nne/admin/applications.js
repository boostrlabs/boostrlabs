import { jsonOk, requireNneAdmin } from "../../../_lib/nne-api.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const status = ["pending", "approved", "rejected"].includes(url.searchParams.get("status"))
    ? url.searchParams.get("status")
    : "pending";
  const result = await env.DB.prepare(
    `SELECT id, email, username, display_name, artist_role, country, city,
            instagram_handle, whatsapp_contact, telegram_handle, primary_contact,
            bio, referral_code, promo_code, status, review_note, reviewed_at, created_at
     FROM nne_access_applications
     WHERE status = ?
     ORDER BY created_at ASC
     LIMIT 200`
  ).bind(status).all();

  return jsonOk({ applications: result.results || [] });
}
