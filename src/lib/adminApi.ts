import { API_URL } from "./constants";

let adminToken = "";

export function setAdminToken(token: string) {
  adminToken = token;
}

export function getAdminToken(): string {
  return adminToken;
}

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Onbekende fout" }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// --- Types ---

export interface AdminOverview {
  total_raised: number;
  donation_count: number;
}

export interface AdminDonation {
  id: number;
  name: string;
  amount: number;
  message: string | null;
  tikkie_status: string;
  tikkie_id: string | null;
  tikkie_url: string | null;
  created_at: string;
}

export interface AdminSettings {
  goal_cents: string;
  deadline: string;
  campaign_name: string;
}

// --- Settings ---

export function getSettings(): Promise<AdminSettings> {
  return adminFetch("/api/admin/settings");
}

export function updateSettings(
  data: Partial<Record<string, string>>
): Promise<{ success: boolean }> {
  return adminFetch("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// --- Overview ---

export function getOverview(): Promise<AdminOverview> {
  return adminFetch("/api/admin/overview");
}

// --- Donations ---

export function getDonations(): Promise<AdminDonation[]> {
  return adminFetch("/api/admin/donations");
}

export function deleteDonation(id: number): Promise<{ success: boolean }> {
  return adminFetch(`/api/admin/donations/${id}`, { method: "DELETE" });
}
