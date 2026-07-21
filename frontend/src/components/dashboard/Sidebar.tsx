"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Brain,
  Briefcase,
  ChevronRight,
  CreditCard,
  FileCheck,
  Globe,
  LayoutDashboard,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types";

// ---------------------------------------------------------------------------
// Nav definitions
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  requiredRole?: UserRole;
  badge?: string;
}

const ACCOUNT_NAV: NavItem[] = [
  { label: "Dashboard",      href: "/dashboard",          icon: LayoutDashboard },
  { label: "Admin",          href: "/admin",              icon: ShieldCheck, requiredRole: "admin" },
  { label: "Payment",        href: "/dashboard/payment",  icon: CreditCard },
  { label: "Verification",   href: "/dashboard/kyc",      icon: FileCheck },
];

const MODULE_NAV: NavItem[] = [
  {
    label: "Coaching Library",
    href: "/dashboard/coaching",
    icon: Briefcase,
    requiredRole: "member",
  },
  {
    label: "AI Training Academy",
    href: "/dashboard/coaching",
    icon: Brain,
    requiredRole: "member",
    badge: "New",
  },
  {
    label: "Peer Connection",
    href: "/dashboard/coaching",
    icon: Users,
    requiredRole: "member",
  },
  {
    label: "Account Marketplace",
    href: "/dashboard/coaching",
    icon: RefreshCw,
    requiredRole: "member",
  },
  {
    label: "Platform Guides",
    href: "/dashboard/coaching",
    icon: Globe,
    requiredRole: "member",
  },
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

  function NavLink({ item }: { item: NavItem }) {
    const isActive =
      pathname === item.href || pathname.startsWith(item.href + "/");
    const requiredLevel = item.requiredRole
      ? roleOrder.indexOf(item.requiredRole)
      : 0;
    const isLocked = userLevel < requiredLevel;
    
    // Hide admin-only nav items from non-admin users
    if (item.requiredRole === "admin" && user?.role !== "admin") {
      return null;
    }
    
    const dest = isLocked ? "/dashboard/payment" : item.href;

    return (
      <Link
        href={dest}
        onClick={onClose}
        title={isLocked ? "Unlock with membership" : item.label}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
          isActive && !isLocked
            ? "bg-brand-700 text-white"
            : "text-brand-200 hover:bg-brand-800 hover:text-white",
          isLocked && "opacity-60"
        )}
        aria-current={isActive && !isLocked ? "page" : undefined}
      >
        <item.icon
          className={cn(
            "h-4 w-4 shrink-0",
            isActive && !isLocked
              ? "text-white"
              : "text-brand-300 group-hover:text-white"
          )}
        />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge && !isLocked && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gold-500 text-white leading-none">
            {item.badge}
          </span>
        )}
        {isLocked ? (
          <Lock className="h-3.5 w-3.5 text-brand-400 shrink-0" />
        ) : isActive ? (
          <ChevronRight className="h-3.5 w-3.5 text-brand-300 shrink-0" />
        ) : null}
      </Link>
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-30 h-full w-64 flex flex-col",
          "bg-brand-900 text-white",
          "transition-transform duration-300 ease-in-out",
          "lg:relative lg:translate-x-0 lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-brand-800 shrink-0">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Kilele Bridge"
              width={90}
              height={26}
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
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold uppercase shrink-0 ring-2 ring-brand-500/40">
              {user?.full_name?.slice(0, 2) ?? "KB"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.full_name ?? "—"}</p>
              <p className="text-xs text-brand-400 truncate">{user?.email ?? "—"}</p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            {user?.role === "admin"  && <Badge variant="default"  className="text-[10px]">Admin</Badge>}
            {user?.role === "member" && <Badge variant="success"  className="text-[10px]">Member</Badge>}
            {user?.role === "free"   && <Badge variant="warning"  className="text-[10px]">Free Tier</Badge>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-brand-500">
            Account
          </p>
          {ACCOUNT_NAV.map((item) => (
            <NavLink key={item.href + item.label} item={item} />
          ))}

          <p className="px-3 mt-5 mb-2 text-[10px] font-semibold uppercase tracking-widest text-brand-500">
            Service Modules
          </p>
          {MODULE_NAV.map((item) => (
            <NavLink key={item.label} item={item} />
          ))}
        </nav>

        {/* Upgrade CTA — free users only */}
        {user?.role === "free" && (
          <div className="mx-3 mb-3 p-4 rounded-xl bg-gradient-to-br from-brand-700 to-brand-800 border border-brand-600/50">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-gold-400 shrink-0" />
              <p className="text-xs font-bold text-white">Unlock Full Access</p>
            </div>
            <p className="text-[11px] text-brand-300 leading-snug mb-3">
              Pay once — get Coaching, AI Training, Account Marketplace, Peer
              Connection, and Platform Guides forever.
            </p>
            <Link
              href="/dashboard/payment"
              onClick={onClose}
              className="block text-center text-xs font-bold bg-gold-500 hover:bg-gold-600 text-white py-2 px-3 rounded-lg transition-colors"
            >
              Activate — KES 500
            </Link>
          </div>
        )}

        {/* Logout */}
        <div className="px-3 pb-4 shrink-0 border-t border-brand-800 pt-3">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-brand-400 hover:bg-brand-800 hover:text-white transition-all duration-150"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
