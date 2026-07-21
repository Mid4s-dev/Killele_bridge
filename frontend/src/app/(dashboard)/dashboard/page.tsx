"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  CreditCard,
  Globe,
  Laptop,
  Menu,
  RefreshCw,
  ShieldCheck,
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
// Onboarding steps
// ---------------------------------------------------------------------------

function buildSteps(kycStatus: KycStatus | null, paymentStatus: PaymentStatus | null) {
  const steps = [
    {
      label: "Create your account",
      description: "You're registered on Kilele Bridge.",
      done: true,
      href: "#",
      icon: CheckCircle2,
    },
    {
      label: "Pay the KES 500 registration fee",
      description: "One-time M-PESA payment. No subscription ever.",
      done: paymentStatus === "complete",
      href: "/dashboard/payment",
      icon: CreditCard,
    },
    {
      label: "Verify your identity",
      description: "Upload your National ID for full platform access.",
      done: kycStatus === "verified",
      href: "/dashboard/kyc",
      icon: ShieldCheck,
    },
    {
      label: "Access all five modules",
      description: "Coaching, AI Training, Peer Connection, Marketplace & Guides.",
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
  iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  iconBg: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
            <p className="font-display text-2xl font-bold mt-1 truncate">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>
          </div>
          <div className={cn("p-2.5 rounded-xl shrink-0", iconBg)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Module card — shown to members
// ---------------------------------------------------------------------------

function ModuleCard({
  icon: Icon,
  title,
  description,
  href,
  iconBg,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  iconBg: string;
  badge?: string;
}) {
  return (
    <Link href={href}>
      <div className="group flex flex-col gap-3 p-4 rounded-xl border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div className={cn("p-2.5 rounded-xl shrink-0", iconBg)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {badge && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gold-500 text-white leading-none shrink-0">
              {badge}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold group-hover:text-brand-600 transition-colors">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-brand-500 font-medium mt-auto">
          Open module <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Locked module card — shown to free users
// ---------------------------------------------------------------------------

function LockedModuleCard({
  icon: Icon,
  title,
  iconBg,
}: {
  icon: React.ElementType;
  title: string;
  iconBg: string;
}) {
  return (
    <Link href="/dashboard/payment">
      <div className="flex flex-col gap-3 p-4 rounded-xl border border-dashed bg-muted/30 opacity-70 hover:opacity-90 hover:border-gold-300 transition-all duration-200 h-full cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div className={cn("p-2.5 rounded-xl shrink-0 grayscale", iconBg)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">Members only · KES 500</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-gold-600 font-medium mt-auto">
          Unlock access <Zap className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}

const MODULES = [
  {
    icon: BookOpen,
    title: "Coaching Library",
    description: "40+ guides on portfolios, proposals, pricing, and client communication.",
    href: "/dashboard/coaching",
    iconBg: "bg-brand-500",
  },
  {
    icon: Brain,
    title: "AI Training Academy",
    description: "RLHF, LiDAR annotation, and data labelling programmes for global platforms.",
    href: "/dashboard/coaching",
    iconBg: "bg-purple-600",
    badge: "New",
  },
  {
    icon: Users,
    title: "Peer Connection",
    description: "Find vetted collaborators and connect clients with the right freelancers.",
    href: "/dashboard/coaching",
    iconBg: "bg-brand-600",
  },
  {
    icon: RefreshCw,
    title: "Account Marketplace",
    description: "Apprenticeship matching and transparent account transition for seasoned pros.",
    href: "/dashboard/coaching",
    iconBg: "bg-gold-500",
  },
  {
    icon: Globe,
    title: "Platform Guides",
    description: "Step-by-step Upwork, Fiverr and Toptal setup — done the right way.",
    href: "/dashboard/coaching",
    iconBg: "bg-growth-500",
  },
  {
    icon: Laptop,
    title: "Job Leads & Strategies",
    description: "Curated international job opportunities and compliant search strategies.",
    href: "/dashboard/coaching",
    iconBg: "bg-sunset-500",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { user } = useAuth();

  const [kycStatus,       setKycStatus]       = useState<KycStatus | null>(null);
  const [paymentStatus,   setPaymentStatus]   = useState<PaymentStatus | null>(null);
  const [registrationFee, setRegistrationFee] = useState<number>(500);

  useEffect(() => {
    configApi.get().then((c) => setRegistrationFee(c.registration_fee_kes)).catch(() => {});
    kycApi.getStatus().then((r) => setKycStatus(r.status)).catch(() => {});
    paymentApi.getMy().then((p) => {
      if (p) setPaymentStatus(p.status as PaymentStatus);
    }).catch(() => {});
  }, []);

  const isMember = user?.role === "member" || user?.role === "admin";
  const { steps, progress } = buildSteps(kycStatus, paymentStatus);
  const kycMeta = KYC_STATUS_LABELS[kycStatus ?? "not_started"];

  return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
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
          {isMember
            ? <Badge variant="success">Member</Badge>
            : <Badge variant="warning">Free Tier</Badge>}
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold uppercase ring-2 ring-brand-200">
            {user?.full_name?.slice(0, 2) ?? "KB"}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-5xl w-full mx-auto animate-fade-in">

        {/* Welcome hero */}
        <div className="relative rounded-2xl overflow-hidden text-white p-6 sm:p-8 min-h-[160px]"
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #1d4ed8 100%)" }}>
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=50"
              alt="Kenyan professionals at work"
              fill
              className="object-cover opacity-10"
            />
          </div>
          <div className="absolute top-0 right-0 w-56 h-56 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-brand-300 text-sm font-medium mb-1">Welcome back</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                {user?.full_name ?? "Freelancer"} 👋
              </h2>
              <p className="text-brand-200 mt-2 text-sm leading-relaxed max-w-md">
                {isMember
                  ? "Your membership is active. Explore all five modules and keep growing your freelance career."
                  : "All you need is a laptop and a strong connection — complete your onboarding to unlock all five modules."}
              </p>
            </div>
            {!isMember && (
              <Link href="/dashboard/payment" className="shrink-0">
                <Button className="gap-2 bg-gold-500 hover:bg-gold-600 text-white shadow-lg">
                  <Zap className="h-4 w-4" />
                  Activate — {formatKES(registrationFee)}
                </Button>
              </Link>
            )}
            {isMember && (
              <Link href="/dashboard/coaching" className="shrink-0">
                <Button className="gap-2 bg-growth-500 hover:bg-growth-600 text-white">
                  <BookOpen className="h-4 w-4" />
                  Browse Modules
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}    label="Community"   value="2,400+"  sub="Active members"       iconBg="bg-brand-500" />
          <StatCard icon={Brain}    label="AI Academy"  value="4 tracks" sub="RLHF · LiDAR · Chat" iconBg="bg-purple-600" />
          <StatCard icon={BookOpen} label="Resources"   value="40+"     sub="Guides & templates"   iconBg="bg-growth-500" />
          <StatCard
            icon={Zap}
            label="Your Plan"
            value={isMember ? "Member" : "Free Tier"}
            sub={isMember ? "All 5 modules active" : "Upgrade for KES 500"}
            iconBg={isMember ? "bg-gold-500" : "bg-sunset-500"}
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
                  <CardDescription>Complete all steps to unlock every module</CardDescription>
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
                  <div className={cn(
                    "mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                    step.done
                      ? "bg-growth-500 text-white"
                      : "bg-muted text-muted-foreground border border-border"
                  )}>
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

          {/* Quick actions — 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            {/* KYC card */}
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
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Verified
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Payment card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-brand-500" />
                  Registration Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className={cn(
                    "text-sm font-semibold",
                    paymentStatus === "complete" ? "text-growth-600" : "text-muted-foreground"
                  )}>
                    {paymentStatus === "complete" ? "Paid" : "Pending"}
                  </span>
                </div>
                {paymentStatus !== "complete" ? (
                  <Link href="/dashboard/payment">
                    <Button size="sm" className="w-full gap-2 bg-gold-500 hover:bg-gold-600 text-white">
                      <Zap className="h-3.5 w-3.5" />
                      Pay {formatKES(registrationFee)} via M-PESA
                    </Button>
                  </Link>
                ) : (
                  <Badge variant="success" className="w-full justify-center py-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Payment Complete
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Module grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg">Service Modules</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isMember
                  ? "All modules are unlocked and ready to use."
                  : "Activate your membership to unlock all modules."}
              </p>
            </div>
            {!isMember && (
              <Link href="/dashboard/payment">
                <Button size="sm" className="gap-1.5 bg-gold-500 hover:bg-gold-600 text-white shrink-0">
                  <Zap className="h-3.5 w-3.5" />
                  Unlock All
                </Button>
              </Link>
            )}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map((mod) =>
              isMember ? (
                <ModuleCard key={mod.title} {...mod} />
              ) : (
                <LockedModuleCard key={mod.title} icon={mod.icon} title={mod.title} iconBg={mod.iconBg} />
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
