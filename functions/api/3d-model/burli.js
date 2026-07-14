import { jsonError } from "../../_lib/api.js";

const FILENAMES = ["BURLi.glb", "burli.glb", "burli-3d.glb", "burli-cartoon.glb"];

function storage(env) {
  return env.BOOSTR_ASSETS || env.JOHANKARRD_ASSETS || env.ASSETS_BUCKET || env.R2_BUCKET || null;
}

function headers() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Expose-Headers": "Content-Length, ETag, X-BOOSTR-R2-Key, X-BOOSTR-Format"
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
        const key = String(object.key || "").toLowerCase();
        return key.endsWith(".glb") && key.includes("burli");
      });
      if (match) return { key: match.key, metadata: match };
    } catch {}
  }

  return null;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: headers() });
}

async function serve({ env }, headOnly = false) {
  const bucket = storage(env);
  if (!bucket) return jsonError("r2_missing", "3D model storage is not configured.", 503);

  const resolved = await resolveObject(bucket);
  if (!resolved) {
    return jsonError("model_not_uploaded", "BURLi GLB is not available in R2.", 404, {
      expected_filenames: FILENAMES,
      expected_path: "public/3dmodels/BURLi.glb"
    });
  }

  const responseHeaders = new Headers(headers());
  resolved.metadata?.writeHttpMetadata?.(responseHeaders);
  responseHeaders.set("Content-Type", "model/gltf-binary");
  responseHeaders.set("Content-Disposition", `inline; filename="${resolved.key.split("/").pop()}"`);
  responseHeaders.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  responseHeaders.set("X-BOOSTR-R2-Key", resolved.key);
  responseHeaders.set("X-BOOSTR-Format", "glb");
  if (resolved.metadata?.httpEtag) responseHeaders.set("ETag", resolved.metadata.httpEtag);

  if (headOnly) {
    if (resolved.metadata?.size != null) responseHeaders.set("Content-Length", String(resolved.metadata.size));
    return new Response(null, { status: 200, headers: responseHeaders });
  }

  let object;
  try {
    object = await bucket.get(resolved.key);
  } catch (error) {
    return jsonError("model_read_failed", "Could not read BURLi GLB.", 500, {
      key: resolved.key,
      detail: String(error?.message || error)
    });
  }

  if (!object) return jsonError("model_disappeared", "BURLi GLB could not be read.", 404);

  object.writeHttpMetadata(responseHeaders);
  responseHeaders.set("Content-Type", "model/gltf-binary");
  responseHeaders.set("X-BOOSTR-R2-Key", resolved.key);
  responseHeaders.set("X-BOOSTR-Format", "glb");
  if (object.size != null) responseHeaders.set("Content-Length", String(object.size));

  return new Response(object.body, { status: 200, headers: responseHeaders });
}

export async function onRequestGet(context) {
  return serve(context, false);
}

export async function onRequestHead(context) {
  return serve(context, true);
}
