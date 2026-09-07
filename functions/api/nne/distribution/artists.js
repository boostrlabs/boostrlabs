import { clean, jsonError, jsonOk, now, onOptions, readJson, requireNneAdmin, writeNneAudit } from "../../../_lib/nne-api.js";

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
