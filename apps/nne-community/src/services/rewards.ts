import type { Reward } from "../types";
import { apiRequest } from "./api";
import { mapReward } from "./mappers";

export const rewardsService = {
  async list(): Promise<{ rewards: Reward[]; credits: number; level: number }> {
    const result = await apiRequest<any>("/rewards");
    return {
      rewards: (result.rewards || []).map(mapReward),
      credits: Number(result.credits || 0),
      level: Number(result.level || 1)
    };
  },
  async redeem(rewardId: string) {
    return apiRequest<any>(`/rewards/${encodeURIComponent(rewardId)}/redeem`, { method: "POST" });
  }
};
