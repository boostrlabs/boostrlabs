import { jsonError } from "../_lib/api.js";

const FILENAMES = ["BURLi.glb", "burli.glb", "burli-3d.glb", "burli-cartoon.glb"];

function storage(env) {
  return env.BOOSTR_ASSETS || env.JOHANKARRD_ASSETS || env.ASSETS_BUCKET || env.R2_BUCKET || null;
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

function baseHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Expose-Headers": "Content-Length, ETag, X-BOOSTR-R2-Key, X-BOOSTR-Format",
    "Content-Type": "model/gltf-binary",
    "Cache-Control": "no-store, max-age=0",
    "Accept-Ranges": "none",
    "X-BOOSTR-Format": "glb"
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: baseHeaders() });
}

async function serve({ env }, headOnly = false) {
  const bucket = storage(env);
  if (!bucket) return jsonError("r2_missing", "3D model storage is not configured.", 503);

  const resolved = await resolveObject(bucket);
  if (!resolved) return jsonError("model_not_uploaded", "BURLi GLB is not available in R2.", 404, {
    expected_filenames: FILENAMES,
    expected_path: "public/3dmodels/BURLi.glb"
  });

  const headers = new Headers(baseHeaders());
  headers.set("X-BOOSTR-R2-Key", resolved.key);
  headers.set("Content-Disposition", `inline; filename="${resolved.key.split("/").pop()}"`);
  if (resolved.metadata?.httpEtag) headers.set("ETag", resolved.metadata.httpEtag);

  if (headOnly) {
    if (resolved.metadata?.size != null) headers.set("Content-Length", String(resolved.metadata.size));
    return new Response(null, { status: 200, headers });
  }

  const object = await bucket.get(resolved.key);
  if (!object) return jsonError("model_disappeared", "BURLi GLB could not be read.", 404);

  const bytes = await object.arrayBuffer();
  headers.set("Content-Length", String(bytes.byteLength));
  return new Response(bytes, { status: 200, headers });
}

export async function onRequestGet(context) { return serve(context, false); }
export async function onRequestHead(context) { return serve(context, true); }
