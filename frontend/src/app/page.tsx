/**
 * Root route — redirects based on auth state.
 * Authenticated  → /dashboard
 * Unauthenticated → /home (public landing page)
 *
 * This is a server component; the client-side redirect is handled
 * by the RootRedirect client component below.
 */
import RootRedirect from "@/components/RootRedirect";

export default function RootPage() {
  return <RootRedirect />;
}
