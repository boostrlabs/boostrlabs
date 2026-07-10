import { jsonError } from "../../_lib/api.js";

const MODELS = {
  glizzy: { key: "public/3dmodels/gs_glizzy.ply", filename: "gs_glizzy.ply" },
  malta: { key: "public/3dmodels/gs_malta.ply", filename: "gs_malta.ply" }
};

function storage(env) {
  return env.BOOSTR_ASSETS || env.JOHANKARRD_ASSETS || env.ASSETS_BUCKET || env.R2_BUCKET || null;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range, Content-Type",
    "Access-Control-Expose-Headers": "Accept-Ranges, Content-Length, Content-Range, ETag"
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

async function serve({ request, env, params }, headOnly = false) {
  const model = MODELS[String(params?.id || "").toLowerCase()];
  if (!model) return jsonError("model_not_found", "3D model not found.", 404);

  const bucket = storage(env);
  if (!bucket) return jsonError("r2_missing", "3D model storage is not configured.", 503);

  const rangeHeader = request.headers.get("Range");
  let object;
  try {
    object = await bucket.get(model.key, rangeHeader ? { range: request.headers } : undefined);
  } catch (error) {
    return jsonError("model_read_failed", "Could not read the 3D model.", 500, { detail: String(error?.message || error) });
  }
  if (!object) return jsonError("model_not_uploaded", `${model.filename} is not available in R2.`, 404);

  const headers = new Headers(corsHeaders());
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", "application/octet-stream");
  headers.set("Content-Disposition", `inline; filename="${model.filename}"`);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  if (object.httpEtag) headers.set("ETag", object.httpEtag);

  let status = 200;
  if (object.range) {
    status = 206;
    const offset = Number(object.range.offset || 0);
    const length = Number(object.range.length || 0);
    const total = Number(object.size || offset + length);
    headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${total}`);
    headers.set("Content-Length", String(length));
  } else if (object.size != null) {
    headers.set("Content-Length", String(object.size));
  }

  return new Response(headOnly ? null : object.body, { status, headers });
}

export async function onRequestGet(context) {
  return serve(context, false);
}

export async function onRequestHead(context) {
  return serve(context, true);
}
