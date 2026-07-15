"use client";

/**
 * ProtectedRoute — wraps any page that requires authentication.
 *
 * Behaviour:
 * - While the auth state is loading, renders a full-screen spinner.
 * - If the user is not authenticated, redirects to /login.
 * - Optionally enforces a minimum role (e.g. "member" for coaching pages).
 * - If the user is authenticated but doesn't have the required role,
 *   redirects to /dashboard with a meaningful query parameter.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requiredRole && user) {
      const roleOrder: UserRole[] = ["free", "member", "admin"];
      const userLevel = roleOrder.indexOf(user.role);
      const requiredLevel = roleOrder.indexOf(requiredRole);
      if (userLevel < requiredLevel) {
        router.replace("/dashboard?upgrade=true");
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-sm text-muted-foreground font-medium">Loading your account…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
