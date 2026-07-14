import { jsonError } from "../../_lib/api.js";

const FILENAMES = [
  "BURLi_final_Cartoon_character_wearing_glasses_and_a_chain_Tripo(1).splat",
  "burli-final-cartoon.splat",
  "burli.splat"
];

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
  return [`public/3dmodels/${filename}`, `3dmodels/${filename}`, filename];
}

async function resolveObject(bucket) {
  for (const filename of FILENAMES) {
    for (const key of candidateKeys(filename)) {
      try {
        const metadata = await bucket.head(key);
        if (metadata) return { key, metadata };
      } catch {}
    }
  }

  for (const prefix of ["public/3dmodels/", "3dmodels/", ""]) {
    try {
      const page = await bucket.list({ prefix, limit: 1000 });
      const match = (page.objects || []).find((object) => {
        const key = object.key.toLowerCase();
        return key.endsWith(".splat") && key.includes("burli");
      });
      if (match) return { key: match.key, metadata: match };
    } catch {}
  }
  return null;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

async function serve({ request, env }, headOnly = false) {
  const bucket = storage(env);
  if (!bucket) return jsonError("r2_missing", "3D model storage is not configured.", 503);

  const resolved = await resolveObject(bucket);
  if (!resolved) return jsonError("model_not_uploaded", "BURLi .splat is not available in R2.", 404, {
    expected_filenames: FILENAMES,
    expected_path: `public/3dmodels/${FILENAMES[0]}`
  });

  const headers = new Headers(corsHeaders());
  resolved.metadata?.writeHttpMetadata?.(headers);
  headers.set("Content-Type", "application/octet-stream");
  headers.set("Content-Disposition", `inline; filename="${resolved.key.split("/").pop()}"`);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  headers.set("X-BOOSTR-R2-Key", resolved.key);
  headers.set("X-BOOSTR-Format", "splat");
  if (resolved.metadata?.httpEtag) headers.set("ETag", resolved.metadata.httpEtag);

  if (headOnly) {
    if (resolved.metadata?.size != null) headers.set("Content-Length", String(resolved.metadata.size));
    return new Response(null, { status: 200, headers });
  }

  const rangeHeader = request.headers.get("Range");
  const object = await bucket.get(resolved.key, rangeHeader ? { range: request.headers } : undefined);
  if (!object) return jsonError("model_disappeared", "BURLi model could not be read.", 404);

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

export async function onRequestGet(context) { return serve(context, false); }
export async function onRequestHead(context) { return serve(context, true); }
