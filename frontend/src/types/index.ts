// ---------------------------------------------------------------------------
// Domain types — mirror the FastAPI response schemas
// ---------------------------------------------------------------------------

export type UserRole = "free" | "member" | "admin";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

export type PaymentStatus = "pending" | "complete" | "failed" | "cancelled";

export interface CheckoutResponse {
  payment_id: number;
  invoice_id: string;
  checkout_url: string;
  amount: string;
  currency: string;
}

export interface PaymentStatusResponse {
  payment_id: number;
  invoice_id: string | null;
  status: PaymentStatus;
  amount: string;
  currency: string;
}

// ---------------------------------------------------------------------------
// KYC
// ---------------------------------------------------------------------------

export type KycStatus = "not_started" | "pending" | "verified" | "action_required";

export interface KycStatusResponse {
  status: KycStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Coaching resources
// ---------------------------------------------------------------------------

export interface CoachingResource {
  id: number;
  title: string;
  category: string;
  description: string;
}

// ---------------------------------------------------------------------------
// API error shape
// ---------------------------------------------------------------------------

export interface ApiError {
  detail: string | { msg: string; type: string }[];
}
