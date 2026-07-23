import type { Quest } from "../types";
import { apiRequest } from "./api";
import { mapQuest } from "./mappers";

export interface QuestStartResult {
  attempt: { id: string; status: string; unlock_at: string | null };
  trivia_session: { id: string; status: string; unlock_at: string; expires_at: string } | null;
  next_action: string;
}

export const questsService = {
  async list(): Promise<Quest[]> {
    const result = await apiRequest<any>("/quests");
    return (result.quests || []).map(mapQuest);
  },
  async start(questId: string): Promise<QuestStartResult> {
    return apiRequest<QuestStartResult & { ok: true }>(`/quests/${encodeURIComponent(questId)}/start`, {
      method: "POST"
    });
  },
  async submitEvidence(questId: string, file: File, note = "") {
    const body = new FormData();
    body.set("evidence", file);
    if (note) body.set("note", note);
    return apiRequest(`/quests/${encodeURIComponent(questId)}/evidence`, {
      method: "POST",
      body
    });
  }
};
