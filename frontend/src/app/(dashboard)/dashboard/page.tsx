"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Menu,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { configApi, kycApi, paymentApi } from "@/lib/api";
import { cn, formatKES, KYC_STATUS_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { KycStatus, PaymentStatus } from "@/types";

// ---------------------------------------------------------------------------
// Onboarding checklist
// ---------------------------------------------------------------------------
interface OnboardingStep {
  label: string;
  description: string;
  done: boolean;
  href: string;
  icon: React.ElementType;
}

function buildSteps(
  kycStatus: KycStatus | null,
  paymentStatus: PaymentStatus | null
): { steps: OnboardingStep[]; progress: number } {
  const steps: OnboardingStep[] = [
    {
      label: "Create account",
      description: "You're registered on Kilele Bridge.",
      done: true,
      href: "#",
      icon: CheckCircle2,
    },
    {
      label: "Pay registration fee",
      description: "Complete the one-time M-PESA payment.",
      done: paymentStatus === "complete",
      href: "/dashboard/payment",
      icon: CreditCard,
    },
    {
      label: "Verify your identity",
      description: "Upload your National ID to unlock full access.",
      done: kycStatus === "verified",
      href: "/dashboard/kyc",
      icon: ShieldCheck,
    },
    {
      label: "Access coaching resources",
      description: "Browse portfolio guides, job strategies, and more.",
      done: false,
      href: "/dashboard/coaching",
      icon: BookOpen,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  return { steps, progress: Math.round((doneCount / steps.length) * 100) };
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="font-display text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
          <div className={cn("p-2.5 rounded-xl", color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const { user } = useAuth();

  const [kycStatus,     setKycStatus]     = useState<KycStatus | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [registrationFee, setRegistrationFee] = useState<number>(
    Number(process.env.NEXT_PUBLIC_REGISTRATION_FEE_KES ?? 100)
  );

  useEffect(() => {
    // Fetch live fee from backend config endpoint so it always matches
    // whatever REGISTRATION_FEE_KES is set to on the server
    configApi.get().then((cfg) => setRegistrationFee(cfg.registration_fee_kes)).catch(() => {});

    // KYC status — graceful fallback built into kycApi.getStatus()
    kycApi.getStatus().then((r) => setKycStatus(r.status)).catch(() => {});

    // Latest payment — uses /payments/my so no hard-coded id=0
    paymentApi.getMy().then((p) => {
      if (p) setPaymentStatus(p.status as PaymentStatus);
    }).catch(() => {});
  }, []);

  const { steps, progress } = buildSteps(kycStatus, paymentStatus);
  const kycMeta = KYC_STATUS_LABELS[kycStatus ?? "not_started"];

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-white/80 backdrop-blur-sm border-b px-4 sm:px-6 h-16 shrink-0">
        <button
          data-openmenu="true"
          className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors -ml-1"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5 text-muted-foreground pointer-events-none" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold">Dashboard</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Welcome back, {user?.full_name?.split(" ")[0] ?? "there"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === "member" && <Badge variant="success">Member</Badge>}
          {user?.role === "free"   && <Badge variant="warning">Free Tier</Badge>}
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold uppercase">
            {user?.full_name?.slice(0, 2) ?? "KB"}
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-5xl w-full mx-auto animate-fade-in">

        {/* Welcome hero */}
        <div className="relative rounded-2xl overflow-hidden bg-brand-800 text-white p-6 sm:p-8">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=60"
              alt="Professional workspace"
              fill
              className="object-cover opacity-15"
            />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-brand-200 text-sm font-medium mb-1">Welcome back</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                {user?.full_name ?? "Freelancer"} 👋
              </h2>
              <p className="text-brand-200 mt-2 text-sm leading-relaxed max-w-md">
                {user?.role === "member"
                  ? "Your account is active. Explore your coaching resources and keep growing."
                  : "Complete your onboarding to unlock full access to coaching resources."}
              </p>
            </div>
            {user?.role === "free" && (
              <Link href="/dashboard/payment">
                <Button variant="success" size="lg" className="shrink-0 gap-2">
                  <Zap className="h-4 w-4" />
                  Activate — {formatKES(registrationFee)}
                </Button>
              </Link>
            )}
            {user?.role === "member" && (
              <Link href="/dashboard/coaching">
                <Button variant="success" size="lg" className="shrink-0 gap-2">
                  <BookOpen className="h-4 w-4" />
                  View Resources
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}      label="Community"  value="2,400+"  sub="Active members"       color="bg-brand-500" />
          <StatCard icon={TrendingUp} label="Avg Income" value="KES 85K" sub="Monthly for members"  color="bg-growth-500" />
          <StatCard icon={BookOpen}   label="Resources"  value="40+"     sub="Guides & templates"   color="bg-purple-500" />
          <StatCard
            icon={Zap}
            label="Your Plan"
            value={user?.role === "member" ? "Member" : "Free"}
            sub={user?.role === "member" ? "Full access" : "Limited access"}
            color={user?.role === "member" ? "bg-growth-500" : "bg-yellow-500"}
          />
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Onboarding checklist — 3 cols */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Onboarding Progress</CardTitle>
                  <CardDescription>Complete all steps to unlock coaching resources</CardDescription>
                </div>
                <span className="font-display text-2xl font-bold text-brand-600">{progress}%</span>
              </div>
              <Progress value={progress} className="mt-3 h-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border transition-colors",
                    step.done
                      ? "bg-growth-50 border-growth-200"
                      : "bg-background hover:bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                      step.done
                        ? "bg-growth-500 text-white"
                        : "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    {step.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold", step.done && "line-through text-muted-foreground")}>
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                  {!step.done && step.href !== "#" && (
                    <Link href={step.href} className="text-brand-600 hover:text-brand-700 shrink-0">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick-action cards — 2 cols */}
          <div className="lg:col-span-2 space-y-4">

            {/* KYC */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand-500" />
                  Identity Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className={cn("text-sm font-semibold", kycMeta.color)}>
                    {kycMeta.label}
                  </span>
                </div>
                {kycStatus !== "verified" ? (
                  <Link href="/dashboard/kyc">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      {kycStatus === "pending" ? "Check Status" : "Start Verification"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <Badge variant="success" className="w-full justify-center py-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verified
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-brand-500" />
                  Registration Fee
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-semibold text-sm">{formatKES(registrationFee)}</span>
                </div>
                {user?.role !== "member" ? (
                  <Link href="/dashboard/payment">
                    <Button size="sm" className="w-full gap-2">
                      <CreditCard className="h-3.5 w-3.5" />
                      Pay Now
                    </Button>
                  </Link>
                ) : (
                  <Badge variant="success" className="w-full justify-center py-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Paid
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Resource teaser */}
            <Card className="bg-brand-50 border-brand-100">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-brand-800 mb-1">Latest Resource</p>
                <p className="text-xs text-brand-600 leading-snug mb-3">
                  "Building a Winning Upwork Profile for Kenyan Freelancers"
                </p>
                <Link href="/dashboard/coaching">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-brand-600 border-brand-200 hover:bg-brand-100 gap-2"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    {user?.role === "member" ? "Read Now" : "Unlock Access"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
