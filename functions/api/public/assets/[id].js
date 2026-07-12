import { clean, jsonError, requireDb } from "../../../_lib/api.js";

function bucket(env) {
  return env.BOOSTR_ASSETS || env.JOHANKARRD_ASSETS || env.ASSETS_BUCKET || env.R2_BUCKET || null;
}

function parseMetadata(value) {
  try { return JSON.parse(value || "{}"); } catch { return {}; }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS"
    }
  });
}

async function serve({ env, params, request }) {
  const db = requireDb(env);
  if (!db.ok) return db.response;

  const id = clean(params.id, 120);
  if (!/^[a-f0-9-]{20,120}$/i.test(id)) {
    return jsonError("asset_not_found", "Asset not found.", 404);
  }

  const record = await env.DB.prepare(`
    SELECT id, file_type, status, metadata_json
    FROM workspace_files
    WHERE id = ?
      AND related_type = 'cloud_asset'
      AND status = 'active'
      AND file_type = 'image'
    LIMIT 1
  `).bind(id).first();

  if (!record?.id) return jsonError("asset_not_found", "Asset not found.", 404);

  const metadata = parseMetadata(record.metadata_json);
  const category = clean(metadata.category, 80);
  const source = clean(metadata.source, 80);
  if (category !== "product-media" && source !== "quick_publish_v4") {
    return jsonError("asset_not_public", "Asset is not public product media.", 404);
  }

  const key = clean(metadata.r2_key, 1000);
  if (!key.startsWith("cloud/") || key.includes("..")) {
    return jsonError("asset_not_found", "Asset not found.", 404);
  }

  const store = bucket(env);
  if (!store) return jsonError("r2_missing", "Asset storage is not configured.", 503);
  const object = await store.get(key);
  if (!object) return jsonError("asset_not_found", "Asset not found.", 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  headers.set("content-disposition", "inline");
  headers.set("access-control-allow-origin", "*");
  if (!headers.get("content-type")) headers.set("content-type", metadata.mime_type || "image/jpeg");
  if (object.size) headers.set("content-length", String(object.size));

  if (request.method === "HEAD") return new Response(null, { headers });
  return new Response(object.body, { headers });
}

export async function onRequestGet(context) {
  return serve(context);
}

export async function onRequestHead(context) {
  return serve(context);
}
