import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Brain,
  Briefcase,
  CheckCircle2,
  Globe,
  HandshakeIcon,
  Laptop,
  RefreshCw,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const MARKETPLACE_SECTIONS = [
  {
    id: "peer",
    badge: "Peer Connection",
    badgeColor: "bg-brand-100 text-brand-700 border-brand-200",
    icon: Users,
    iconBg: "bg-brand-500",
    title: "Connect with Vetted Freelancers & Clients",
    description:
      "Clients post specific tasks and get matched with pre-screened Kenyan freelancers. Every profile is community-verified before work begins — no more guesswork, no scams.",
    points: [
      "Community-vetted freelancer profiles",
      "Safe project escrow workflow",
      "Transparent rating system",
    ],
    cta: "Find a Collaborator",
    href: "/register",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=70",
    imageAlt: "Kenyan professionals collaborating around a laptop",
    reverse: false,
    accent: "brand",
  },
  {
    id: "ai",
    badge: "AI Training Academy",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Brain,
    iconBg: "bg-purple-600",
    title: "Qualify for Global AI & Data Platforms",
    description:
      "Specialised training for RLHF, LiDAR/computer vision annotation, chat moderation, and data labelling — the exact skills that unlock top-paying projects on Outlier, Mindrift, Scale AI, and more.",
    points: [
      "RLHF & AI feedback training",
      "LiDAR & computer vision annotation",
      "Chat moderation & data labelling",
    ],
    cta: "Start AI Training",
    href: "/register",
    image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=70",
    imageAlt: "Freelancer training on AI annotation tools",
    reverse: true,
    accent: "purple",
  },
  {
    id: "transition",
    badge: "Account Marketplace",
    badgeColor: "bg-gold-100 text-gold-700 border-gold-200",
    icon: RefreshCw,
    iconBg: "bg-gold-500",
    title: "Verified Account Apprenticeship & Transition",
    description:
      "Seasoned freelancers who are stepping back can safely pass down their established, rated accounts to trained apprentices — giving new entrants a head-start and experienced pros a dignified exit.",
    points: [
      "Transparent handover process",
      "Apprenticeship matching & training",
      "Established ratings transferred safely",
    ],
    cta: "Explore the Marketplace",
    href: "/register",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=70",
    imageAlt: "Senior freelancer mentoring an apprentice",
    reverse: false,
    accent: "gold",
  },
  {
    id: "platforms",
    badge: "Platform Guidance",
    badgeColor: "bg-growth-100 text-growth-700 border-growth-200",
    icon: Globe,
    iconBg: "bg-growth-500",
    title: "Get Verified on Global Platforms — the Right Way",
    description:
      "Step-by-step onboarding guides for Upwork, Fiverr, Toptal and more. Learn how to pass identity verification, write a winning profile, and land your first international contract without violating terms of service.",
    points: [
      "Upwork profile optimisation playbook",
      "KYC & identity verification walkthroughs",
      "Terms-of-service compliant strategies",
    ],
    cta: "Read the Guides",
    href: "/register",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=70",
    imageAlt: "Freelancer setting up their Upwork profile",
    reverse: true,
    accent: "growth",
  },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: "40+ Coaching Resources",
    description:
      "Portfolio guides, proposal templates, and pricing frameworks built for the Kenyan market — not Western content repurposed.",
    color: "bg-brand-100 text-brand-600",
  },
  {
    icon: Brain,
    title: "High-Skill AI Academy",
    description:
      "Structured programmes for RLHF, data annotation and AI model training that open doors to $20–$50/hr global projects.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: HandshakeIcon,
    title: "Account Transition Market",
    description:
      "A transparent, community-governed marketplace for safely passing down established freelance accounts to vetted apprentices.",
    color: "bg-gold-100 text-gold-700",
  },
  {
    icon: Laptop,
    title: "Platform Setup Guides",
    description:
      "Detailed walkthroughs for Upwork, Fiverr, and Toptal — from account creation to first paid project.",
    color: "bg-growth-100 text-growth-600",
  },
  {
    icon: TrendingUp,
    title: "Career Growth Framework",
    description:
      "A proven roadmap from your first gig to a sustainable six-figure freelance income measured in KES.",
    color: "bg-sunset-100 text-sunset-600",
  },
  {
    icon: ShieldCheck,
    title: "DPA 2019 Compliant",
    description:
      "Your data is encrypted and handled in full compliance with the Kenya Data Protection Act, 2019.",
    color: "bg-teal-100 text-teal-600",
  },
];

const TESTIMONIALS = [
  {
    initials: "AM",
    name: "Amina Mwangi",
    role: "UX Designer · Nairobi",
    quote:
      "I completed the AI annotation training in two weeks and landed a $28/hr project on Outlier. The structured programme makes all the difference.",
    rating: 5,
    avatar: "bg-brand-600",
  },
  {
    initials: "DK",
    name: "David Kamau",
    role: "Full-Stack Developer · Kisumu",
    quote:
      "The account transition marketplace gave me a head-start with an established Upwork profile. I was billing clients within days, not months.",
    rating: 5,
    avatar: "bg-purple-600",
  },
  {
    initials: "FO",
    name: "Fatuma Odhiambo",
    role: "Data Annotator · Mombasa",
    quote:
      "Finally a platform built for us, not adapted from Western content. The Kenyan market insights and peer community are genuinely invaluable.",
    rating: 5,
    avatar: "bg-growth-600",
  },
];

const STEPS = [
  { step: "01", title: "Create your account", desc: "Register in under two minutes — no credit card needed." },
  { step: "02", title: "Pay the one-time fee", desc: "KES 500 via secure M-PESA. No recurring subscription." },
  { step: "03", title: "Verify your identity", desc: "Quick KYC with your National ID. Usually same-day." },
  { step: "04", title: "Access everything", desc: "All modules, guides, and the marketplace unlock instantly." },
];

const STATS = [
  { value: "2,400+", label: "Active members" },
  { value: "KES 85K", label: "Avg. monthly income" },
  { value: "40+",     label: "Coaching resources" },
  { value: "4",       label: "Marketplace modules" },
];

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function SectionBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${className}`}>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/home" className="flex items-center gap-2 shrink-0">
            <Image src="/logo.png" alt="Kilele Bridge" width={110} height={30} priority className="object-contain" />
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#modules" className="hover:text-foreground transition-colors">Modules</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#community" className="hover:text-foreground transition-colors">Community</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gap-1.5 bg-brand-600 hover:bg-brand-700">
                Join Now <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-950 text-white py-24 sm:py-32" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)" }}>
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=60"
            alt="Kenyan professionals working on laptops in a vibrant co-working space"
            fill
            className="object-cover opacity-10"
            priority
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(30,58,138,0.88) 60%, rgba(30,64,175,0.80) 100%)" }} />
        </div>

        {/* Decorative blobs */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <SectionBadge className="mb-6 bg-gold-500/20 text-gold-300 border-gold-500/30">
            <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
            Trusted by 2,400+ Kenyan freelancers
          </SectionBadge>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
            All you need is a{" "}
            <span className="relative inline-block">
              <span className="text-gold-400">laptop</span>
            </span>{" "}
            and a strong{" "}
            <span className="text-growth-400">internet connection</span>
            <span className="text-white"> —</span>
            <br className="hidden sm:block" />
            <span className="text-brand-200"> and we will help you find the work.</span>
          </h1>

          <p className="text-lg sm:text-xl text-brand-200 max-w-3xl mx-auto leading-relaxed mb-10">
            Kilele Bridge is Kenya&apos;s freelance community where you connect with peers,
            master high-skill AI and digital work, access top global platforms, and build
            a sustainable career — together.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link href="/register">
              <Button size="lg" className="gap-2 text-base px-8 bg-growth-500 hover:bg-growth-600 text-white shadow-lg shadow-growth-900/30">
                <Zap className="h-4 w-4" />
                Join for KES 500 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#modules">
              <Button size="lg" variant="outline" className="gap-2 text-base border-brand-400/50 text-white hover:bg-brand-800/60 bg-transparent">
                See what&apos;s inside
              </Button>
            </a>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-2xl sm:text-3xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-brand-300 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Marketplace Modules ─────────────────────────────────────────── */}
      <section id="modules" className="py-20 sm:py-28 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <SectionBadge className="mb-4 bg-muted text-muted-foreground border-border">
              Platform modules
            </SectionBadge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3">
              Four paths to a thriving freelance career
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Each module is purpose-built for where you are right now — whether
              you&apos;re starting out, levelling up your skills, or helping the next generation.
            </p>
          </div>

          <div className="space-y-24">
            {MARKETPLACE_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${section.reverse ? "lg:[&>*:first-child]:order-2" : ""}`}
                >
                  {/* Text side */}
                  <div className="space-y-6">
                    <SectionBadge className={section.badgeColor}>
                      <Icon className="h-3.5 w-3.5" />
                      {section.badge}
                    </SectionBadge>
                    <h3 className="font-display text-2xl sm:text-3xl font-bold leading-snug">
                      {section.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-base">
                      {section.description}
                    </p>
                    <ul className="space-y-3">
                      {section.points.map((point) => (
                        <li key={point} className="flex items-start gap-3 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-growth-500 shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={section.href}>
                      <Button className={`gap-2 mt-2 ${
                        section.accent === "brand"   ? "bg-brand-600 hover:bg-brand-700" :
                        section.accent === "purple"  ? "bg-purple-600 hover:bg-purple-700" :
                        section.accent === "gold"    ? "bg-gold-500 hover:bg-gold-600" :
                        "bg-growth-500 hover:bg-growth-600"
                      } text-white`}>
                        {section.cta} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  {/* Image side */}
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-xl">
                    <Image
                      src={section.image}
                      alt={section.imageAlt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className={`absolute inset-0 ${
                      section.accent === "brand"   ? "bg-gradient-to-br from-brand-900/30" :
                      section.accent === "purple"  ? "bg-gradient-to-br from-purple-900/30" :
                      section.accent === "gold"    ? "bg-gradient-to-br from-gold-900/30" :
                      "bg-gradient-to-br from-growth-900/30"
                    } to-transparent`} />
                    {/* Module badge overlay */}
                    <div className="absolute top-4 left-4">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-semibold backdrop-blur-sm ${
                        section.accent === "brand"  ? "bg-brand-600/90" :
                        section.accent === "purple" ? "bg-purple-600/90" :
                        section.accent === "gold"   ? "bg-gold-500/90" :
                        "bg-growth-600/90"
                      }`}>
                        <Icon className="h-3.5 w-3.5" />
                        {section.badge}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features grid ───────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <SectionBadge className="mb-4 bg-muted text-muted-foreground border-border">
              What&apos;s included
            </SectionBadge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3">
              Everything in your membership
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              One KES 500 fee. No recurring charges. Every module unlocked for life.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group flex flex-col gap-4 p-6 rounded-2xl border bg-card hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <SectionBadge className="mb-4 bg-muted text-muted-foreground border-border">
              Simple onboarding
            </SectionBadge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3">
              Up and running in minutes
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              From zero to fully active member in four steps.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative flex flex-col items-center text-center gap-4">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 bg-gradient-to-r from-brand-200 to-border" />
                )}
                <div className="w-11 h-11 rounded-full bg-brand-600 text-white flex items-center justify-center font-display font-bold text-sm shrink-0 relative z-10 shadow-lg shadow-brand-200">
                  {s.step}
                </div>
                <div>
                  <p className="font-semibold text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/register">
              <Button size="lg" className="gap-2 px-10 bg-brand-600 hover:bg-brand-700">
                Create your account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Community / Testimonials ──────────────────────────────────────── */}
      <section id="community" className="py-20 sm:py-24 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <SectionBadge className="mb-4 bg-muted text-muted-foreground border-border">
              Community voices
            </SectionBadge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3">
              Real results from real members
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Hear from Kenyan freelancers who used Kilele Bridge to land international work.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="flex flex-col gap-5 p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-gold-400 text-gold-400" />
                  ))}
                </div>
                <blockquote className="text-sm text-muted-foreground leading-relaxed flex-1 italic">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${t.avatar} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)" }}>
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=50"
            alt="Kenyan freelancers working together"
            fill
            className="object-cover opacity-10"
          />
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <Wifi className="h-4 w-4 text-gold-300" />
              <Laptop className="h-4 w-4 text-gold-300" />
              <span className="text-white text-sm font-medium ml-1">That&apos;s all you need</span>
            </div>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Your laptop is your office.{" "}
            <span className="text-gold-300">We&apos;ll find you the work.</span>
          </h2>
          <p className="text-brand-200 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            Join 2,400+ Kenyan freelancers building sustainable digital careers
            through the Kilele Bridge community.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2 text-base px-10 bg-growth-500 hover:bg-growth-600 text-white shadow-lg">
                <Zap className="h-4 w-4" />
                Join for KES 500 — One Time
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="gap-2 text-base border-white/30 text-white hover:bg-white/10 bg-transparent">
                Already a member? Sign in
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-brand-300">
            {[
              { icon: BadgeCheck, text: "No subscription fees" },
              { icon: ShieldCheck, text: "DPA 2019 compliant" },
              { icon: Briefcase,  text: "Instant access on payment" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-growth-400" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-brand-950 text-brand-300 py-12 px-4 sm:px-6" style={{ background: "#0f172a" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-2">
              <Image src="/logo.png" alt="Kilele Bridge" width={110} height={30} className="brightness-0 invert object-contain mb-4" />
              <p className="text-sm text-brand-400 leading-relaxed max-w-sm">
                Kenya&apos;s freelancer community for peer connection, AI training, account
                transitions, and platform guidance. All you need is a laptop.
              </p>
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-4">Platform</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#modules" className="hover:text-white transition-colors">Peer Connection</a></li>
                <li><a href="#modules" className="hover:text-white transition-colors">AI Training Academy</a></li>
                <li><a href="#modules" className="hover:text-white transition-colors">Account Marketplace</a></li>
                <li><a href="#modules" className="hover:text-white transition-colors">Platform Guidance</a></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-4">Account</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/register" className="hover:text-white transition-colors">Create account</Link></li>
                <li><Link href="/login"    className="hover:text-white transition-colors">Sign in</Link></li>
                <li><a href="mailto:support@kilelebridge.co.ke" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-brand-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-500">
            <p>© {new Date().getFullYear()} Kilele Bridge. All rights reserved.</p>
            <p>Regulated under the Kenya Data Protection Act, 2019</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
