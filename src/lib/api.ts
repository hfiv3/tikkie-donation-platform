import { API_URL } from "./constants";
import type {
  Stats,
  Donation,
  DonationRequest,
  DonationResponse,
} from "./types";

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Onbekende fout" }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export function getStats(): Promise<Stats> {
  return fetchJson("/api/stats");
}

export function getDonations(limit = 20): Promise<Donation[]> {
  return fetchJson(`/api/donations?limit=${limit}`);
}

export function createDonation(data: DonationRequest): Promise<DonationResponse> {
  return fetchJson("/api/donations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
