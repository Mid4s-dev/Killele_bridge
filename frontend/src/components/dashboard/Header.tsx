"use client";

import { Menu, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}

export default function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 bg-white/80 backdrop-blur-sm border-b px-4 sm:px-6 h-16 shrink-0">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors -ml-1"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-lg font-bold text-foreground truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate hidden sm:block">{subtitle}</p>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Role badge */}
        {user?.role === "member" && (
          <Badge variant="success" className="hidden sm:flex">Member</Badge>
        )}
        {user?.role === "free" && (
          <Badge variant="warning" className="hidden sm:flex">Free</Badge>
        )}

        {/* Notification bell — placeholder */}
        <button
          className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
          {user?.full_name?.slice(0, 2) ?? "KB"}
        </div>
      </div>
    </header>
  );
}
