import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a KES amount for display */
export function formatKES(amount: string | number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

/** Human-readable KYC status labels */
export const KYC_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  not_started:     { label: "Not Started",      color: "text-muted-foreground" },
  pending:         { label: "Pending Review",    color: "text-yellow-600" },
  verified:        { label: "Verified",          color: "text-growth-600" },
  action_required: { label: "Action Required",   color: "text-destructive" },
};
