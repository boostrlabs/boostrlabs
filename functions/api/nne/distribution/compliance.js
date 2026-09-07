import { clean, jsonError, jsonOk, now, onOptions, readJson, requireNneAdmin, writeNneAudit } from "../../../_lib/nne-api.js";
import { requireDistributionAccess } from "../../../_lib/nne-distribution.js";
import { requireNneAssets } from "../../../_lib/nne-secure-media.js";

export const onRequestOptions = onOptions;

const taxFormFor = (country, entityType) => country === "US" ? "W-9" : entityType === "individual" ? "W-8BEN" : entityType === "business" ? "W-8BEN-E" : "manual-review";

async function canAccessArtist(env, auth, artistId) {
  if (auth.user.role === "admin") return true;
  const row = await env.DB.prepare("SELECT id FROM nne_distribution_access WHERE user_id=? AND artist_id=? AND status='active' LIMIT 1")
    .bind(auth.user.id, artistId).first();
  return Boolean(row?.id);
}
export async function onRequestGet({ request, env }) {
  const auth = await requireDistributionAccess(request, env);
  if (!auth.ok) return auth.response;
  const rows = await env.DB.prepare(
    `SELECT artist.id AS artist_id,artist.name AS artist_name,artist.country_code,
            profile.id,profile.legal_name,profile.entity_type,profile.tax_residency_country,
            profile.address_country,profile.tax_form_type,profile.tax_status,
            CASE WHEN profile.tax_document_object_key IS NULL THEN 0 ELSE 1 END AS document_uploaded,
            profile.payout_method,profile.payout_destination_hint,profile.review_note,
            profile.reviewed_at,profile.expires_at,profile.updated_at
     FROM nne_distribution_artists artist
     LEFT JOIN nne_distribution_payee_profiles profile ON profile.artist_id=artist.id
     WHERE ?='admin' OR EXISTS (
       SELECT 1 FROM nne_distribution_access access
       WHERE access.artist_id=artist.id AND access.user_id=? AND access.status='active'
     ) ORDER BY artist.name`
  ).bind(auth.user.role, auth.user.id).all();
  return jsonOk({ profiles: rows.results || [], guidance: {
    payer_country: "US", stores_sensitive_tax_ids: false,
    disclaimer: "La sugerencia de formulario es un control operativo. NNE debe validar cada caso con asesoría fiscal antes de pagar."
  }});
}

export async function onRequestPatch({ request, env }) {
  const auth = await requireDistributionAccess(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const artistId = clean(parsed.payload?.artist_id, 120);
  const legalName = clean(parsed.payload?.legal_name, 180);
  const entityType = clean(parsed.payload?.entity_type, 20);
  const country = clean(parsed.payload?.tax_residency_country, 2).toUpperCase();
  const addressCountry = clean(parsed.payload?.address_country || country, 2).toUpperCase();
  const payoutMethod = clean(parsed.payload?.payout_method, 60) || null;
  const destinationHint = clean(parsed.payload?.payout_destination_hint, 120) || null;
  if (!artistId || !legalName || !["individual", "business"].includes(entityType) || !/^[A-Z]{2}$/.test(country) || !/^[A-Z]{2}$/.test(addressCountry)) {
    return jsonError("nne_distribution_compliance_invalid", "Completa nombre legal, tipo de persona y países en formato ISO de dos letras.", 400);
  }
  if (!(await canAccessArtist(env, auth, artistId))) return jsonError("nne_distribution_artist_forbidden", "No puedes editar ese perfil fiscal.", 403);
  const existing = await env.DB.prepare("SELECT * FROM nne_distribution_payee_profiles WHERE artist_id=? LIMIT 1").bind(artistId).first();
  const formType = taxFormFor(country, entityType);
  const changedIdentity = existing && (existing.legal_name !== legalName || existing.entity_type !== entityType || existing.tax_residency_country !== country);
  const id = existing?.id || `dist_tax_${crypto.randomUUID().replaceAll("-", "")}`;
  const status = changedIdentity ? "required" : existing?.tax_status || "required";
  await env.DB.prepare(
    `INSERT INTO nne_distribution_payee_profiles (
      id,artist_id,legal_name,entity_type,tax_residency_country,address_country,tax_form_type,tax_status,
      payout_method,payout_destination_hint,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(artist_id) DO UPDATE SET legal_name=excluded.legal_name,entity_type=excluded.entity_type,
      tax_residency_country=excluded.tax_residency_country,address_country=excluded.address_country,
      tax_form_type=excluded.tax_form_type,tax_status=?,payout_method=excluded.payout_method,
      payout_destination_hint=excluded.payout_destination_hint,review_note=NULL,reviewed_by=NULL,reviewed_at=NULL,updated_at=excluded.updated_at`
  ).bind(id, artistId, legalName, entityType, country, addressCountry, formType, status, payoutMethod, destinationHint, now(), now(), status).run();
  await writeNneAudit(env, request, auth.user.id, "distribution.compliance_profile_updated", "nne_distribution_payee_profile", id, { artist_id: artistId, form_type: formType, status });
  return jsonOk({ profile_id: id, tax_form_type: formType, tax_status: status });
}

export async function onRequestPut({ request, env }) {
  const auth = await requireDistributionAccess(request, env);
  if (!auth.ok) return auth.response;
  const assets = requireNneAssets(env);
  if (!assets.ok) return assets.response;
  const artistId = clean(new URL(request.url).searchParams.get("artist_id"), 120);
  if (!(await canAccessArtist(env, auth, artistId))) return jsonError("nne_distribution_artist_forbidden", "No puedes subir ese documento fiscal.", 403);
  const profile = await env.DB.prepare("SELECT * FROM nne_distribution_payee_profiles WHERE artist_id=? LIMIT 1").bind(artistId).first();
  if (!profile?.id) return jsonError("nne_distribution_compliance_profile_required", "Guarda primero tu perfil fiscal.", 409);
  const type = clean(request.headers.get("Content-Type"), 100).toLowerCase();
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (type !== "application/pdf" || !bytes.length || bytes.length > 12 * 1024 * 1024 || String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-") {
    return jsonError("nne_distribution_tax_document_invalid", "Sube el formulario fiscal firmado en PDF (máximo 12 MB).", 400);
  }
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((v) => v.toString(16).padStart(2, "0")).join("");
  const key = `nne/distribution/compliance/${artistId}/${profile.id}-${hash.slice(0, 16)}.pdf`;
  await env.BOOSTR_ASSETS.put(key, bytes, { httpMetadata: { contentType: "application/pdf" }, customMetadata: { artistId, profileId: profile.id, sha256: hash } });
  if (profile.tax_document_object_key && profile.tax_document_object_key !== key) await env.BOOSTR_ASSETS.delete(profile.tax_document_object_key);
  await env.DB.prepare(
    "UPDATE nne_distribution_payee_profiles SET tax_document_object_key=?,tax_document_hash=?,tax_status='submitted',review_note=NULL,reviewed_by=NULL,reviewed_at=NULL,updated_at=? WHERE id=?"
  ).bind(key, hash, now(), profile.id).run();
  await writeNneAudit(env, request, auth.user.id, "distribution.tax_document_submitted", "nne_distribution_payee_profile", profile.id, { artist_id: artistId, sha256: hash });
  return jsonOk({ profile_id: profile.id, tax_status: "submitted", document_uploaded: true });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireNneAdmin(request, env);
  if (!auth.ok) return auth.response;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const artistId = clean(parsed.payload?.artist_id, 120);
  const decision = clean(parsed.payload?.decision, 20);
  const note = clean(parsed.payload?.note, 500) || null;
  if (!artistId || !["verified", "rejected"].includes(decision)) return jsonError("nne_distribution_compliance_decision", "Decisión fiscal no válida.", 400);
  const current = await env.DB.prepare("SELECT id,tax_document_object_key FROM nne_distribution_payee_profiles WHERE artist_id=? LIMIT 1").bind(artistId).first();
  if (!current?.id || !current.tax_document_object_key) return jsonError("nne_distribution_tax_document_required", "No hay documento fiscal para revisar.", 409);
  await env.DB.prepare("UPDATE nne_distribution_payee_profiles SET tax_status=?,review_note=?,reviewed_by=?,reviewed_at=?,updated_at=? WHERE id=?")
    .bind(decision, note, auth.user.id, now(), now(), current.id).run();
  await writeNneAudit(env, request, auth.user.id, `distribution.compliance_${decision}`, "nne_distribution_payee_profile", current.id, { artist_id: artistId });
  return jsonOk({ profile_id: current.id, tax_status: decision });
}
