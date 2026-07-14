import { clean, jsonError, requireDb } from "../../../../../_lib/api.js";

const OWNER_EMAIL = "janko@boostrlabs.com";
const ALLOWED = new Set(["janko", "gemese", "rowma"]);

function bucket(env) {
  return env.BOOSTR_ASSETS || env.JOHANKARRD_ASSETS || env.ASSETS_BUCKET || env.R2_BUCKET || null;
}

function metadata(record) {
  try { return JSON.parse(record?.metadata_json || "{}"); } catch { return {}; }
}

function text(record) {
  const meta = metadata(record);
  return [record?.title, meta?.original_name, meta?.entry_path, meta?.category, meta?.source]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function score(record, slot) {
  const value = text(record);
  const meta = metadata(record);
  let points = 0;

  const words = {
    janko: ["janko", "diorr", "westdetro"],
    gemese: ["gemese", "nosotrosnoellos", "nosotros no ellos", "nne"],
    rowma: ["rowma", "rowmapr"]
  }[slot] || [];

  for (const word of words) {
    if (value.includes(word)) points += word.length > 4 ? 80 : 25;
  }

  if (value.includes("orlando")) points += 25;
  if (value.includes("fuerte")) points += 20;
  if (value.includes("bday")) points += 15;
  if (value.includes("jul 25") || value.includes("jul25") || value.includes("25th")) points += 15;

  const width = Number(meta?.width || 0);
  const height = Number(meta?.height || 0);
  if (slot !== "rowma" && height > width && width >= 900 && height >= 1300) points += 35;
  if (slot === "rowma" && width >= 350 && height >= 450) points += 10;

  const created = Date.parse(record?.created_at || 0) || 0;
  points += Math.min(created / 1e13, 2);
  return points;
}

async function findAsset(env, slot) {
  const user = await env.DB.prepare(
    "SELECT id FROM users WHERE lower(email) = ? LIMIT 1"
  ).bind(OWNER_EMAIL).first();
  if (!user?.id) return null;

  const result = await env.DB.prepare(
    `SELECT id, title, file_url, metadata_json, created_at
     FROM workspace_files
     WHERE uploaded_by_user_id = ?
       AND related_type = 'cloud_asset'
       AND status = 'active'
       AND file_type = 'image'
     ORDER BY created_at DESC
     LIMIT 200`
  ).bind(user.id).all();

  return (result.results || [])
    .map((record) => ({ record, score: score(record, slot) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.record || null;
}

export async function onRequestGet({ env, params }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const slot = clean(params.slot, 30).toLowerCase();
  if (!ALLOWED.has(slot)) return jsonError("event_asset_not_found", "Asset not found.", 404);

  const record = await findAsset(env, slot);
  if (!record?.id) return jsonError("event_asset_not_found", "Event artwork was not found in Janko Artist OS Cloud.", 404);

  const meta = metadata(record);
  const key = clean(meta?.r2_key, 1000);
  if (!key || !key.startsWith("cloud/") || key.includes("..")) {
    return jsonError("event_asset_invalid", "Event artwork reference is invalid.", 409);
  }

  const store = bucket(env);
  if (!store) return jsonError("r2_missing", "Cloud storage is not configured.", 503);
  const object = await store.get(key);
  if (!object) return jsonError("event_asset_missing", "Event artwork is missing from storage.", 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=300, s-maxage=300, stale-while-revalidate=86400");
  headers.set("x-content-type-options", "nosniff");
  headers.set("content-disposition", "inline");
  headers.set("access-control-allow-origin", "*");
  if (!headers.get("content-type")) headers.set("content-type", "image/jpeg");
  if (object.size) headers.set("content-length", String(object.size));
  return new Response(object.body, { headers });
}
