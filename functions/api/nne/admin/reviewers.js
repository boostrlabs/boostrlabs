import { clean, jsonError, jsonOk, now, onOptions, readJson, requireNneAdmin, writeNneAudit } from "../../../_lib/nne-api.js";
import { ensureNneReviewerTables } from "../../../_lib/nne-reviewer.js";

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneReviewerTables(env);
  const rows = await env.DB.prepare(`SELECT r.user_id,r.artist_slug,r.active,u.username,u.display_name,u.email FROM nne_artist_reviewers r JOIN nne_users u ON u.id=r.user_id ORDER BY r.artist_slug,u.username`).all();
  return jsonOk({ reviewers: rows.results || [] });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  await ensureNneReviewerTables(env);
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const username = clean(parsed.payload?.username, 80).replace(/^@/, "");
  const artistSlug = clean(parsed.payload?.artist_slug, 40).toLowerCase();
  if (!username || !["janko","gemese","xiam"].includes(artistSlug)) return jsonError("nne_reviewer_fields", "Indica username y artista válido.", 400);
  const user = await env.DB.prepare(`SELECT id,username,display_name FROM nne_users WHERE username = ? COLLATE NOCASE AND status='active' LIMIT 1`).bind(username).first();
  if (!user?.id) return jsonError("nne_reviewer_user_not_found", "Ese usuario todavía no existe en NNE Community.", 404);
  const timestamp = now();
  await env.DB.prepare(`INSERT INTO nne_artist_reviewers (user_id,artist_slug,active,created_at,updated_at) VALUES (?,?,1,?,?) ON CONFLICT(user_id,artist_slug) DO UPDATE SET active=1,updated_at=excluded.updated_at`).bind(user.id,artistSlug,timestamp,timestamp).run();
  await writeNneAudit(env, request, auth.user.id, "reviewer.assigned", "nne_user", user.id, { artist_slug: artistSlug, username: user.username });
  return jsonOk({ reviewer: { user_id:user.id, username:user.username, name:user.display_name, artist_slug:artistSlug, active:true } }, 201);
}
