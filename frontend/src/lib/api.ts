/**
 * Kilele Bridge — centralised API client.
 *
 * - BASE_URL is /api/v1 in production (same-origin, baked at build time)
 *   and http://127.0.0.1:8000/api/v1 in local dev via .env.local
 * - JWT Bearer token is attached from a Secure SameSite=Strict cookie
 * - All HTTP errors are normalised to plain Error objects
 * - Sensitive values (tokens, secrets) are never logged
 */
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import type {
  AdminMembersResponse,
  AuthTokenResponse,
  CheckoutResponse,
  CoachingResource,
  KycStatusResponse,
  PaymentStatusResponse,
  User,
} from "@/types";

// ---------------------------------------------------------------------------
// Token store — Secure, SameSite=Strict cookie
// ---------------------------------------------------------------------------
const TOKEN_KEY = "kb_access_token";

export const tokenStore = {
  get: (): string | undefined => Cookies.get(TOKEN_KEY),
  set: (token: string) =>
    Cookies.set(TOKEN_KEY, token, {
      expires: 1 / 24, // 1 hour — matches JWT lifetime
      secure:
        typeof window !== "undefined"
          ? window.location.protocol === "https:"
          : false,
      sameSite: "strict",
    }),
  remove: () => Cookies.remove(TOKEN_KEY),
};

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// Attach Bearer token on every request
http.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise errors — re-throw as plain Error so callers don't import AxiosError
http.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ detail: unknown }>) => {
    const detail = err.response?.data?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
        ? (detail as { msg: string }[]).map((d) => d.msg).join(", ")
        : err.message ?? "An unexpected error occurred.";
    throw new Error(message);
  }
);

// ---------------------------------------------------------------------------
// Config — public runtime values from the backend
// ---------------------------------------------------------------------------
export interface AppConfig {
  registration_fee_kes: number;
  currency: string;
}

let _cachedConfig: AppConfig | null = null;

export const configApi = {
  /**
   * Fetch server-side config values (registration fee, etc.).
   * Results are cached for the lifetime of the page so we only hit the
   * endpoint once per load.
   */
  get: async (): Promise<AppConfig> => {
    if (_cachedConfig) return _cachedConfig;
    const { data } = await http.get<AppConfig>("/config");
    _cachedConfig = data;
    return data;
  },
};

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------
export const authApi = {
  register: async (payload: {
    full_name: string;
    email: string;
    phone_number: string;
    password: string;
  }): Promise<User> => {
    const { data } = await http.post<User>("/auth/register", payload);
    return data;
  },

  login: async (payload: {
    email: string;
    password: string;
  }): Promise<AuthTokenResponse> => {
    const { data } = await http.post<AuthTokenResponse>("/auth/login", payload);
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await http.get<User>("/auth/me");
    return data;
  },
};

// ---------------------------------------------------------------------------
// Payment endpoints
// ---------------------------------------------------------------------------
export const paymentApi = {
  /** Initiate M-PESA STK push and create a payment record. */
  initiate: async (payload: { phone_number: string }): Promise<CheckoutResponse> => {
    const { data } = await http.post<CheckoutResponse>("/payments/initiate", payload);
    return data;
  },

  /**
   * Return the current user's most recent payment.
   * Returns null (not throws) when no payment record exists yet.
   */
  getMy: async (): Promise<PaymentStatusResponse | null> => {
    try {
      const { data } = await http.get<PaymentStatusResponse>("/payments/my");
      return data;
    } catch (err) {
      if (err instanceof Error && err.message.includes("No payment record")) {
        return null;
      }
      throw err;
    }
  },

  /** Poll a specific payment by ID. */
  getStatus: async (paymentId: number): Promise<PaymentStatusResponse> => {
    const { data } = await http.get<PaymentStatusResponse>(
      `/payments/status/${paymentId}`
    );
    return data;
  },
};

// ---------------------------------------------------------------------------
// KYC endpoints
// ---------------------------------------------------------------------------
export const kycApi = {
  /**
   * Fetch KYC status.
   * Returns a safe default when the endpoint is unreachable so the UI
   * degrades gracefully rather than throwing.
   */
  getStatus: async (): Promise<KycStatusResponse> => {
    try {
      const { data } = await http.get<KycStatusResponse>("/kyc/status");
      return data;
    } catch {
      // Backend KYC endpoint not yet available — return safe default
      return { status: "not_started", submitted_at: null, reviewed_at: null, notes: null };
    }
  },

  submit: async (frontFile: File, backFile: File): Promise<{ message: string }> => {
    const form = new FormData();
    form.append("id_front", frontFile);
    form.append("id_back", backFile);
    const { data } = await http.post<{ message: string }>("/kyc/submit", form, {
      headers: { "Content-Type": "multipart/form-data" },
    } as AxiosRequestConfig);
    return data;
  },
};

// ---------------------------------------------------------------------------
// Coaching endpoints
// ---------------------------------------------------------------------------
export const coachingApi = {
  listResources: async (): Promise<CoachingResource[]> => {
    const { data } = await http.get<{ resources: CoachingResource[] }>(
      "/coaching/resources"
    );
    return data.resources;
  },

  getResource: async (id: number): Promise<CoachingResource> => {
    const { data } = await http.get<CoachingResource>(
      `/coaching/resources/${id}`
    );
    return data;
  },
};

// ---------------------------------------------------------------------------
// Admin endpoints (admin role only)
// ---------------------------------------------------------------------------
export const adminApi = {
  listMembers: async (params?: {
    page?: number;
    page_size?: number;
    q?: string;
    sort_by?: string;
    order?: string;
  }): Promise<AdminMembersResponse> => {
    const { data } = await http.get<AdminMembersResponse>("/admin/members", {
      params,
    });
    return data;
  },
};
