import type { TriviaQuestion, TriviaSession } from "../types";
import { apiRequest } from "./api";

export const triviaService = {
  async get(sessionId: string): Promise<{ session: TriviaSession; questions: TriviaQuestion[] }> {
    const result = await apiRequest<any>(`/trivia/${encodeURIComponent(sessionId)}`);
    const row = result.trivia_session;
    return {
      session: {
        id: row.id,
        status: row.status,
        unlockAt: row.unlock_at,
        expiresAt: row.expires_at,
        score: row.score == null ? null : Number(row.score)
      },
      questions: result.questions || []
    };
  },
  async submit(sessionId: string, answers: Record<string, string>) {
    const result = await apiRequest<any>(`/trivia/${encodeURIComponent(sessionId)}`, {
      method: "POST",
      body: JSON.stringify({ answers })
    });
    return result.result as {
      passed: boolean;
      score: number;
      correct: number;
      total: number;
      reward_credits: number;
    };
  }
};
