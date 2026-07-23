import type { LeaderboardEntry } from "../types";
import { apiRequest } from "./api";
import { mapLeaderboard } from "./mappers";

export const leaderboardService = {
  async list(): Promise<LeaderboardEntry[]> {
    const result = await apiRequest<any>("/leaderboard");
    return (result.entries || []).map(mapLeaderboard);
  }
};
