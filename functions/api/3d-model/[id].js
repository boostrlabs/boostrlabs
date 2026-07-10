import { jsonError } from "../../_lib/api.js";

const MODELS = {
  glizzy: { filename: "gs_glizzy.ply" },
  malta: { filename: "gs_malta.ply" }
};

function storage(env) {
  return env.BOOSTR_ASSETS || env.JOHANKARRD_ASSETS || env.ASSETS_BUCKET || env.R2_BUCKET || null;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range, Content-Type",
    "Access-Control-Expose-Headers": "Accept-Ranges, Content-Length, Content-Range, ETag, X-BOOSTR-R2-Key"
  };
}

function candidateKeys(filename) {
  return [
    `public/3dmodels/${filename}`,
    `/public/3dmodels/${filename}`,
    `3dmodels/${filename}`,
    `/3dmodels/${filename}`,
    filename
  ];
}

async function discoverKey(bucket, filename) {
  for (const key of candidateKeys(filename)) {
    try {
      const metadata = await bucket.head(key);
      if (metadata) return { key, metadata, discovered: false };
    } catch {}
  }

  const wanted = filename.toLowerCase();
  const prefixes = ["public/3dmodels/", "3dmodels/", "public/", ""];
  const seen = new Set();
  const visibleKeys = [];

  for (const prefix of prefixes) {
    let cursor;
    do {
      let page;
      try {
        page = await bucket.list({ prefix, cursor, limit: 1000 });
      } catch {
        break;
      }

      for (const object of page.objects || []) {
        if (seen.has(object.key)) continue;
        seen.add(object.key);
        if (visibleKeys.length < 60) visibleKeys.push(object.key);
        const base = object.key.split("/").pop()?.toLowerCase();
        if (base === wanted || object.key.toLowerCase().endsWith(`/${wanted}`)) {
          return { key: object.key, metadata: object, discovered: true, visibleKeys };
        }
      }

      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
  }

  return { key: null, metadata: null, discovered: false, visibleKeys };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

async function serve({ request, env, params }, headOnly = false) {
  const model = MODELS[String(params?.id || "").toLowerCase()];
  if (!model) return jsonError("model_not_found", "3D model not found.", 404);

  const bucket = storage(env);
  if (!bucket) return jsonError("r2_missing", "3D model storage is not configured.", 503);

  let resolved;
  try {
    resolved = await discoverKey(bucket, model.filename);
  } catch (error) {
    return jsonError("model_lookup_failed", "Could not inspect 3D model storage.", 500, {
      detail: String(error?.message || error)
    });
  }

  if (!resolved.key) {
    return jsonError("model_not_uploaded", `${model.filename} is not available in R2.`, 404, {
      attempted_keys: candidateKeys(model.filename),
      discovered_keys: resolved.visibleKeys || []
    });
  }

  if (headOnly) {
    const headers = new Headers(corsHeaders());
    resolved.metadata?.writeHttpMetadata?.(headers);
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename="${model.filename}"`);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=300");
    headers.set("X-BOOSTR-R2-Key", resolved.key);
    if (resolved.metadata?.httpEtag) headers.set("ETag", resolved.metadata.httpEtag);
    if (resolved.metadata?.size != null) headers.set("Content-Length", String(resolved.metadata.size));
    return new Response(null, { status: 200, headers });
  }

  const rangeHeader = request.headers.get("Range");
  let object;
  try {
    object = await bucket.get(resolved.key, rangeHeader ? { range: request.headers } : undefined);
  } catch (error) {
    return jsonError("model_read_failed", "Could not read the 3D model.", 500, {
      key: resolved.key,
      detail: String(error?.message || error)
    });
  }
  if (!object) {
    return jsonError("model_disappeared", `${model.filename} was found but could not be read.`, 404, {
      key: resolved.key
    });
  }

  const headers = new Headers(corsHeaders());
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", "application/octet-stream");
  headers.set("Content-Disposition", `inline; filename="${model.filename}"`);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  headers.set("X-BOOSTR-R2-Key", resolved.key);
  if (object.httpEtag) headers.set("ETag", object.httpEtag);

  let status = 200;
  if (object.range) {
    status = 206;
    const offset = Number(object.range.offset || 0);
    const length = Number(object.range.length || 0);
    const total = Number(object.size || resolved.metadata?.size || offset + length);
    headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${total}`);
    headers.set("Content-Length", String(length));
  } else if (object.size != null) {
    headers.set("Content-Length", String(object.size));
  }

  return new Response(object.body, { status, headers });
}

export async function onRequestGet(context) {
  return serve(context, false);
}

export async function onRequestHead(context) {
  return serve(context, true);
}
