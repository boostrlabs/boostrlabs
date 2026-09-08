import { apiRequest } from "./api";
import type { DistributionArtist, DistributionComplianceProfile, DistributionFinance, DistributionRelease, DistributionSplitAgreement } from "../types";

export interface DistributionIndex {
  releases: Array<DistributionRelease & { track_count: number; master_count: number; delivery_count: number; readiness_score: number }>;
  artists: DistributionArtist[];
  metrics: { total: number; in_review: number; approved: number; delivered: number };
  role: string;
  provider: {
    key: string;
    name: string;
    mode: "sandbox" | "white_label" | "direct_deal";
    status: "sandbox" | "configuration_required" | "connected" | "paused";
    ready: boolean;
    capabilities: Record<string, boolean>;
  };
}

export const distributionService = {
  list: () => apiRequest<DistributionIndex & { ok: true }>("/distribution/releases"),
  get: (id: string) => apiRequest<{ ok: true; release: DistributionRelease }>(`/distribution/releases/${encodeURIComponent(id)}`),
  create: (payload: { artist_id: string; title: string; release_type: string }) =>
    apiRequest<{ ok: true; release: DistributionRelease }>("/distribution/releases", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Record<string, unknown>) =>
    apiRequest<{ ok: true; release: DistributionRelease }>(`/distribution/releases/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteRelease: (id: string) =>
    apiRequest<{ ok: true; deleted: true; release_id: string }>(`/distribution/releases/${encodeURIComponent(id)}`, { method: "DELETE" }),
  addTrack: (id: string, title: string) =>
    apiRequest<{ ok: true; release: DistributionRelease }>(`/distribution/releases/${encodeURIComponent(id)}/tracks`, { method: "POST", body: JSON.stringify({ title }) }),
  deleteTrack: (trackId: string) =>
    apiRequest<{ ok: true; release: DistributionRelease }>(`/distribution/tracks/${encodeURIComponent(trackId)}`, { method: "DELETE" }),
  uploadAsset: (releaseId: string, kind: "artwork" | "master", file: File, trackId = "") =>
    apiRequest<{ ok: true; release: DistributionRelease }>(
      `/distribution/releases/${encodeURIComponent(releaseId)}/assets?kind=${kind}${trackId ? `&track_id=${encodeURIComponent(trackId)}` : ""}`,
      { method: "PUT", headers: {
        "Content-Type": file.type || (file.name.toLowerCase().endsWith(".wav") ? "audio/wav" : file.name.toLowerCase().endsWith(".flac") ? "audio/flac" : "application/octet-stream"),
        "X-File-Name": file.name
      }, body: file }
    ),
  uploadMasterMultipart: async (releaseId: string, trackId: string, file: File, onProgress?: (percent: number) => void) => {
    const format = file.name.toLowerCase().endsWith(".flac") ? "flac" : "wav";
    const base = `/distribution/releases/${encodeURIComponent(releaseId)}/assets?kind=master&track_id=${encodeURIComponent(trackId)}&format=${format}`;
    const created = await apiRequest<{ ok: true; upload_id: string }>(`${base}&action=mpu-create`, {
      method: "POST",
      headers: { "X-File-Name": file.name, "X-File-Size": String(file.size) }
    });
    const parts: Array<{ partNumber: number; etag: string }> = [];
    const chunkSize = 20 * 1024 * 1024;
    try {
      for (let offset = 0, partNumber = 1; offset < file.size; offset += chunkSize, partNumber += 1) {
        const chunk = file.slice(offset, Math.min(offset + chunkSize, file.size));
        let uploaded: { ok: true; partNumber: number; etag: string } | undefined;
        for (let attempt = 1; attempt <= 3 && !uploaded; attempt += 1) {
          try {
            uploaded = await apiRequest<{ ok: true; partNumber: number; etag: string }>(`${base}&action=mpu-uploadpart&upload_id=${encodeURIComponent(created.upload_id)}&part_number=${partNumber}`, {
              method: "PUT", headers: { "Content-Type": "application/octet-stream" }, body: chunk
            });
          } catch (error) { if (attempt === 3) throw error; }
        }
        parts.push({ partNumber: uploaded!.partNumber, etag: uploaded!.etag });
        onProgress?.(Math.min(99, Math.round((Math.min(offset + chunkSize, file.size) / file.size) * 100)));
      }
      const complete = await apiRequest<{ ok: true; release: DistributionRelease }>(`${base}&action=mpu-complete&upload_id=${encodeURIComponent(created.upload_id)}`, {
        method: "POST", body: JSON.stringify({ parts, original_name: file.name })
      });
      onProgress?.(100);
      return complete;
    } catch (error) {
      await apiRequest(`${base}&action=mpu-abort&upload_id=${encodeURIComponent(created.upload_id)}`, { method: "DELETE" }).catch(() => undefined);
      throw error;
    }
  },
  submit: (id: string) =>
    apiRequest<{ ok: true; release: DistributionRelease }>(`/distribution/releases/${encodeURIComponent(id)}/submit`, { method: "POST" }),
  review: (id: string, action: "approve" | "request_changes" | "package" | "deliver" | "mark_live_demo" | "send_takedown", note = "") =>
    apiRequest<{ ok: true; release: DistributionRelease }>(`/distribution/releases/${encodeURIComponent(id)}/review`, { method: "POST", body: JSON.stringify({ action, note }) }),
  requestTakedown: (id: string, reason: string) =>
    apiRequest<{ ok: true; release: DistributionRelease }>(`/distribution/releases/${encodeURIComponent(id)}/takedown`, { method: "POST", body: JSON.stringify({ reason }) }),
  finance: () => apiRequest<DistributionFinance & { ok: true }>("/distribution/finance"),
  simulateSplit: (payload: { release_id: string; track_id: string; currency: string; net_micros: number }) =>
    apiRequest<{ ok: true; release_id: string; track_id: string; track_title: string; currency: string; net_micros: number; deal_model: string; artist_pool_micros: number; label_amount_micros: number; allocations: Array<{ beneficiary_type: "participant" | "label"; name: string; email?: string | null; split_bps: number; amount_micros: number }>; agreement?: { id: string; version: number; status: string } | null; settlement_ready: boolean }>("/distribution/finance", { method: "POST", body: JSON.stringify({ action: "simulate_split", ...payload }) }),
  tiktokClips: (releaseId: string) => apiRequest<{ ok: true; requests: Array<{ id: string; track_id: string; track_title: string; start_seconds: number; duration_seconds: number; label: string; status: "requested" | "provider_review" | "approved" | "rejected" | "delivered"; provider_reference?: string | null; created_at: string }>; policy: string }>(`/distribution/tiktok-clips?release_id=${encodeURIComponent(releaseId)}`),
  requestTiktokClip: (payload: { track_id: string; start_seconds: number; duration_seconds: number; label: string }) => apiRequest<{ ok: true; request_id: string; status: string }>("/distribution/tiktok-clips", { method: "POST", body: JSON.stringify({ action: "request", ...payload }) }),
  reviewTiktokClip: (request_id: string, status: "provider_review" | "approved" | "rejected" | "delivered", provider_reference = "") => apiRequest<{ ok: true; request_id: string; status: string }>("/distribution/tiktok-clips", { method: "POST", body: JSON.stringify({ action: "review", request_id, status, provider_reference }) }),
  compliance: () => apiRequest<{ ok: true; profiles: DistributionComplianceProfile[]; guidance: { payer_country: string; stores_sensitive_tax_ids: boolean; disclaimer: string } }>("/distribution/compliance"),
  saveCompliance: (payload: { artist_id: string; legal_name: string; entity_type: "individual" | "business"; tax_residency_country: string; address_country: string; payout_method?: string; payout_destination_hint?: string }) =>
    apiRequest<{ ok: true; profile_id: string; tax_form_type: string; tax_status: string }>("/distribution/compliance", { method: "PATCH", body: JSON.stringify(payload) }),
  uploadTaxDocument: (artistId: string, file: File) => apiRequest<{ ok: true; profile_id: string; tax_status: string; document_uploaded: boolean }>(`/distribution/compliance?artist_id=${encodeURIComponent(artistId)}`, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file }),
  taxDocumentUrl: (artistId: string) => `/api/nne/distribution/compliance/${encodeURIComponent(artistId)}/document`,
  reviewCompliance: (artist_id: string, decision: "verified" | "rejected", note = "") =>
    apiRequest<{ ok: true; profile_id: string; tax_status: string }>("/distribution/compliance", { method: "POST", body: JSON.stringify({ artist_id, decision, note }) }),
  splitAgreements: (releaseId: string) => apiRequest<{ ok: true; agreements: DistributionSplitAgreement[]; provider: { key: string; ready: boolean; mode: string } }>(`/distribution/split-agreements?release_id=${encodeURIComponent(releaseId)}`),
  checkDocusign: () => apiRequest<{ ok: true; checked_at: string; provider: { connected: boolean; ready: boolean; authentication: "jwt"; environment: "demo" | "production"; account_id_match: boolean; base_uri_match: boolean; webhooks_ready: boolean; hmac_key_count: number | null; callback_url: string | null } }>("/distribution/docusign-health"),
  generateSplitAgreement: (release_id: string) => apiRequest<{ ok: true; agreement_id: string; version: number; status: string; document_url: string; content_hash: string }>("/distribution/split-agreements", { method: "POST", body: JSON.stringify({ action: "generate", release_id }) }),
  sendSplitAgreement: (release_id: string, agreement_id: string) => apiRequest<{ ok: true; agreement_id: string; envelope_id: string; status: string }>("/distribution/split-agreements", { method: "POST", body: JSON.stringify({ action: "send", release_id, agreement_id }) }),
  refreshSplitAgreement: (release_id: string, agreement_id: string) => apiRequest<{ ok: true; agreement_id: string; status: string; external_status: string }>("/distribution/split-agreements", { method: "POST", body: JSON.stringify({ action: "refresh", release_id, agreement_id }) }),
  importStatement: (payload: {
    provider_key: string;
    external_statement_id: string;
    period_start: string;
    period_end: string;
    currency: string;
    lines: Array<Record<string, string | number | null>>;
  }) => apiRequest<{ ok: true; statement_id: string; line_count: number; net_micros: number }>("/distribution/finance", {
    method: "POST",
    body: JSON.stringify({ action: "import_statement", ...payload })
  }),
  requestPayout: (payload: { artist_id: string; currency: string; amount_micros: number; method: string; destination_hint?: string }) =>
    apiRequest<{ ok: true; payout_id: string; status: string }>("/distribution/finance", { method: "POST", body: JSON.stringify({ action: "request_payout", ...payload }) }),
  updatePayout: (payout_id: string, status: "approved" | "processing" | "paid" | "failed" | "cancelled") =>
    apiRequest<{ ok: true; payout_id: string; status: string }>("/distribution/finance", { method: "POST", body: JSON.stringify({ action: "update_payout", payout_id, status }) }),
  createArtist: (payload: { name: string; instagram_handle?: string; country_code?: string; primary_genre?: string }) =>
    apiRequest<{ ok: true; artist: DistributionArtist }>("/distribution/artists", { method: "POST", body: JSON.stringify(payload) }),
  updateArtist: (payload: { artist_id: string; name: string; instagram_handle?: string; country_code?: string; primary_genre?: string; spotify_artist_id?: string; apple_music_artist_id?: string }) =>
    apiRequest<{ ok: true; artist: DistributionArtist }>("/distribution/artists", { method: "PATCH", body: JSON.stringify(payload) }),
  createInvite: (payload: { artist_id: string; email?: string; username?: string; role: "artist" | "manager" }) =>
    apiRequest<{ ok: true; invite: { id: string; artist_name: string; role: string; expires_at: string; invite_url: string } }>("/distribution/invites", { method: "POST", body: JSON.stringify(payload) })
};
