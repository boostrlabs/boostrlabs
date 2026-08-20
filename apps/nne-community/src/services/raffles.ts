import type { RaffleCampaign } from "../types";
import { apiRequest } from "./api";

export const rafflesService = {
  async list(): Promise<{ raffles: RaffleCampaign[] }> {
    const response = await apiRequest<{ raffles: RaffleCampaign[] }>("/raffles");
    return { raffles: response.raffles || [] };
  }
};
