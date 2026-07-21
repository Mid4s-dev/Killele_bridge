"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  Layers3,
  Lock,
  Search,
  ShieldCheck,
  CreditCard,
  LogOut,
  X,
  ChevronRight,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types";

// ---------------------------------------------------------------------------
// Nav item definitions
// ---------------------------------------------------------------------------
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  requiredRole?: UserRole;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",    href: "/dashboard",          icon: LayoutDashboard },
  { label: "Payment",      href: "/dashboard/payment",   icon: CreditCard },
  { label: "Verification", href: "/dashboard/kyc",       icon: ShieldCheck },
];

const SERVICE_NAV: NavItem[] = [
  { label: "Coaching",      href: "/dashboard/coaching",  icon: BookOpen,   requiredRole: "member" },
  { label: "LiDAR Training",href: "/dashboard/coaching",  icon: Layers3,    requiredRole: "member" },
  { label: "Job Leads",     href: "/dashboard/coaching",  icon: Search,     requiredRole: "member" },
  { label: "Portfolio",     href: "/dashboard/coaching",  icon: Briefcase,  requiredRole: "member" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const roleOrder: UserRole[] = ["free", "member", "admin"];
  const userLevel = user ? roleOrder.indexOf(user.role) : 0;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-30 h-full w-64 flex flex-col bg-brand-900 text-white",
          "transition-transform duration-300 ease-in-out",
          "lg:relative lg:translate-x-0 lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Main navigation"
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-brand-800 shrink-0">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Kilele Bridge"
              width={80}
              height={24}
              className="brightness-0 invert object-contain"
            />
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-brand-800 transition-colors"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User card */}
        <div className="px-4 py-4 border-b border-brand-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold uppercase shrink-0">
              {user?.full_name?.slice(0, 2) ?? "KB"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.full_name ?? "—"}</p>
              <p className="text-xs text-brand-300 truncate">{user?.email ?? "—"}</p>
            </div>
          </div>
          <div className="mt-2.5">
            {user?.role === "admin" && (
              <Badge variant="default" className="text-[10px]">Admin</Badge>
            )}
            {user?.role === "member" && (
              <Badge variant="success" className="text-[10px]">Member</Badge>
            )}
            {user?.role === "free" && (
              <Badge variant="warning" className="text-[10px]">Free Tier</Badge>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-brand-400">
            Navigation
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-brand-700 text-white"
                    : "text-brand-200 hover:bg-brand-800 hover:text-white"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-brand-300 group-hover:text-white")} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-brand-300" />}
              </Link>
            );
          })}

          <p className="px-3 mt-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-brand-400">
            Service Modules
          </p>
          {SERVICE_NAV.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const requiredLevel = item.requiredRole
              ? roleOrder.indexOf(item.requiredRole)
              : 0;
            const isLocked = userLevel < requiredLevel;

            return (
              <Link
                key={item.label}
                href={isLocked ? "/dashboard/payment" : item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                  isActive && !isLocked
                    ? "bg-brand-700 text-white"
                    : "text-brand-200 hover:bg-brand-800 hover:text-white",
                  isLocked && "opacity-60"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive && !isLocked ? "text-white" : "text-brand-300 group-hover:text-white")} />
                <span className="flex-1">{item.label}</span>
                {isLocked ? (
                  <Lock className="h-3.5 w-3.5 text-brand-400" />
                ) : isActive ? (
                  <ChevronRight className="h-3.5 w-3.5 text-brand-300" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade CTA for free users */}
        {user?.role === "free" && (
          <div className="mx-3 mb-3 p-3.5 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 border border-brand-500">
            <p className="text-xs font-semibold text-white mb-1">Unlock Full Access</p>
            <p className="text-[11px] text-brand-200 leading-snug mb-2.5">
              Complete your KES ${Number(process.env.NEXT_PUBLIC_REGISTRATION_FEE_KES || 100)} registration to access all coaching resources.
            </p>
            <Link
              href="/dashboard/payment"
              onClick={onClose}
              className="block text-center text-xs font-semibold bg-growth-500 hover:bg-growth-600 text-white py-1.5 px-3 rounded-lg transition-colors"
            >
              Pay Now — KES ${Number(process.env.NEXT_PUBLIC_REGISTRATION_FEE_KES || 100)}
            </Link>
          </div>
        )}

        {/* Logout */}
        <div className="px-3 pb-4 shrink-0 border-t border-brand-800 pt-3">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-brand-300 hover:bg-brand-800 hover:text-white transition-all duration-150"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
