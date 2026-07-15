"use client";
/**
 * IntaSend redirects the user here after completing checkout.
 * We simply redirect them back to the payment page which is
 * already polling for the confirmed status.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PaymentSuccessRedirect() {
  const router = useRouter();
  useEffect(() => {
    // Give IntaSend a moment to fire the webhook, then return to our page
    const t = setTimeout(() => router.replace("/dashboard/payment"), 1500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      <p className="text-sm text-muted-foreground font-medium">
        Confirming your payment…
      </p>
    </div>
  );
}
