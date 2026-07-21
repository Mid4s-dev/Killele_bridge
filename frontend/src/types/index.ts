// ---------------------------------------------------------------------------
// Domain types — mirror the FastAPI response schemas
// ---------------------------------------------------------------------------

export type UserRole = "free" | "member" | "vendor" | "admin";

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone_number?: string;
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
// Admin types
// ---------------------------------------------------------------------------

export interface AdminUserRow {
  id: number;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: string;
  is_active: boolean;
  kyc_status: string;
  created_at: string;
  updated_at: string;
  latest_payment_status: string | null;
  latest_payment_amount: string | null;
  latest_payment_date: string | null;
}

export interface AdminMembersResponse {
  users: AdminUserRow[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ---------------------------------------------------------------------------
// Marketplace types
// ---------------------------------------------------------------------------

export type ListingCategory = "account_sale" | "task" | "service" | "other";
export type ListingStatus = "active" | "paused" | "closed" | "sold";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface Listing {
  id: number;
  vendor_id: number;
  vendor_name: string;
  title: string;
  description: string;
  category: ListingCategory;
  price: string | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  application_count: number;
}

export interface ListingsPageResponse {
  listings: Listing[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Application {
  id: number;
  listing_id: number;
  applicant_id: number;
  applicant_name: string;
  applicant_email: string;
  message: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Training Academy types
// ---------------------------------------------------------------------------

export type CourseProgressStatus = "not_started" | "in_progress" | "completed";

export interface CourseProgress {
  id: number;
  user_id: number;
  course_id: string;
  status: CourseProgressStatus;
  percent_complete: number;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface CourseDetail {
  course_id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  status: CourseProgressStatus;
  percent_complete: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface AcademyDashboard {
  courses: CourseDetail[];
  total_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  overall_percent: number;
}

// ---------------------------------------------------------------------------
// API error shape
// ---------------------------------------------------------------------------

export interface ApiError {
  detail: string | { msg: string; type: string }[];
}
