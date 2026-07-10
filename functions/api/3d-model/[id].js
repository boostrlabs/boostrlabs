import { jsonError } from "../../_lib/api.js";

const MODELS = {
  glizzy: { filenames: ["gs_glizzy.ply"], extension: ".ply" },
  malta: { filenames: ["gs_malta.ply"], extension: ".ply" },
  "johanka-ply": {
    filenames: ["prueba.ply", "johanka.ply", "johanka_3d.ply", "johanka 3d.ply"],
    extension: ".ply",
    terms: ["prueba", "johanka"]
  },
  "johanka-luma": {
    filenames: ["unreal engine johanka.luma", "unreal_engine_johanka.luma", "johanka.luma", "johanka_3d.luma"],
    extension: ".luma",
    terms: ["johanka", "unreal"]
  }
};

function storage(env) {
  return env.BOOSTR_ASSETS || env.JOHANKARRD_ASSETS || env.ASSETS_BUCKET || env.R2_BUCKET || null;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range, Content-Type",
    "Access-Control-Expose-Headers": "Accept-Ranges, Content-Length, Content-Range, ETag, X-BOOSTR-R2-Key, X-BOOSTR-Format"
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

function matchesModel(key, model) {
  const lower = key.toLowerCase();
  const base = lower.split("/").pop() || lower;
  if (!base.endsWith(model.extension)) return false;
  if (model.filenames.some((name) => base === name.toLowerCase())) return true;
  return (model.terms || []).every((term) => lower.includes(term));
}

async function discoverKey(bucket, model) {
  for (const filename of model.filenames) {
    for (const key of candidateKeys(filename)) {
      try {
        const metadata = await bucket.head(key);
        if (metadata) return { key, metadata, discovered: false };
      } catch {}
    }
  }

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
        if (visibleKeys.length < 100) visibleKeys.push(object.key);
        if (matchesModel(object.key, model)) return { key: object.key, metadata: object, discovered: true, visibleKeys };
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
    resolved = await discoverKey(bucket, model);
  } catch (error) {
    return jsonError("model_lookup_failed", "Could not inspect 3D model storage.", 500, { detail: String(error?.message || error) });
  }
  if (!resolved.key) {
    return jsonError("model_not_uploaded", "The requested 3D model is not available in R2.", 404, {
      expected_filenames: model.filenames,
      extension: model.extension,
      discovered_keys: resolved.visibleKeys || []
    });
  }

  const common = new Headers(corsHeaders());
  resolved.metadata?.writeHttpMetadata?.(common);
  common.set("Content-Type", model.extension === ".luma" ? "application/octet-stream" : "application/octet-stream");
  common.set("Content-Disposition", `inline; filename="${resolved.key.split("/").pop()}"`);
  common.set("Accept-Ranges", "bytes");
  common.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  common.set("X-BOOSTR-R2-Key", resolved.key);
  common.set("X-BOOSTR-Format", model.extension.slice(1));
  if (resolved.metadata?.httpEtag) common.set("ETag", resolved.metadata.httpEtag);

  if (headOnly) {
    if (resolved.metadata?.size != null) common.set("Content-Length", String(resolved.metadata.size));
    return new Response(null, { status: 200, headers: common });
  }

  const rangeHeader = request.headers.get("Range");
  let object;
  try {
    object = await bucket.get(resolved.key, rangeHeader ? { range: request.headers } : undefined);
  } catch (error) {
    return jsonError("model_read_failed", "Could not read the 3D model.", 500, { key: resolved.key, detail: String(error?.message || error) });
  }
  if (!object) return jsonError("model_disappeared", "The 3D model was found but could not be read.", 404, { key: resolved.key });

  object.writeHttpMetadata(common);
  common.set("Content-Type", "application/octet-stream");
  common.set("Content-Disposition", `inline; filename="${resolved.key.split("/").pop()}"`);
  common.set("X-BOOSTR-R2-Key", resolved.key);
  common.set("X-BOOSTR-Format", model.extension.slice(1));

  let status = 200;
  if (object.range) {
    status = 206;
    const offset = Number(object.range.offset || 0);
    const length = Number(object.range.length || 0);
    const total = Number(object.size || resolved.metadata?.size || offset + length);
    common.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${total}`);
    common.set("Content-Length", String(length));
  } else if (object.size != null) {
    common.set("Content-Length", String(object.size));
  }
  return new Response(object.body, { status, headers: common });
}

export async function onRequestGet(context) { return serve(context, false); }
export async function onRequestHead(context) { return serve(context, true); }
