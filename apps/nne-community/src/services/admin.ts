import { apiRequest } from "./api";

export const adminService = {
  overview: () => apiRequest<any>("/admin/overview"),
  evidence: (status = "pending") => apiRequest<any>(`/admin/evidence?status=${status}`),
  reviewEvidence: (attemptId: string, action: "approve" | "reject", reason = "") =>
    apiRequest<any>(`/admin/evidence/${encodeURIComponent(attemptId)}`, {
      method: "PATCH",
      body: JSON.stringify({ action, reason })
    }),
  quests: () => apiRequest<any>("/admin/quests"),
  createQuest: (payload: Record<string, unknown>) =>
    apiRequest<any>("/admin/quests", { method: "POST", body: JSON.stringify(payload) }),
  trivia: () => apiRequest<any>("/admin/trivia"),
  createTrivia: (payload: Record<string, unknown>) =>
    apiRequest<any>("/admin/trivia", { method: "POST", body: JSON.stringify(payload) }),
  rewards: () => apiRequest<any>("/admin/rewards"),
  createReward: (payload: Record<string, unknown>) =>
    apiRequest<any>("/admin/rewards", { method: "POST", body: JSON.stringify(payload) }),
  redemptions: () => apiRequest<any>("/admin/redemptions"),
  updateRedemption: (id: string, status: string, fulfillment_note = "") =>
    apiRequest<any>(`/admin/redemptions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status, fulfillment_note })
    })
};
