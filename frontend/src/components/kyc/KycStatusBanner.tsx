"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileSearch,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KycStatus } from "@/types";

interface StatusConfig {
  icon: React.ElementType;
  title: string;
  description: string;
  containerClass: string;
  iconClass: string;
}

const STATUS_MAP: Record<KycStatus, StatusConfig> = {
  not_started: {
    icon: Info,
    title: "Identity Not Yet Verified",
    description:
      "Verify your identity to meet Kenya Data Protection Act requirements and unlock full platform access.",
    containerClass: "bg-brand-50 border-brand-200 text-brand-800",
    iconClass: "text-brand-500",
  },
  pending: {
    icon: Clock,
    title: "Pending Review",
    description:
      "Your documents have been received and are being reviewed by our compliance team. This typically takes 1–2 business days.",
    containerClass: "bg-yellow-50 border-yellow-200 text-yellow-800",
    iconClass: "text-yellow-500",
  },
  verified: {
    icon: CheckCircle2,
    title: "Identity Verified",
    description:
      "Your identity has been successfully verified. Your documents are encrypted and stored securely.",
    containerClass: "bg-growth-50 border-growth-200 text-growth-800",
    iconClass: "text-growth-500",
  },
  action_required: {
    icon: AlertTriangle,
    title: "Action Required",
    description:
      "There was an issue with your submitted documents. Please re-upload clearer images of your National ID.",
    containerClass: "bg-destructive/5 border-destructive/30 text-destructive",
    iconClass: "text-destructive",
  },
};

export default function KycStatusBanner({ status }: { status: KycStatus }) {
  const config = STATUS_MAP[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        config.containerClass
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", config.iconClass)} />
      <div>
        <p className="text-sm font-semibold">{config.title}</p>
        <p className="text-sm mt-0.5 opacity-80 leading-relaxed">{config.description}</p>
      </div>
    </div>
  );
}

/** Compact step-tracker used at the top of the wizard */
export function KycStepIndicator({
  currentStep,
  totalSteps,
  stepLabels,
}: {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}) {
  return (
    <nav aria-label="Verification steps" className="flex items-center gap-0">
      {stepLabels.map((label, i) => {
        const step = i + 1;
        const isDone = step < currentStep;
        const isActive = step === currentStep;

        return (
          <div key={label} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  isDone
                    ? "bg-growth-500 text-white"
                    : isActive
                    ? "bg-brand-500 text-white ring-4 ring-brand-200"
                    : "bg-muted text-muted-foreground"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : step}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-[10px] font-medium whitespace-nowrap",
                  isActive
                    ? "text-brand-600"
                    : isDone
                    ? "text-growth-600"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>

            {/* Connector */}
            {i < totalSteps - 1 && (
              <div
                className={cn(
                  "h-0.5 w-10 sm:w-16 mb-5 mx-1",
                  isDone ? "bg-growth-400" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
