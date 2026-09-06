import { apiRequest } from "./api";
import type { DistributionArtist, DistributionFinance, DistributionRelease } from "../types";

export interface DistributionIndex {
  releases: Array<DistributionRelease & { track_count: number; master_count: number; delivery_count: number; readiness_score: number }>;
  artists: DistributionArtist[];
  metrics: { total: number; in_review: number; approved: number; delivered: number };
  role: string;
}

export const distributionService = {
  list: () => apiRequest<DistributionIndex & { ok: true }>("/distribution/releases"),
  get: (id: string) => apiRequest<{ ok: true; release: DistributionRelease }>(`/distribution/releases/${encodeURIComponent(id)}`),
  create: (payload: { artist_id: string; title: string; release_type: string }) =>
    apiRequest<{ ok: true; release: DistributionRelease }>("/distribution/releases", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Record<string, unknown>) =>
    apiRequest<{ ok: true; release: DistributionRelease }>(`/distribution/releases/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) }),
  addTrack: (id: string, title: string) =>
    apiRequest<{ ok: true; release: DistributionRelease }>(`/distribution/releases/${encodeURIComponent(id)}/tracks`, { method: "POST", body: JSON.stringify({ title }) }),
  deleteTrack: (trackId: string) =>
    apiRequest<{ ok: true; release: DistributionRelease }>(`/distribution/tracks/${encodeURIComponent(trackId)}`, { method: "DELETE" }),
  uploadAsset: (releaseId: string, kind: "artwork" | "master", file: File, trackId = "") =>
    apiRequest<{ ok: true; release: DistributionRelease }>(
      `/distribution/releases/${encodeURIComponent(releaseId)}/assets?kind=${kind}${trackId ? `&track_id=${encodeURIComponent(trackId)}` : ""}`,
      { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream", "X-File-Name": file.name }, body: file }
    ),
  submit: (id: string) =>
    apiRequest<{ ok: true; release: DistributionRelease }>(`/distribution/releases/${encodeURIComponent(id)}/submit`, { method: "POST" }),
  review: (id: string, action: "approve" | "request_changes" | "package" | "deliver" | "mark_live_demo", note = "") =>
    apiRequest<{ ok: true; release: DistributionRelease }>(`/distribution/releases/${encodeURIComponent(id)}/review`, { method: "POST", body: JSON.stringify({ action, note }) }),
  finance: () => apiRequest<DistributionFinance & { ok: true }>("/distribution/finance"),
  createInvite: (payload: { artist_id: string; email?: string; username?: string; role: "artist" | "manager" }) =>
    apiRequest<{ ok: true; invite: { id: string; artist_name: string; role: string; expires_at: string; invite_url: string } }>("/distribution/invites", { method: "POST", body: JSON.stringify(payload) })
};
