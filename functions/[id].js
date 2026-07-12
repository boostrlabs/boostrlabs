function bucket(env) {
  return env.BOOSTR_ASSETS || env.JOHANKARRD_ASSETS || env.ASSETS_BUCKET || env.R2_BUCKET || null;
}

function isUuid(value = "") {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
}

function parseMetadata(value) {
  try { return JSON.parse(value || "{}"); } catch { return {}; }
}

export async function onRequestGet(context) {
  const id = String(context.params?.id || "").trim();
  if (!isUuid(id)) return context.next();

  const { env } = context;
  if (!env.DB) return new Response("BOOSTR Cloud database is not configured.", { status: 503 });

  const record = await env.DB.prepare(
    `SELECT id, title, file_url, file_type, visibility, status, metadata_json
     FROM workspace_files
     WHERE id = ? AND related_type = 'cloud_asset' AND status = 'active'
     LIMIT 1`
  ).bind(id).first();

  if (!record) return new Response("Archivo no encontrado.", { status: 404 });

  // A copied cloud link is available only for workspace-visible assets.
  // Private, role, users and module assets remain behind authenticated APIs.
  const visibility = String(record.visibility || "workspace").toLowerCase();
  if (visibility !== "workspace") {
    return new Response("Este archivo no tiene un enlace compartible.", { status: 403 });
  }

  const metadata = parseMetadata(record.metadata_json);
  const key = String(metadata.r2_key || "");
  if (!key.startsWith("cloud/") || key.includes("..")) {
    return new Response("Referencia de archivo inválida.", { status: 404 });
  }

  const store = bucket(env);
  if (!store) return new Response("BOOSTR Cloud storage is not configured.", { status: 503 });

  const object = await store.get(key);
  if (!object) return new Response("Archivo no encontrado.", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "private, max-age=60");
  headers.set("x-content-type-options", "nosniff");
  headers.set("content-disposition", `inline; filename*=UTF-8''${encodeURIComponent(record.title || metadata.original_name || "archivo")}`);
  if (!headers.get("content-type")) headers.set("content-type", metadata.mime_type || "application/octet-stream");
  if (object.size) headers.set("content-length", String(object.size));

  return new Response(object.body, { status: 200, headers });
}
