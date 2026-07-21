"use client";

/**
 * Coaching Resources — member-only content grid.
 *
 * Free-tier users see a paywall overlay instead of the resource cards.
 * Members see a filterable grid fetched from GET /coaching/resources.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Briefcase,
  ChevronRight,
  DollarSign,
  Loader2,
  Lock,
  Menu,
  MessageSquare,
  Search,
  Zap,
} from "lucide-react";

import { coachingApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CoachingResource } from "@/types";

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------
const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  portfolio:    { label: "Portfolio",    icon: Briefcase,    color: "text-brand-600",   bg: "bg-brand-50 border-brand-100" },
  communication:{ label: "Communication",icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
  business:     { label: "Business",     icon: DollarSign,   color: "text-growth-600",  bg: "bg-growth-50 border-growth-100" },
  "job-search": { label: "Job Search",   icon: Search,       color: "text-orange-600",  bg: "bg-orange-50 border-orange-100" },
  default:      { label: "Resource",     icon: BookOpen,     color: "text-muted-foreground", bg: "bg-muted border-border" },
};

function getCategoryMeta(category: string) {
  return CATEGORY_META[category] ?? CATEGORY_META.default;
}

// ---------------------------------------------------------------------------
// Resource card
// ---------------------------------------------------------------------------
function ResourceCard({ resource }: { resource: CoachingResource }) {
  const meta = getCategoryMeta(resource.category);
  const Icon = meta.icon;

  return (
    <Card className="group flex flex-col hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className={cn("p-2.5 rounded-xl border shrink-0", meta.bg)}>
            <Icon className={cn("h-5 w-5", meta.color)} />
          </div>
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {meta.label}
          </Badge>
        </div>
        <CardTitle className="text-base leading-snug mt-3 group-hover:text-brand-600 transition-colors">
          {resource.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <CardDescription className="leading-relaxed text-sm flex-1">
          {resource.description}
        </CardDescription>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 group-hover:border-brand-300 group-hover:text-brand-600 transition-colors"
          asChild
        >
          <Link href={`/dashboard/coaching/${resource.id}`}>
            Read Resource
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------
function ResourceSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-muted" />
        <div className="w-16 h-5 rounded-full bg-muted" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
      <div className="space-y-1.5 pt-1">
        <div className="h-3 bg-muted rounded" />
        <div className="h-3 bg-muted rounded" />
        <div className="h-3 bg-muted rounded w-5/6" />
      </div>
      <div className="h-8 bg-muted rounded-lg" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Paywall overlay for free-tier users
// ---------------------------------------------------------------------------
function PaywallOverlay() {
  return (
    <div className="relative">
      {/* Blurred preview cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 select-none pointer-events-none">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-3 blur-sm opacity-60">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-brand-100" />
              <div className="w-16 h-5 rounded-full bg-muted" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="h-3 bg-muted rounded" />
              <div className="h-3 bg-muted rounded" />
              <div className="h-3 bg-muted rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>

      {/* Overlay card */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="bg-white/97 backdrop-blur-sm rounded-2xl border shadow-2xl p-8 text-center max-w-sm w-full space-y-5">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-gold-100 flex items-center justify-center ring-4 ring-gold-200">
              <Lock className="h-7 w-7 text-gold-600" />
            </div>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">Members Only</h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Unlock the full Coaching Library, AI Training Academy, Peer
              Connection, Account Marketplace, and Platform Guides with a
              one-time KES 500 membership fee.
            </p>
          </div>
          <div className="space-y-2 text-left text-xs text-muted-foreground">
            {["Coaching Library — 40+ guides & templates",
              "AI Training Academy — RLHF, LiDAR & annotation",
              "Account Marketplace — apprenticeship matching",
              "Platform Guides — Upwork, Fiverr & Toptal setup",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-growth-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <Link href="/dashboard/payment">
            <Button size="lg" className="w-full gap-2 bg-gold-500 hover:bg-gold-600 text-white">
              <Zap className="h-4 w-4" />
              Activate Membership — KES 500
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            One-time fee · Instant access · No subscription
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// All categories filter pill
// ---------------------------------------------------------------------------
const ALL = "all";

function FilterPills({
  active,
  categories,
  onChange,
}: {
  active: string;
  categories: string[];
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(ALL)}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
          active === ALL
            ? "bg-brand-500 text-white border-brand-500"
            : "bg-background text-muted-foreground border-border hover:border-brand-300 hover:text-brand-600"
        )}
      >
        All Resources
      </button>
      {categories.map((cat) => {
        const meta = getCategoryMeta(cat);
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              active === cat
                ? "bg-brand-500 text-white border-brand-500"
                : "bg-background text-muted-foreground border-border hover:border-brand-300 hover:text-brand-600"
            )}
          >
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function CoachingPage() {
  const { user } = useAuth();
  const isMember = user?.role === "member" || user?.role === "admin";

  const [resources, setResources] = useState<CoachingResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL);

  useEffect(() => {
    if (!isMember) {
      setIsLoading(false);
      return;
    }
    coachingApi
      .listResources()
      .then(setResources)
      .catch((err) => setError(err.message ?? "Failed to load resources."))
      .finally(() => setIsLoading(false));
  }, [isMember]);

  // Derived lists
  const categories = [...new Set(resources.map((r) => r.category))];
  const filtered = resources.filter((r) => {
    const matchCat = activeCategory === ALL || r.category === activeCategory;
    const matchSearch =
      search.trim() === "" ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-white/80 backdrop-blur-sm border-b px-4 sm:px-6 h-16 shrink-0">
        <button
          data-openmenu="true"
          className="lg:hidden p-2 rounded-lg hover:bg-muted -ml-1"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5 text-muted-foreground pointer-events-none" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <BookOpen className="h-5 w-5 text-brand-500 shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold truncate">Coaching Resources</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {isMember
                ? `${resources.length} resources available`
                : "Activate for KES 500 · One-time fee"}
            </p>
          </div>
        </div>
        <Badge variant={isMember ? "success" : "warning"}>
          {isMember ? "Member" : "Free Tier"}
        </Badge>
      </header>

      {/* Body */}
      <div className="flex-1 p-4 sm:p-6 animate-fade-in">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Section intro */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold">
                {isMember ? "Your Coaching Library" : "Coaching Library"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Expert-curated guides, templates, and strategies for Kenyan freelancers building digital careers.
              </p>
            </div>
            {isMember && !isLoading && (
              <Badge variant="success" className="self-start sm:self-auto gap-1.5">
                <Zap className="h-3 w-3" />
                Full Access Active
              </Badge>
            )}
          </div>

          {/* Paywall for free users */}
          {!isMember && <PaywallOverlay />}

          {/* Member content */}
          {isMember && (
            <>
              {/* Search + filter bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resources…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    aria-label="Search coaching resources"
                  />
                </div>
              </div>

              {categories.length > 0 && (
                <FilterPills
                  active={activeCategory}
                  categories={categories}
                  onChange={setActiveCategory}
                />
              )}

              {/* Loading */}
              {isLoading && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ResourceSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setError(null);
                      setIsLoading(true);
                      coachingApi
                        .listResources()
                        .then(setResources)
                        .catch((e) => setError(e.message))
                        .finally(() => setIsLoading(false));
                    }}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Resource grid */}
              {!isLoading && !error && filtered.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              )}

              {/* Empty search state */}
              {!isLoading && !error && filtered.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                  <p className="font-semibold text-muted-foreground">No resources found</p>
                  <p className="text-sm text-muted-foreground">
                    Try a different search term or category filter.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSearch(""); setActiveCategory(ALL); }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}

              {/* Loading indicator for initial fetch */}
              {isLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
