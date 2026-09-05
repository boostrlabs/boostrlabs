import {
  clean,
  jsonError,
  jsonOk,
  now,
  onOptions,
  readJson,
  requireNneAdmin,
  writeNneAudit
} from "../../../_lib/nne-api.js";

const saleModes = new Set(["lease", "exclusive", "both"]);
const statuses = new Set(["draft", "published", "paused", "archived"]);

const slugify = (value) => clean(value, 160)
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 80);

export const onRequestOptions = onOptions;

export async function onRequestGet({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const result = await env.DB.prepare(
    `SELECT b.*,
            (SELECT COUNT(*) FROM nne_beat_listen_sessions s WHERE s.beat_id = b.id) AS listen_sessions,
            (SELECT COUNT(*) FROM nne_beat_licenses l WHERE l.beat_id = b.id AND l.status = 'active') AS licenses
     FROM nne_secure_beats b ORDER BY b.sort_order, b.created_at DESC`
  ).all();
  return jsonOk({ beats: result.results || [] });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.payload || {};
  const title = clean(payload.title, 160);
  const producer = clean(payload.producer_name, 160);
  const saleMode = clean(payload.sale_mode || "lease", 20);
  const requestedStatus = clean(payload.status || "draft", 20);
  const leasePrice = payload.lease_price_credits === "" || payload.lease_price_credits == null
    ? null : Math.floor(Number(payload.lease_price_credits));
  const exclusivePrice = payload.exclusive_price_credits === "" || payload.exclusive_price_credits == null
    ? null : Math.floor(Number(payload.exclusive_price_credits));
  if (!title || !producer || !saleModes.has(saleMode) || !statuses.has(requestedStatus)) {
    return jsonError("nne_beat_fields_invalid", "Título, productor y modalidad son requeridos.", 400);
  }
  if ((saleMode === "lease" || saleMode === "both") && (!leasePrice || leasePrice < 1)) {
    return jsonError("nne_beat_lease_price_invalid", "Configura el precio de la licencia.", 400);
  }
  if ((saleMode === "exclusive" || saleMode === "both") && (!exclusivePrice || exclusivePrice < 1)) {
    return jsonError("nne_beat_exclusive_price_invalid", "Configura el precio exclusivo.", 400);
  }

  const id = `beat_${crypto.randomUUID().replaceAll("-", "")}`;
  const slug = `${slugify(payload.slug || title) || "beat"}-${id.slice(-6)}`;
  const timestamp = now();
  await env.DB.prepare(
    `INSERT INTO nne_secure_beats (
      id, slug, title, producer_name, description, bpm, musical_key, sale_mode,
      lease_price_credits, exclusive_price_credits, status, sort_order,
      created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    slug,
    title,
    producer,
    clean(payload.description, 1200) || null,
    payload.bpm ? Math.floor(Number(payload.bpm)) : null,
    clean(payload.musical_key, 20) || null,
    saleMode,
    leasePrice,
    exclusivePrice,
    "draft",
    Math.floor(Number(payload.sort_order || 0)),
    auth.user.id,
    timestamp,
    timestamp
  ).run();
  await writeNneAudit(env, request, auth.user.id, "beat.created", "nne_beat", id, { title, requested_status: requestedStatus });
  return jsonOk({ beat: { id, slug, title } }, 201);
}
