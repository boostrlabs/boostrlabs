import { apiRequest } from "./api";

export const reviewService = {
  evidence: () => apiRequest<any>("/review/evidence"),
  review: (
    attemptId: string,
    action: "approve" | "reject",
    quality: "completed" | "good" | "standout" | "exceptional" = "completed",
    performance: "normal" | "strong" | "breakout" | "viral" = "normal",
    reason = ""
  ) => apiRequest<any>(`/review/evidence/${encodeURIComponent(attemptId)}`, {
    method: "PATCH",
    body: JSON.stringify({ action, quality, performance, reason })
  })
};
