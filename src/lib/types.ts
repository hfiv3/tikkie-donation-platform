export interface Donation {
  id: number;
  name: string;
  amount: number; // in cents
  message: string | null;
  created_at: string;
}

export interface Stats {
  totalRaised: number; // in cents
  donationCount: number;
  goal: number; // in cents
  deadline: string | null;
  campaignName: string | null;
  popularAmount: number | null; // in cents
}

export interface DonationRequest {
  name?: string;
  amount: number; // in cents
  message?: string;
  wantsInvoice?: boolean;
  companyName?: string;
  companyAddress?: string;
  companyPostcode?: string;
  companyCity?: string;
  companyKvk?: string;
  companyBtw?: string;
  companyEmail?: string;
}

export interface DonationResponse {
  id: number;
  tikkieUrl: string;
}

export interface ApiError {
  error: string;
}
