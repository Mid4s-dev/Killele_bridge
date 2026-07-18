"use client";

/**
 * Dashboard — Kilele Bridge command centre.
 *
 * Architecture:
 *   - Hero welcome banner with dynamic CTA based on user role
 *   - Stats row showing community metrics
 *   - Gated Service Grid: all modules visible, locked ones redirect to /dashboard/payment
 *   - Onboarding checklist + sidebar cards (KYC, payment, latest resource)
 *
 * Gated logic:
 *   When user.role === "free", every service card shows a Lock badge and
 *   clicking it navigates to /dashboard/payment. This is the frontend
 *   AuthGuard. The backend independently enforces role via `require_member`.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  CreditCard,
  Globe,
  GraduationCap,
  Layers3,
  Lock,
  Menu,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { kycApi, paymentApi } from "@/lib/api";
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
// Service module definitions — the core of the gated content system
// ---------------------------------------------------------------------------
interface ServiceModule {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  category: string;
  highlight?: string;
  accentColor: string;
  accentBg: string;
}

const SERVICE_MODULES: ServiceModule[] = [
  {
    id: "lidar-training",
    title: "LiDAR Training",
    description:
      "Master 3D spatial data annotation and point cloud labelling for autonomous vehicles and mapping projects.",
    icon: Layers3,
    href: "/dashboard/coaching",
    category: "Training",
    highlight: "Most Popular",
    accentColor: "text-brand-600",
    accentBg: "bg-brand-50 border-brand-100",
  },
  {
    id: "job-leads",
    title: "Job Leads",
    description:
      "Vetted, platform-compliant freelance opportunities curated for the Kenyan market — updated weekly.",
    icon: Search,
    href: "/dashboard/coaching",
    category: "Opportunities",
    highlight: "Updated Weekly",
    accentColor: "text-orange-600",
    accentBg: "bg-orange-50 border-orange-100",
  },
  {
    id: "portfolio-review",
    title: "Portfolio Review",
    description:
      "Get your Upwork profile, portfolio, and proposal strategy reviewed by experienced mentors.",
    icon: Briefcase,
    href: "/dashboard/coaching",
    category: "Mentorship",
    accentColor: "text-purple-600",
    accentBg: "bg-purple-50 border-purple-100",
  },
  {
    id: "client-comms",
    title: "Client Communication",
    description:
      "Professional templates for proposals, follow-ups, and contract negotiations tailored to East Africa.",
    icon: MessageSquare,
    href: "/dashboard/coaching",
    category: "Templates",
    accentColor: "text-growth-600",
    accentBg: "bg-growth-50 border-growth-100",
  },
  {
    id: "pricing-framework",
    title: "Pricing Framework",
    description:
      "Calculate your minimum viable rate, anchor against Kenyan living costs, and position for premium clients.",
    icon: TrendingUp,
    href: "/dashboard/coaching",
    category: "Business",
    accentColor: "text-emerald-600",
    accentBg: "bg-emerald-50 border-emerald-100",
  },
  {
    id: "global-platforms",
    title: "Global Platforms Guide",
    description:
      "Navigate Upwork, Fiverr, Toptal, and emerging platforms with ethical, compliant strategies that work.",
    icon: Globe,
    href: "/dashboard/coaching",
    category: "Strategy",
    highlight: "New",
    accentColor: "text-sky-600",
    accentBg: "bg-sky-50 border-sky-100",
  },
];

// ---------------------------------------------------------------------------
// Onboarding step helper
// ---------------------------------------------------------------------------
interface OnboardingStep {
  label: string;
  description: string;
  done: boolean;
  href: string;
  icon: React.ElementType;
}

function useOnboardingSteps(
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
      description: "Complete the KES 100 onboarding payment.",
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
  const progress = Math.round((doneCount / steps.length) * 100);
  return { steps, progress };
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
    <Card className="overflow-hidden group hover:shadow-md transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="font-display text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
          <div className={cn("p-2.5 rounded-xl transition-transform duration-200 group-hover:scale-110", color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Service Module Card — the gated content card
// ---------------------------------------------------------------------------
function ServiceCard({
  service,
  isLocked,
}: {
  service: ServiceModule;
  isLocked: boolean;
}) {
  const targetHref = isLocked ? "/dashboard/payment" : service.href;
  const Icon = service.icon;

  return (
    <Link href={targetHref} className="group block h-full">
      <Card
        className={cn(
          "h-full transition-all duration-300 hover:shadow-lg",
          isLocked
            ? "bg-muted/20 border-dashed border-muted-foreground/20 hover:border-brand-300"
            : "hover:border-brand-300 hover:-translate-y-1"
        )}
      >
        <CardContent className="p-5 flex flex-col h-full">
          {/* Top row — icon + badges */}
          <div className="flex items-start justify-between mb-4">
            <div
              className={cn(
                "p-2.5 rounded-xl border transition-all duration-200",
                isLocked
                  ? "bg-muted border-border"
                  : cn(service.accentBg, "group-hover:shadow-sm")
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isLocked ? "text-muted-foreground" : service.accentColor
                )}
              />
            </div>
            <div className="flex items-center gap-1.5">
              {service.highlight && !isLocked && (
                <Badge
                  variant="default"
                  className="text-[10px] bg-brand-500 hover:bg-brand-600"
                >
                  {service.highlight}
                </Badge>
              )}
              {isLocked ? (
                <Badge variant="secondary" className="gap-1 bg-background border text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Locked
                </Badge>
              ) : (
                <Badge variant="outline" className={cn("border", service.accentColor)}>
                  {service.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Title + description */}
          <h4
            className={cn(
              "font-semibold mb-1.5 transition-colors",
              !isLocked && "group-hover:text-brand-600"
            )}
          >
            {service.title}
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
            {service.description}
          </p>

          {/* Bottom CTA */}
          {isLocked ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 group-hover:underline">
              <Zap className="h-3.5 w-3.5" />
              Upgrade to Access
              <ArrowRight className="h-3 w-3 ml-auto" />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-growth-600 group-hover:underline">
              <Sparkles className="h-3.5 w-3.5" />
              Enter Module
              <ArrowRight className="h-3 w-3 ml-auto" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);

  useEffect(() => {
    kycApi.getStatus().then((r) => setKycStatus(r.status)).catch(() => {});
    // Try to get the most recent payment status (we don't have an ID yet,
    // so we handle the 404 silently)
    paymentApi.getStatus(0).catch(() => {});
  }, []);

  const { steps, progress } = useOnboardingSteps(kycStatus, paymentStatus);
  const kycMeta = KYC_STATUS_LABELS[kycStatus ?? "not_started"];

  const isFreeTier = user?.role === "free";
  const isMember = user?.role === "member" || user?.role === "admin";

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────────── */}
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
          {isMember && <Badge variant="success">Member</Badge>}
          {isFreeTier && <Badge variant="warning">Free Tier</Badge>}
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold uppercase">
            {user?.full_name?.slice(0, 2) ?? "KB"}
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex-1 p-4 sm:p-6 space-y-8 max-w-6xl w-full mx-auto animate-fade-in">

        {/* Hero welcome */}
        <div className="relative rounded-2xl overflow-hidden bg-brand-800 text-white p-6 sm:p-8">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=60"
              alt="Kenyan professional workspace"
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
              <p className="text-brand-200 mt-2 text-sm leading-relaxed max-w-lg">
                {isMember
                  ? "Your account is active. Explore your coaching resources, job leads, and training modules."
                  : "Complete your onboarding below to unlock all coaching resources, job leads, and training modules."}
              </p>
            </div>
            {isFreeTier && (
              <Link href="/dashboard/payment">
                <Button variant="success" size="lg" className="shrink-0 gap-2">
                  <Zap className="h-4 w-4" />
                  Activate for {formatKES(100)}
                </Button>
              </Link>
            )}
            {isMember && (
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
          <StatCard icon={Users}        label="Community"  value="2,400+"  sub="Active members"         color="bg-brand-500" />
          <StatCard icon={TrendingUp}   label="Avg Income" value="KES 85K" sub="Monthly for members"    color="bg-growth-500" />
          <StatCard icon={GraduationCap} label="Modules"   value="6"       sub="Training & resources"   color="bg-purple-500" />
          <StatCard
            icon={Zap}
            label="Your Plan"
            value={isMember ? "Member" : "Free"}
            sub={isMember ? "Full access" : "Limited access"}
            color={isMember ? "bg-growth-500" : "bg-yellow-500"}
          />
        </div>

        {/* ── Gated Service Grid ──────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold">Service Modules</h3>
              <p className="text-sm text-muted-foreground">
                {isFreeTier
                  ? "Pay the one-time KES 100 fee to unlock all modules below."
                  : "Full access active — explore your training, resources, and opportunities."}
              </p>
            </div>
            {isFreeTier && (
              <Link href="/dashboard/payment">
                <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
                  <Lock className="h-3.5 w-3.5" />
                  Unlock All
                </Button>
              </Link>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICE_MODULES.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isLocked={isFreeTier}
              />
            ))}
          </div>
        </div>

        {/* ── Onboarding + Sidebar grid ───────────────────────────────── */}
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
                      : "bg-background hover:bg-muted/50 cursor-pointer"
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
                  {!step.done && (
                    <Link href={step.href} className="text-brand-600 hover:text-brand-700 shrink-0">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick actions — 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            {/* KYC status card */}
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
                {kycStatus !== "verified" && (
                  <Link href="/dashboard/kyc">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      {kycStatus === "pending" ? "Check Status" : "Start Verification"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
                {kycStatus === "verified" && (
                  <Badge variant="success" className="w-full justify-center py-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verified
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Payment status card */}
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
                  <span className="font-semibold text-sm">{formatKES(100)}</span>
                </div>
                {!isMember ? (
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

            {/* Lifetime value highlight */}
            <Card className="bg-gradient-to-br from-brand-50 to-growth-50 border-brand-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-brand-600" />
                  <p className="text-sm font-semibold text-brand-800">Lifetime Access</p>
                </div>
                <p className="text-xs text-brand-600 leading-snug mb-3">
                  One payment of {formatKES(100)} unlocks all 6 service modules,
                  40+ resources, templates, and community access — forever.
                </p>
                <Link href={isFreeTier ? "/dashboard/payment" : "/dashboard/coaching"}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-brand-600 border-brand-200 hover:bg-brand-100 gap-2"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    {isMember ? "Browse Resources" : "Unlock Access"}
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
