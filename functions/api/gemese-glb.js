import { jsonError } from "../_lib/api.js";

const FILENAMES = ["Gemese-3D.glb", "gemese-3d.glb", "gemese.glb", "gemese-nne.glb"];
const storage = (env) => env.BOOSTR_ASSETS || env.JOHANKARRD_ASSETS || env.ASSETS_BUCKET || env.R2_BUCKET || null;
const cors = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Expose-Headers": "Content-Length, ETag, X-BOOSTR-R2-Key, X-BOOSTR-Format"
});
const keys = (name) => [`public/3dmodels/${name}`, `3dmodels/${name}`, name];

async function resolve(bucket) {
  for (const name of FILENAMES) for (const key of keys(name)) {
    try { const metadata = await bucket.head(key); if (metadata) return { key, metadata }; } catch {}
  }
  for (const prefix of ["public/3dmodels/", "3dmodels/", ""]) {
    try {
      const page = await bucket.list({ prefix, limit: 1000 });
      const match = (page.objects || []).find((o) => String(o.key || "").toLowerCase().endsWith(".glb") && String(o.key || "").toLowerCase().includes("gemese"));
      if (match) return { key: match.key, metadata: match };
    } catch {}
  }
  return null;
}

export async function onRequestOptions() { return new Response(null, { status: 204, headers: cors() }); }
async function serve({ env }, head = false) {
  const bucket = storage(env);
  if (!bucket) return jsonError("r2_missing", "3D model storage is not configured.", 503);
  const found = await resolve(bucket);
  if (!found) return jsonError("model_not_uploaded", "Gemese GLB is not available in R2.", 404, { expected_path: "public/3dmodels/Gemese-3D.glb" });
  const headers = new Headers(cors());
  headers.set("Content-Type", "model/gltf-binary");
  headers.set("Content-Disposition", `inline; filename="${found.key.split("/").pop()}"`);
  headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  headers.set("X-BOOSTR-R2-Key", found.key);
  headers.set("X-BOOSTR-Format", "glb");
  if (head) { if (found.metadata?.size != null) headers.set("Content-Length", String(found.metadata.size)); return new Response(null, { status: 200, headers }); }
  const object = await bucket.get(found.key);
  if (!object) return jsonError("model_disappeared", "Gemese GLB could not be read.", 404);
  if (object.size != null) headers.set("Content-Length", String(object.size));
  return new Response(object.body, { status: 200, headers });
}
export async function onRequestGet(context) { return serve(context, false); }
export async function onRequestHead(context) { return serve(context, true); }
