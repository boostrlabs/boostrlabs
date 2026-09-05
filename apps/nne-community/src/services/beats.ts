import type { Beat } from "../types";
import { apiRequest } from "./api";

type RawBeat = Record<string, unknown>;

const mapBeat = (row: RawBeat): Beat => ({
  id: String(row.id),
  slug: String(row.slug),
  title: String(row.title),
  producerName: String(row.producer_name),
  description: String(row.description || ""),
  bpm: row.bpm == null ? null : Number(row.bpm),
  musicalKey: row.musical_key ? String(row.musical_key) : null,
  saleMode: row.sale_mode as Beat["saleMode"],
  leasePriceCredits: row.lease_price_credits == null ? null : Number(row.lease_price_credits),
  exclusivePriceCredits: row.exclusive_price_credits == null ? null : Number(row.exclusive_price_credits),
  artworkUrl: row.artwork_url ? String(row.artwork_url) : null,
  streamReady: Boolean(row.stream_ready),
  available: Boolean(row.available),
  license: row.license_id ? {
    id: String(row.license_id),
    licenseType: row.license_type as "lease" | "exclusive",
    licenseNumber: String(row.license_number),
    licensedAt: String(row.licensed_at)
  } : null
});

export const beatsService = {
  async list(): Promise<Beat[]> {
    const result = await apiRequest<{ beats: RawBeat[] }>("/beats");
    return (result.beats || []).map(mapBeat);
  },
  createListenSession: (beatId: string) => apiRequest<{ stream_url: string; expires_at: string }>(
    `/beats/${encodeURIComponent(beatId)}/listen-session`, { method: "POST" }
  ),
  purchase: (beatId: string, licenseType: "lease" | "exclusive") => apiRequest<{
    license: { id: string; license_number: string };
  }>(`/beats/${encodeURIComponent(beatId)}/purchase`, {
    method: "POST",
    body: JSON.stringify({ license_type: licenseType })
  }),
  createDownloadSession: (beatId: string) => apiRequest<{ download_url: string; expires_at: string }>(
    `/beats/${encodeURIComponent(beatId)}/download-session`, { method: "POST" }
  )
};
