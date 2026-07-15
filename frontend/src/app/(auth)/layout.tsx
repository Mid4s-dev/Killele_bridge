import Image from "next/image";

/**
 * Auth layout — full-height split screen.
 * Left: brand panel with hero image + testimonial
 * Right: form panel (rendered by each auth page)
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left brand panel ──────────────────────────────────────────── */}
      <div className="relative hidden lg:flex flex-col bg-brand-800 text-white overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80"
            alt="Kenyan professionals collaborating in a modern workspace"
            fill
            className="object-cover opacity-25"
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/90 via-brand-800/80 to-brand-700/70" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Kilele Bridge"
              width={140}
              height={40}
              className="brightness-0 invert"
            />
          </div>

          {/* Middle copy */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <div className="mb-6 w-12 h-1 bg-growth-400 rounded-full" />
            <h1 className="font-display text-4xl font-bold leading-tight mb-4">
              Reach the Summit of Your Freelance Career
            </h1>
            <p className="text-brand-200 text-lg leading-relaxed">
              Join thousands of Kenyan freelancers who have transformed their skills
              into consistent income with expert coaching, portfolio reviews, and
              proven job search strategies.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-10">
              {[
                { value: "2,400+", label: "Members" },
                { value: "94%", label: "Success Rate" },
                { value: "KES 85K", label: "Avg. Monthly Income" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-brand-300 text-sm mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <blockquote className="relative border-l-2 border-growth-400 pl-5 mt-auto">
            <p className="text-brand-100 text-sm leading-relaxed italic">
              "Kilele Bridge gave me the structure and confidence I needed. Within
              three months I landed my first international client."
            </p>
            <footer className="mt-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold">
                AM
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Amina Mwangi</p>
                <p className="text-brand-300 text-xs">UX Designer · Nairobi</p>
              </div>
            </footer>
          </blockquote>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────── */}
      <div className="flex flex-col min-h-screen bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-center pt-8 pb-4">
          <Image src="/logo.png" alt="Kilele Bridge" width={130} height={38} />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[420px] animate-fade-in">{children}</div>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-6 px-6">
          © {new Date().getFullYear()} Kilele Bridge Ltd. · All rights reserved.
        </p>
      </div>
    </div>
  );
}
