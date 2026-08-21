import { apiRequest } from "./api";

export interface EconomicBeat {
  id: string;
  title: string;
  producer_name: string;
  username: string;
  bpm: number | null;
  musical_key: string | null;
  tags: string | null;
  preview_url: string | null;
  artwork_url: string | null;
  lease_price_cents: number | null;
  exclusive_price_cents: number | null;
  westdetro_status: string;
}

export interface EconomicService {
  id: string;
  title: string;
  category: string;
  description: string;
  price_cents: number;
  delivery_days: number;
  revisions: number;
  username: string;
}

export interface EconomicJob {
  id: string;
  title: string;
  category: string;
  description: string;
  budget_type: "usd" | "nne" | "mixed";
  budget_amount: number;
  deadline_at: string | null;
  username: string;
}

export interface AcademyItem {
  id: string;
  title: string;
  category: string;
  description: string;
  cost_credits: number;
  preview_url: string | null;
}

export interface EconomicOsData {
  beats: EconomicBeat[];
  services: EconomicService[];
  jobs: EconomicJob[];
  academy: AcademyItem[];
  wallet: { available_cents: number; lifetime_cents: number; currency: string; cashout_source: string };
  mine: { beats: Array<{ id:string; title:string; westdetro_status:string; marketplace_status:string; created_at:string }>; services: Array<{ id:string; title:string; status:string; created_at:string }> };
  economics: { nne_credits_purchasable:boolean; nne_credits_cashout:boolean; seller_earnings_cashout:boolean; event_cashback_percent:number };
}

export const economicOsService = {
  get: () => apiRequest<EconomicOsData>("/economic-os"),
  submitBeat: (payload: Record<string, unknown>) => apiRequest<{ id:string; status:string; westdetro_status:string }>("/economic-os", { method:"POST", body:JSON.stringify({ action:"submit_beat", ...payload }) }),
  submitService: (payload: Record<string, unknown>) => apiRequest<{ id:string; status:string }>("/economic-os", { method:"POST", body:JSON.stringify({ action:"submit_service", ...payload }) }),
  postJob: (payload: Record<string, unknown>) => apiRequest<{ id:string; status:string }>("/economic-os", { method:"POST", body:JSON.stringify({ action:"post_job", ...payload }) })
};
