/**
 * Kilele Bridge — centralised API client.
 *
 * All requests go through this module so that:
 * - The base URL is set once from the environment
 * - The JWT Bearer token is attached automatically when present
 * - HTTP errors are normalised into a consistent ApiError shape
 * - Sensitive data (tokens, IDs) is never logged to the console
 */
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import type {
  AuthTokenResponse,
  CheckoutResponse,
  CoachingResource,
  KycStatusResponse,
  PaymentStatusResponse,
  User,
} from "@/types";

// ---------------------------------------------------------------------------
// Token helpers — stored in a Secure, SameSite=Strict cookie
// ---------------------------------------------------------------------------

const TOKEN_KEY = "kb_access_token";

export const tokenStore = {
  get: (): string | undefined => Cookies.get(TOKEN_KEY),
  set: (token: string) =>
    Cookies.set(TOKEN_KEY, token, {
      expires: 1 / 24,        // 1 hour — matches JWT lifetime
      secure: typeof window !== "undefined" ? window.location.protocol === "https:" : false,
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
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalise errors
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
    // Re-throw a plain Error so callers don't need to import AxiosError
    throw new Error(message);
  }
);

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export const authApi = {
  register: async (payload: {
    full_name: string;
    email: string;
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
  initiate: async (): Promise<CheckoutResponse> => {
    const { data } = await http.post<CheckoutResponse>("/payments/initiate");
    return data;
  },

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
  getStatus: async (): Promise<KycStatusResponse> => {
    const { data } = await http.get<KycStatusResponse>("/kyc/status");
    return data;
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
