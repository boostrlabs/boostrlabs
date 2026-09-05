import { apiRequest } from "./api";

export const adminService = {
  overview: () => apiRequest<any>("/admin/overview"),
  applications: (status = "pending") => apiRequest<any>(`/admin/applications?status=${status}`),
  reviewApplication: (id: string, action: "approve" | "reject", review_note = "") =>
    apiRequest<any>(`/admin/applications/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ action, review_note })
    }),
  evidence: (status = "pending") => apiRequest<any>(`/admin/evidence?status=${status}`),
  reviewEvidence: (
    attemptId: string,
    action: "approve" | "reject",
    reason = "",
    quality: "completed" | "good" | "standout" | "exceptional" = "completed",
    performance: "normal" | "strong" | "breakout" | "viral" = "normal"
  ) => apiRequest<any>(`/admin/evidence/${encodeURIComponent(attemptId)}`, {
    method: "PATCH",
    body: JSON.stringify({ action, reason, quality, performance })
  }),
  reviewers: () => apiRequest<any>("/admin/reviewers"),
  assignReviewer: (username: string, artist_slug: "janko" | "gemese" | "xiam") =>
    apiRequest<any>("/admin/reviewers", { method: "POST", body: JSON.stringify({ username, artist_slug }) }),
  quests: () => apiRequest<any>("/admin/quests"),
  createQuest: (payload: Record<string, unknown>) =>
    apiRequest<any>("/admin/quests", { method: "POST", body: JSON.stringify(payload) }),
  trivia: () => apiRequest<any>("/admin/trivia"),
  createTrivia: (payload: Record<string, unknown>) =>
    apiRequest<any>("/admin/trivia", { method: "POST", body: JSON.stringify(payload) }),
  rewards: () => apiRequest<any>("/admin/rewards"),
  createReward: (payload: Record<string, unknown>) =>
    apiRequest<any>("/admin/rewards", { method: "POST", body: JSON.stringify(payload) }),
  beats: () => apiRequest<any>("/admin/beats"),
  createBeat: (payload: Record<string, unknown>) =>
    apiRequest<any>("/admin/beats", { method: "POST", body: JSON.stringify(payload) }),
  uploadBeatAsset: (beatId: string, kind: "artwork" | "stream" | "master", file: File) =>
    apiRequest<any>(`/admin/beats/${encodeURIComponent(beatId)}/asset?kind=${kind}`, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file
    }),
  updateBeatStatus: (beatId: string, status: "draft" | "published" | "paused" | "archived") =>
    apiRequest<any>(`/admin/beats/${encodeURIComponent(beatId)}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
  redemptions: () => apiRequest<any>("/admin/redemptions"),
  updateRedemption: (id: string, status: string, fulfillment_note = "") =>
    apiRequest<any>(`/admin/redemptions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status, fulfillment_note })
    })
};
