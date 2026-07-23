import type { FeedItem } from "../types";
import { apiRequest } from "./api";
import { mapFeed } from "./mappers";

export const feedService = {
  async list(limit = 30): Promise<FeedItem[]> {
    const result = await apiRequest<any>(`/feed?limit=${limit}`);
    return (result.items || []).map(mapFeed);
  }
};
