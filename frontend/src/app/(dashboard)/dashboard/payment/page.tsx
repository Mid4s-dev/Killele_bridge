"use client";

/**
 * Payment page — KES 100 registration fee via IntaSend.
 *
 * Flow:
 *   1. Page loads → checks if user is already a member (skip payment).
 *   2. User clicks "Pay Now" → POST /payments/initiate → receive checkout_url.
 *   3. User is redirected to IntaSend checkout in a new tab.
 *   4. After returning, page polls GET /payments/status/{id} every 4 s
 *      until status is "complete", "failed", or "cancelled" (max 60 s).
 *   5. On "complete" → refresh user object from /auth/me so role updates.
 *
 * Security:
 *   - No payment card data ever passes through this frontend.
 *   - The payment_id from step 2 is stored in component state only (no localStorage).
 *   - Role upgrade is verified server-side via webhook — never trusted from client.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  Menu,
  RefreshCw,
  ShieldCheck,
  XCircle,
  Zap,
} from "lucide-react";

import { paymentApi } from "@/lib/api";
import { formatKES } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaymentStatus } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const POLL_INTERVAL_MS = 4_000;
const POLL_TIMEOUT_MS  = 60_000; // stop polling after 60 s

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AlreadyMemberState() {
  return (
    <div className="text-center space-y-5 py-8 animate-fade-in">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-growth-100 flex items-center justify-center">
          <BadgeCheck className="h-9 w-9 text-growth-500" />
        </div>
      </div>
      <div>
        <h3 className="font-display text-xl font-bold">You&apos;re a Member!</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          Your registration fee has already been paid. You have full access to all
          coaching resources.
        </p>
      </div>
      <Link href="/dashboard/coaching">
        <Button size="lg" variant="success" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Browse Coaching Resources
        </Button>
      </Link>
    </div>
  );
}

function PaymentSuccessState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="text-center space-y-5 py-6 animate-fade-in">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-growth-100 flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9 text-growth-500" />
        </div>
      </div>
      <div>
        <h3 className="font-display text-xl font-bold">Payment Confirmed!</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
          Your KES {Number(process.env.NEXT_PUBLIC_REGISTRATION_FEE_KES || 100)} registration fee has been received. Your account has been
          upgraded to <strong>Member</strong> status.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button size="lg" variant="success" className="gap-2" onClick={onContinue}>
          <Zap className="h-4 w-4" />
          Access Coaching Resources
        </Button>
        <Link href="/dashboard/kyc">
          <Button size="lg" variant="outline" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Verify Identity
          </Button>
        </Link>
      </div>
    </div>
  );
}

function PaymentFailedState({
  onRetry,
  isRetrying,
}: {
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="text-center space-y-5 py-6 animate-fade-in">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="h-9 w-9 text-destructive" />
        </div>
      </div>
      <div>
        <h3 className="font-display text-xl font-bold">Payment Unsuccessful</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
          The payment could not be completed. No charges have been made to your
          account. Please try again.
        </p>
      </div>
      <Button size="lg" onClick={onRetry} disabled={isRetrying} className="gap-2">
        {isRetrying ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Retrying…</>
        ) : (
          <><RefreshCw className="h-4 w-4" /> Try Again</>
        )}
      </Button>
    </div>
  );
}

/** Animated polling indicator shown after the user returns from IntaSend */
function PollingState({ elapsed, timeout }: { elapsed: number; timeout: number }) {
  const progress = Math.min((elapsed / timeout) * 100, 100);
  return (
    <div className="space-y-5 py-4 animate-fade-in">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-50 border border-brand-100">
        <Loader2 className="h-5 w-5 text-brand-500 animate-spin shrink-0" />
        <div>
          <p className="text-sm font-semibold text-brand-800">
            Confirming your payment…
          </p>
          <p className="text-xs text-brand-600 mt-0.5">
            Waiting for IntaSend to confirm the transaction. This may take a few moments.
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Checking payment status</span>
          <span>{Math.round(elapsed / 1000)}s</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function PaymentPage() {
  const { user, refreshUser } = useAuth();
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollElapsed, setPollElapsed] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (user?.phone_number && !phoneNumber) {
      setPhoneNumber(user.phone_number);
    }
  }, [user]);

  const pollTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  // Stop polling helper
  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    setIsPolling(false);
  }, []);

  // Start polling payment status
  const startPolling = useCallback(
    (pid: number) => {
      elapsedRef.current = 0;
      setIsPolling(true);
      setPollElapsed(0);

      pollTimer.current = setInterval(async () => {
        elapsedRef.current += POLL_INTERVAL_MS;
        setPollElapsed(elapsedRef.current);

        try {
          const result = await paymentApi.getStatus(pid);
          setPaymentStatus(result.status);

          if (result.status === "complete") {
            stopPolling();
            await refreshUser(); // pull updated role from backend
            toast({ variant: "success", title: "Payment confirmed!", description: "Your account is now active." });
          } else if (result.status === "failed" || result.status === "cancelled") {
            stopPolling();
            toast({ variant: "destructive", title: "Payment unsuccessful", description: "Please try again." });
          }
        } catch {
          // Silently continue polling on transient errors
        }

        // Timeout guard
        if (elapsedRef.current >= POLL_TIMEOUT_MS) {
          stopPolling();
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling, refreshUser]
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  async function handleInitiate() {
    if (!phoneNumber) {
      toast({ variant: "destructive", title: "Phone number required", description: "Please enter your M-PESA phone number." });
      return;
    }
    setIsInitiating(true);
    try {
      const checkout = await paymentApi.initiate({ phone_number: phoneNumber });
      setPaymentId(checkout.payment_id);
      setPaymentStatus("pending");

      // Begin polling immediately
      startPolling(checkout.payment_id);
      toast({
        title: "Check your phone",
        description: "An M-PESA prompt has been sent to your phone. Enter your PIN to complete payment.",
      });
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Could not initiate payment",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsInitiating(false);
    }
  }

  async function handleRetry() {
    setPaymentStatus(null);
    setPaymentId(null);
    await handleInitiate();
  }

  function handleContinue() {
    window.location.href = "/dashboard/coaching";
  }

  // Guard: already a member
  const isMember = user?.role === "member" || user?.role === "admin";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
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
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold">Registration Payment</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            One-time fee · Secure IntaSend checkout
          </p>
        </div>
        <Badge variant={isMember ? "success" : "warning"}>
          {isMember ? "Member" : "Free Tier"}
        </Badge>
      </header>

      {/* Body */}
      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-lg mx-auto space-y-6 animate-fade-in">

          {/* Main card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-500" />
                Activate Your Membership
              </CardTitle>
              <CardDescription>
                Pay the one-time KES {Number(process.env.NEXT_PUBLIC_REGISTRATION_FEE_KES || 100)} registration fee to unlock full access
                to all coaching resources and community features.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Resolved states */}
              {isMember && <AlreadyMemberState />}
              {!isMember && paymentStatus === "complete" && (
                <PaymentSuccessState onContinue={handleContinue} />
              )}
              {!isMember && (paymentStatus === "failed" || paymentStatus === "cancelled") && (
                <PaymentFailedState onRetry={handleRetry} isRetrying={isInitiating} />
              )}

              {/* Active / initial states */}
              {!isMember && paymentStatus !== "complete" &&
                paymentStatus !== "failed" &&
                paymentStatus !== "cancelled" && (
                <div className="space-y-6">
                  {/* Polling indicator */}
                  {isPolling && (
                    <PollingState elapsed={pollElapsed} timeout={POLL_TIMEOUT_MS} />
                  )}

                  {/* Price breakdown */}
                  {!isPolling && (
                    <div className="rounded-xl border overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
                        <span className="text-sm font-semibold">Order Summary</span>
                        <Badge variant="info">One-time</Badge>
                      </div>
                      <div className="divide-y">
                        <div className="flex items-center justify-between px-4 py-3 text-sm">
                          <span className="text-muted-foreground">Kilele Bridge Membership</span>
                          <span className="font-semibold">{formatKES(Number(process.env.NEXT_PUBLIC_REGISTRATION_FEE_KES || 100))}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 text-sm">
                          <span className="text-muted-foreground">Processing fee</span>
                          <span className="font-semibold text-growth-600">Free</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 bg-brand-50">
                          <span className="font-bold text-brand-800">Total</span>
                          <span className="font-display text-lg font-bold text-brand-700">
                            {formatKES(Number(process.env.NEXT_PUBLIC_REGISTRATION_FEE_KES || 100))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* What you unlock */}
                  {!isPolling && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">What you unlock</p>
                      <ul className="space-y-2">
                        {[
                          "Full access to 40+ coaching resources",
                          "Portfolio review guides & templates",
                          "Legitimate job search strategies for Kenya",
                          "Client communication templates",
                          "Freelancer pricing framework (KES/USD)",
                          "Access to the Kilele Bridge member community",
                        ].map((item) => (
                          <li
                            key={item}
                            className="flex items-center gap-2.5 text-sm text-muted-foreground"
                          >
                            <CheckCircle2 className="h-4 w-4 text-growth-500 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Phone number input */}
                  {!isPolling && (
                    <div className="space-y-1.5 pt-2">
                      <Label htmlFor="phone">M-PESA Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. 254712345678"
                      />
                      <p className="text-xs text-muted-foreground">
                        We will send an STK push prompt to this number.
                      </p>
                    </div>
                  )}

                  {/* CTA */}
                  {!isPolling && (
                    <Button
                      size="lg"
                      className="w-full gap-2"
                      onClick={handleInitiate}
                      disabled={isInitiating || !phoneNumber}
                    >
                      {isInitiating ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Sending prompt…</>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" />
                          Pay {formatKES(Number(process.env.NEXT_PUBLIC_REGISTRATION_FEE_KES || 100))} via M-PESA
                        </>
                      )}
                    </Button>
                  )}

                  {/* Manual refresh if user returns without auto-detection */}
                  {isPolling && paymentId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => paymentApi.getStatus(paymentId).then((r) => {
                        setPaymentStatus(r.status);
                        if (r.status === "complete") {
                          stopPolling();
                          refreshUser();
                        }
                      })}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Check payment status manually
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trust & security row */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: ShieldCheck, label: "Secure Checkout", sub: "Powered by IntaSend" },
              { icon: CheckCircle2, label: "No Hidden Fees",  sub: `Exactly KES ${Number(process.env.NEXT_PUBLIC_REGISTRATION_FEE_KES || 100)}` },
              { icon: Zap,         label: "Instant Access",  sub: "On confirmation" },
            ].map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/40 border"
              >
                <Icon className="h-5 w-5 text-brand-500" />
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>

          {/* Help text */}
          <p className="text-center text-xs text-muted-foreground">
            Having trouble?{" "}
            <a
              href="mailto:support@kilelebridge.co.ke"
              className="text-brand-600 hover:underline"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
