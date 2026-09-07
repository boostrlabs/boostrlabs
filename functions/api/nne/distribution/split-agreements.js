import { clean, jsonError, jsonOk, now, onOptions, readJson, writeNneAudit } from "../../../_lib/nne-api.js";
import { loadDistributionRelease, requireDistributionAccess, writeDistributionEvent } from "../../../_lib/nne-distribution.js";
import { requireNneAssets } from "../../../_lib/nne-secure-media.js";
import { buildSplitSheetPdf } from "../../../_lib/nne-split-pdf.js";
import { downloadDocusignEnvelopePdf, esignProviderState, getDocusignEnvelope, sendDocusignEnvelope } from "../../../_lib/nne-esign-provider.js";

export const onRequestOptions = onOptions;

const hex = (bytes) => [...bytes].map((v) => v.toString(16).padStart(2, "0")).join("");

export async function onRequestGet({ request, env }) {
  const auth = await requireDistributionAccess(request, env);
  if (!auth.ok) return auth.response;
  const releaseId = clean(new URL(request.url).searchParams.get("release_id"), 120);
  if (!releaseId) return jsonError("nne_distribution_release_required", "Selecciona un lanzamiento.", 400);
  const scoped = await requireDistributionAccess(request, env, releaseId);
  if (!scoped.ok) return scoped.response;
  const rows = await env.DB.prepare("SELECT * FROM nne_distribution_split_agreements WHERE release_id=? ORDER BY version DESC").bind(releaseId).all();
  const agreements = [];
  for (const row of rows.results || []) {
    const signers = await env.DB.prepare("SELECT participant_name,participant_email,role,percentage_bps,routing_order,status,signed_at FROM nne_distribution_split_signers WHERE agreement_id=? ORDER BY routing_order,participant_name").bind(row.id).all();
    agreements.push({ ...row, document_url: `/api/nne/distribution/split-agreements/${encodeURIComponent(row.id)}/document`, signers: signers.results || [] });
  }
  return jsonOk({ agreements, provider: esignProviderState(env) });
}

export async function onRequestPost({ request, env }) {
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const action = clean(parsed.payload?.action, 30);
  const releaseId = clean(parsed.payload?.release_id, 120);
  const auth = await requireDistributionAccess(request, env, releaseId);
  if (!auth.ok) return auth.response;
  if (action === "send") return sendAgreement(request, env, auth, releaseId, clean(parsed.payload?.agreement_id, 120));
  if (action === "refresh") return refreshAgreement(request, env, auth, releaseId, clean(parsed.payload?.agreement_id, 120));
  if (action !== "generate") return jsonError("nne_distribution_split_action", "Acción de firma no válida.", 400);
  const assets = requireNneAssets(env);
  if (!assets.ok) return assets.response;
  const release = await loadDistributionRelease(env, releaseId);
  if (!release) return jsonError("nne_distribution_release_not_found", "Lanzamiento no encontrado.", 404);
  if (!release.tracks?.length) return jsonError("nne_distribution_split_tracks", "Agrega al menos un track.", 409);
  for (const track of release.tracks) {
    const total = track.splits.reduce((sum, split) => sum + Number(split.percentage_bps || 0), 0);
    if (total !== 10000) return jsonError("nne_distribution_split_total", `${track.title}: los splits deben sumar 100%.`, 409);
    if (track.splits.some((split) => !/^\S+@\S+\.\S+$/.test(split.participant_email || ""))) return jsonError("nne_distribution_split_email", `${track.title}: cada participante necesita un correo válido para firmar.`, 409);
  }
  const previous = await env.DB.prepare("SELECT MAX(version) AS version FROM nne_distribution_split_agreements WHERE release_id=?").bind(release.id).first();
  const version = Number(previous?.version || 0) + 1;
  const agreementId = `dist_splitagr_${crypto.randomUUID().replaceAll("-", "")}`;
  const generatedAt = now();
  const pdf = buildSplitSheetPdf({ ...release, split_agreement_version: version }, generatedAt);
  const hash = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", pdf)));
  const key = `nne/distribution/agreements/${release.id}/v${version}-${hash.slice(0, 16)}.pdf`;
  await env.BOOSTR_ASSETS.put(key, pdf, { httpMetadata: { contentType: "application/pdf" }, customMetadata: { releaseId: release.id, agreementId, sha256: hash } });
  const signerRows = release.tracks.flatMap((track) => track.splits.map((split) => ({ ...split, track_title: track.title })));
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO nne_distribution_split_agreements (
      id,release_id,version,title,status,provider,pdf_object_key,content_hash,created_by,created_at,updated_at
    ) VALUES (?,?,?,?,'ready','nne_local',?,?,?,?,?)`).bind(agreementId, release.id, version, `${release.artist_name} - ${release.title}`, key, hash, auth.user.id, generatedAt, generatedAt),
    ...signerRows.map((signer, index) => env.DB.prepare(`INSERT INTO nne_distribution_split_signers (
      id,agreement_id,participant_name,participant_email,role,percentage_bps,routing_order,status,created_at
    ) VALUES (?,?,?,?,?,?,?,'pending',?)`).bind(`dist_signer_${crypto.randomUUID().replaceAll("-", "")}`, agreementId, signer.participant_name, signer.participant_email, `${signer.track_title} · ${signer.role}`, signer.percentage_bps, index + 1, generatedAt))
  ]);
  await writeDistributionEvent(env, release.id, auth.user.id, "split_agreement.generated", release.status, release.status, { agreement_id: agreementId, version, sha256: hash });
  await writeNneAudit(env, request, auth.user.id, "distribution.split_agreement_generated", "nne_distribution_split_agreement", agreementId, { release_id: release.id, version, sha256: hash });
  return jsonOk({ agreement_id: agreementId, version, status: "ready", document_url: `/api/nne/distribution/split-agreements/${encodeURIComponent(agreementId)}/document`, content_hash: hash }, 201);
}

async function sendAgreement(request, env, auth, releaseId, agreementId) {
  const assets = requireNneAssets(env);
  if (!assets.ok) return assets.response;
  const agreement = await env.DB.prepare("SELECT * FROM nne_distribution_split_agreements WHERE id=? AND release_id=? LIMIT 1").bind(agreementId, releaseId).first();
  if (!agreement?.id || !["ready", "failed"].includes(agreement.status)) return jsonError("nne_distribution_split_not_sendable", "Genera una versión lista antes de enviarla.", 409);
  const object = await env.BOOSTR_ASSETS.get(agreement.pdf_object_key);
  if (!object) return jsonError("nne_distribution_split_document_missing", "No encontramos el PDF privado.", 404);
  const signerRows = await env.DB.prepare("SELECT * FROM nne_distribution_split_signers WHERE agreement_id=? ORDER BY routing_order").bind(agreement.id).all();
  try {
    const release = await loadDistributionRelease(env, agreement.release_id);
    const rowCount = (release?.tracks || []).reduce((sum, track) => sum + 1 + track.splits.length, 0);
    const signaturePage = Math.ceil(Math.max(1, rowCount) / 22) + 1;
    const result = await sendDocusignEnvelope(env, agreement, new Uint8Array(await object.arrayBuffer()), signerRows.results || [], signaturePage);
    await env.DB.batch([
      env.DB.prepare("UPDATE nne_distribution_split_agreements SET status='sent',provider='docusign',external_envelope_id=?,external_status=?,sent_at=?,updated_at=? WHERE id=?")
        .bind(result.envelopeId, result.status || "sent", now(), now(), agreement.id),
      env.DB.prepare("UPDATE nne_distribution_split_signers SET status='sent' WHERE agreement_id=?").bind(agreement.id)
    ]);
    await writeNneAudit(env, request, auth.user.id, "distribution.split_agreement_sent", "nne_distribution_split_agreement", agreement.id, { envelope_id: result.envelopeId });
    return jsonOk({ agreement_id: agreement.id, envelope_id: result.envelopeId, status: "sent" });
  } catch (error) {
    await env.DB.prepare("UPDATE nne_distribution_split_agreements SET status='failed',external_status=?,updated_at=? WHERE id=?").bind(clean(error?.message, 500), now(), agreement.id).run();
    return jsonError("nne_distribution_docusign_send_failed", clean(error?.message, 500) || "DocuSign no aceptó el envío.", 502);
  }
}

async function refreshAgreement(request, env, auth, releaseId, agreementId) {
  const assets = requireNneAssets(env);
  if (!assets.ok) return assets.response;
  const agreement = await env.DB.prepare("SELECT * FROM nne_distribution_split_agreements WHERE id=? AND release_id=? LIMIT 1").bind(agreementId, releaseId).first();
  if (!agreement?.external_envelope_id) return jsonError("nne_distribution_docusign_envelope_missing", "Este acuerdo todavía no fue enviado.", 409);
  try {
    const remote = await getDocusignEnvelope(env, agreement.external_envelope_id);
    const status = remote.status === "completed" ? "completed" : remote.status === "declined" ? "declined" : remote.status === "sent" || remote.status === "delivered" ? "sent" : agreement.status;
    let executedKey = agreement.executed_pdf_object_key || null;
    if (status === "completed" && !executedKey) {
      const executed = await downloadDocusignEnvelopePdf(env, agreement.external_envelope_id);
      executedKey = `nne/distribution/agreements/${agreement.release_id}/executed-${agreement.id}.pdf`;
      await env.BOOSTR_ASSETS.put(executedKey, executed, { httpMetadata: { contentType: "application/pdf" }, customMetadata: { agreementId: agreement.id, envelopeId: agreement.external_envelope_id } });
    }
    await env.DB.batch([
      env.DB.prepare("UPDATE nne_distribution_split_agreements SET status=?,external_status=?,executed_pdf_object_key=?,completed_at=?,updated_at=? WHERE id=?")
        .bind(status, remote.status || null, executedKey, status === "completed" ? now() : agreement.completed_at, now(), agreement.id),
      env.DB.prepare("UPDATE nne_distribution_split_signers SET status=?,signed_at=? WHERE agreement_id=?")
        .bind(status === "completed" ? "signed" : "sent", status === "completed" ? now() : null, agreement.id)
    ]);
    await writeNneAudit(env, request, auth.user.id, "distribution.split_agreement_refreshed", "nne_distribution_split_agreement", agreement.id, { remote_status: remote.status });
    return jsonOk({ agreement_id: agreement.id, status, external_status: remote.status });
  } catch (error) { return jsonError("nne_distribution_docusign_refresh_failed", clean(error?.message, 500) || "No pudimos consultar DocuSign.", 502); }
}
