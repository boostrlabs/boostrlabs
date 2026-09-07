import { clean, jsonError, jsonOk, now } from "../../../_lib/nne-api.js";
import { downloadDocusignEnvelopePdf } from "../../../_lib/nne-esign-provider.js";
import { requireNneAssets } from "../../../_lib/nne-secure-media.js";

const encoder = new TextEncoder();
const timingSafeEqual = (left, right) => {
  if (left.length !== right.length || !left.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
};

async function validHmac(raw, supplied, secret) {
  if (!supplied || !secret) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(raw)));
  let binary = "";
  for (let index = 0; index < digest.length; index += 1) binary += String.fromCharCode(digest[index]);
  return timingSafeEqual(btoa(binary), supplied.trim());
}

const localStatus = (event, remoteStatus, current) => {
  const value = `${event} ${remoteStatus}`.toLowerCase();
  if (value.includes("completed")) return "completed";
  if (value.includes("declined")) return "declined";
  if (value.includes("void")) return "voided";
  if (value.includes("sent") || value.includes("delivered")) return "sent";
  return current;
};

async function archiveExecutedPdf(env, agreement) {
  if (agreement.executed_pdf_object_key) return agreement.executed_pdf_object_key;
  const assets = requireNneAssets(env);
  if (!assets.ok) throw new Error("Private storage is unavailable");
  const bytes = await downloadDocusignEnvelopePdf(env, agreement.external_envelope_id);
  const key = `nne/distribution/agreements/${agreement.release_id}/executed-${agreement.id}.pdf`;
  await env.BOOSTR_ASSETS.put(key, bytes, {
    httpMetadata: { contentType: "application/pdf" },
    customMetadata: { agreementId: agreement.id, envelopeId: agreement.external_envelope_id }
  });
  await env.DB.prepare("UPDATE nne_distribution_split_agreements SET executed_pdf_object_key=?,updated_at=? WHERE id=?")
    .bind(key, now(), agreement.id).run();
  return key;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.NNE_DOCUSIGN_HMAC_SECRET) return jsonError("nne_docusign_webhook_unconfigured", "Webhook de DocuSign no configurado.", 503);
  const raw = await request.text();
  const signatures = [...request.headers.entries()]
    .filter(([name]) => /^x-docusign-signature-\d+$/i.test(name))
    .map(([, value]) => value);
  let authenticated = false;
  for (const signature of signatures) {
    if (await validHmac(raw, signature, env.NNE_DOCUSIGN_HMAC_SECRET)) { authenticated = true; break; }
  }
  if (!authenticated) return jsonError("nne_docusign_webhook_signature", "Firma de DocuSign inválida.", 401);

  let payload;
  try { payload = JSON.parse(raw); }
  catch { return jsonError("nne_docusign_webhook_json", "Payload de DocuSign inválido.", 400); }

  const envelopeId = clean(payload?.data?.envelopeId || payload?.data?.envelopeSummary?.envelopeId, 120);
  const event = clean(payload?.event || payload?.data?.envelopeSummary?.status, 100);
  const generatedAt = clean(payload?.generatedDateTime, 80);
  if (!envelopeId || !event) return jsonError("nne_docusign_webhook_payload", "El evento no incluye envelopeId o estado.", 400);
  const agreement = await env.DB.prepare("SELECT * FROM nne_distribution_split_agreements WHERE external_envelope_id=? LIMIT 1")
    .bind(envelopeId).first();
  const eventId = clean(payload?.uri || `${envelopeId}:${event}:${generatedAt || crypto.randomUUID()}`, 240);
  const eventRowId = `dist_esign_${crypto.randomUUID().replaceAll("-", "")}`;
  const retainedPayload = JSON.stringify({ event, envelope_id: envelopeId, generated_at: generatedAt || null });
  const inserted = await env.DB.prepare(
    "INSERT OR IGNORE INTO nne_distribution_esign_events (id,provider,external_event_id,agreement_id,event_type,payload_json,received_at) VALUES (?,'docusign',?,?,?,?,?)"
  ).bind(eventRowId, eventId, agreement?.id || null, event, retainedPayload, now()).run();
  if (!inserted.meta?.changes) return jsonOk({ accepted: true, duplicate: true });
  if (!agreement?.id) return jsonOk({ accepted: true, matched: false });

  const remoteStatus = clean(payload?.data?.envelopeSummary?.status || event, 80);
  const status = localStatus(event, remoteStatus, agreement.status);
  await env.DB.batch([
    env.DB.prepare("UPDATE nne_distribution_split_agreements SET status=?,external_status=?,completed_at=?,updated_at=? WHERE id=?")
      .bind(status, remoteStatus, status === "completed" ? now() : agreement.completed_at, now(), agreement.id),
    env.DB.prepare("UPDATE nne_distribution_split_signers SET status=?,signed_at=? WHERE agreement_id=?")
      .bind(status === "completed" ? "signed" : status === "declined" ? "declined" : "sent", status === "completed" ? now() : null, agreement.id),
    env.DB.prepare("UPDATE nne_distribution_esign_events SET processed_at=? WHERE id=?").bind(now(), eventRowId)
  ]);
  if (status === "completed") context.waitUntil(archiveExecutedPdf(env, agreement));
  return jsonOk({ accepted: true, matched: true, agreement_id: agreement.id, status });
}
