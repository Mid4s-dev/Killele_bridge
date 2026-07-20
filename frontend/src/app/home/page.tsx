import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  DollarSign,
  Globe,
  MessageSquare,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------
const FEATURES = [
  {
    icon: BookOpen,
    title: "Expert Coaching Resources",
    description:
      "40+ guides covering portfolio building, client acquisition, and pricing strategies tailored for the Kenyan market.",
    color: "bg-brand-100 text-brand-600",
  },
  {
    icon: TrendingUp,
    title: "Career Growth Framework",
    description:
      "A proven step-by-step roadmap from your first gig to a sustainable six-figure freelance income in KES.",
    color: "bg-growth-100 text-growth-600",
  },
  {
    icon: MessageSquare,
    title: "Client Communication Templates",
    description:
      "Professionally written proposals, follow-ups, and negotiation scripts that convert prospects into clients.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: DollarSign,
    title: "Pricing & Rate Calculator",
    description:
      "Know exactly what to charge. Our KES/USD pricing framework accounts for Kenyan living costs and market rates.",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: Globe,
    title: "Legitimate Job Search Strategy",
    description:
      "Ethical, platform-compliant techniques for finding international clients on Upwork, LinkedIn, and beyond.",
    color: "bg-teal-100 text-teal-600",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Trusted Platform",
    description:
      "Your data is encrypted and handled in full compliance with the Kenya Data Protection Act, 2019.",
    color: "bg-rose-100 text-rose-600",
  },
];

const TESTIMONIALS = [
  {
    initials: "AM",
    name: "Amina Mwangi",
    role: "UX Designer · Nairobi",
    quote:
      "Kilele Bridge gave me the structure and confidence I needed. Within three months I landed my first international client at $35/hour.",
    rating: 5,
  },
  {
    initials: "DK",
    name: "David Kamau",
    role: "Full-Stack Developer · Kisumu",
    quote:
      "The pricing framework alone was worth every shilling. I raised my rates by 60% and still booked out three months ahead.",
    rating: 5,
  },
  {
    initials: "FO",
    name: "Fatuma Odhiambo",
    role: "Content Strategist · Mombasa",
    quote:
      "Finally a platform built for Kenyan freelancers, not just adapted from Western content. The local market insights are invaluable.",
    rating: 5,
  },
];

const STEPS = [
  { step: "01", title: "Create your account", desc: "Register in under two minutes." },
  { step: "02", title: "Pay the one-time fee", desc: `KES ${Number(process.env.NEXT_PUBLIC_REGISTRATION_FEE_KES || 100)} via secure IntaSend checkout.` },
  { step: "03", title: "Verify your identity", desc: "Quick KYC with your National ID." },
  { step: "04", title: "Access everything", desc: "Unlock all resources immediately." },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/home" className="flex items-center gap-2 shrink-0">
            <Image src="/logo.png" alt="Kilele Bridge" width={130} height={36} priority className="object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gap-1.5">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-900 text-white py-20 sm:py-28">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&q=60"
            alt="Kenyan professionals collaborating"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/95 via-brand-800/85 to-brand-700/75" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Badge variant="info" className="mb-6 text-sm px-4 py-1.5 gap-1.5">
            <Star className="h-3.5 w-3.5 text-yellow-400" />
            Trusted by 2,400+ Kenyan freelancers
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Reach the{" "}
            <span className="text-growth-400">Summit</span>{" "}
            of Your Freelance Career
          </h1>
          <p className="text-lg sm:text-xl text-brand-200 max-w-2xl mx-auto leading-relaxed mb-10">
            Kenya&apos;s coaching platform for freelancers. Expert-curated resources,
            proven strategies, and a community that actually understands your market.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" variant="success" className="gap-2 text-base px-8">
                Start for KES {Number(process.env.NEXT_PUBLIC_REGISTRATION_FEE_KES || 100)} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-base border-brand-500 text-black hover:bg-brand-800"
              >
                How it works
              </Button>
            </Link>
          </div>

          {/* Social proof row */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-brand-300">
            {[
              { icon: Users,     text: "2,400+ members" },
              { icon: TrendingUp, text: "KES 85K avg. monthly income" },
              { icon: CheckCircle2, text: "DPA 2019 compliant" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-growth-400" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">What&apos;s included</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Everything you need to grow
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Built specifically for Kenyan freelancers — not adapted from generic
              Western content.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group flex flex-col gap-4 p-6 rounded-2xl border bg-card hover:bg-brand-900 hover:text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1.5 group-hover:text-white">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-brand-100">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-24 bg-muted/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">Simple onboarding</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Up and running in minutes
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative flex flex-col items-center text-center gap-3">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 bg-border" />
                )}
                <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-display font-bold text-sm shrink-0 relative z-10">
                  {s.step}
                </div>
                <div>
                  <p className="font-semibold text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/register">
              <Button size="lg" className="gap-2 px-10">
                Create your account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4">Community voices</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Real results from real members
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="flex flex-col gap-4 p-6 rounded-2xl border bg-card">
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-sm text-muted-foreground leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
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
      <section className="py-20 bg-brand-800 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Ready to reach your summit?
          </h2>
          <p className="text-brand-200 text-lg mb-8 leading-relaxed">
            Join 2,400+ Kenyan freelancers. One-time fee of KES {Number(process.env.NEXT_PUBLIC_REGISTRATION_FEE_KES || 100)}. Full access,
            forever.
          </p>
          <Link href="/register">
            <Button size="lg" variant="success" className="gap-2 text-base px-10">
              Get started today <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-brand-400 text-xs mt-4">
            No subscription · No hidden fees · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t bg-background py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Image src="/logo.png" alt="Kilele Bridge" width={110} height={32} className="object-contain" />
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link href="/terms"   className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <a href="mailto:support@kilelebridge.co.ke" className="hover:text-foreground transition-colors">
                Support
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Kilele Bridge Ltd. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-growth-500" />
              Kenya Data Protection Act, 2019 compliant
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
