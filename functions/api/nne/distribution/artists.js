import { clean, jsonError, jsonOk, now, onOptions, readJson, requireNneAdmin, writeNneAudit } from "../../../_lib/nne-api.js";
import { requireDistributionAccess } from "../../../_lib/nne-distribution.js";

export const onRequestOptions = onOptions;

export async function onRequestPost({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const name = clean(parsed.payload?.name, 160);
  const slug = clean(parsed.payload?.slug || name, 100)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const instagram = clean(parsed.payload?.instagram_handle, 100).replace(/^@/, "");
  if (name.length < 2 || slug.length < 2) {
    return jsonError("nne_distribution_artist_invalid", "Escribe el nombre artístico.", 400);
  }
  const exists = await env.DB.prepare("SELECT id FROM nne_distribution_artists WHERE slug=? LIMIT 1").bind(slug).first();
  if (exists?.id) return jsonError("nne_distribution_artist_exists", "Ese perfil artístico ya existe.", 409);
  const id = `nne_dist_artist_${crypto.randomUUID().replaceAll("-", "")}`;
  const timestamp = now();
  await env.DB.prepare(
    `INSERT INTO nne_distribution_artists (
      id,slug,name,country_code,primary_genre,instagram_handle,status,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,'active',?,?)`
  ).bind(
    id,
    slug,
    name,
    clean(parsed.payload?.country_code, 2).toUpperCase() || null,
    clean(parsed.payload?.primary_genre, 80) || "Latin Urban",
    instagram || null,
    timestamp,
    timestamp
  ).run();
  await writeNneAudit(env, request, auth.user.id, "distribution.artist_created", "nne_distribution_artist", id, { name, slug });
  return jsonOk({ artist: { id, slug, name, instagram_handle: instagram || null } }, 201);
}

export async function onRequestPatch({ request, env }) {
  const auth = await requireDistributionAccess(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const artistId = clean(parsed.payload?.artist_id, 120);
  if (!artistId) return jsonError("nne_distribution_artist_required", "Selecciona el perfil artístico.", 400);
  if (auth.user.role !== "admin") {
    const access = await env.DB.prepare(
      "SELECT id FROM nne_distribution_access WHERE user_id=? AND artist_id=? AND status='active' AND role IN ('artist','manager','label_admin') LIMIT 1"
    ).bind(auth.user.id, artistId).first();
    if (!access?.id) return jsonError("nne_distribution_artist_forbidden", "No puedes editar ese perfil.", 403);
  }
  const current = await env.DB.prepare("SELECT * FROM nne_distribution_artists WHERE id=? LIMIT 1").bind(artistId).first();
  if (!current?.id) return jsonError("nne_distribution_artist_not_found", "Perfil artístico no encontrado.", 404);
  const name = clean(parsed.payload?.name ?? current.name, 160);
  if (name.length < 2) return jsonError("nne_distribution_artist_invalid", "Escribe el nombre artístico.", 400);
  const instagram = clean(parsed.payload?.instagram_handle ?? current.instagram_handle, 100).replace(/^@/, "");
  const timestamp = now();
  await env.DB.prepare(
    `UPDATE nne_distribution_artists SET
      name=?,country_code=?,primary_genre=?,instagram_handle=?,spotify_artist_id=?,apple_music_artist_id=?,updated_at=?
     WHERE id=?`
  ).bind(
    name,
    clean(parsed.payload?.country_code ?? current.country_code, 2).toUpperCase() || null,
    clean(parsed.payload?.primary_genre ?? current.primary_genre, 80) || null,
    instagram || null,
    clean(parsed.payload?.spotify_artist_id ?? current.spotify_artist_id, 160) || null,
    clean(parsed.payload?.apple_music_artist_id ?? current.apple_music_artist_id, 160) || null,
    timestamp,
    artistId
  ).run();
  const artist = await env.DB.prepare("SELECT * FROM nne_distribution_artists WHERE id=? LIMIT 1").bind(artistId).first();
  await writeNneAudit(env, request, auth.user.id, "distribution.artist_updated", "nne_distribution_artist", artistId, { name });
  return jsonOk({ artist });
}
