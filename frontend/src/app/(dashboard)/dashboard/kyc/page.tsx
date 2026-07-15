"use client";

/**
 * KYC Verification Wizard — 3 steps:
 *   Step 1: Introduction & privacy notice
 *   Step 2: ID upload (front + back) with drop-zones
 *   Step 3: Review & submit
 *
 * Privacy & compliance:
 * - Files never leave the browser until the user explicitly clicks "Submit".
 * - Client-side type/size validation before any network request.
 * - Compliance notices reference the Kenya Data Protection Act, 2019.
 * - Backend must encrypt files at rest and restrict access to ADMIN role only.
 */
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileImage,
  Info,
  Lock,
  Menu,
  Send,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import { kycApi } from "@/lib/api";
import { cn } from "@/lib/utils";
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
import IdDropZone from "@/components/kyc/IdDropZone";
import KycStatusBanner, { KycStepIndicator } from "@/components/kyc/KycStatusBanner";
import type { KycStatus } from "@/types";

const STEP_LABELS = ["Introduction", "Upload ID", "Review & Submit"];

// ---------------------------------------------------------------------------
// Step 1 — Introduction
// ---------------------------------------------------------------------------
function StepIntro({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* What & why */}
      <div className="flex gap-3 p-4 rounded-xl bg-brand-50 border border-brand-100">
        <Info className="h-5 w-5 text-brand-500 mt-0.5 shrink-0" />
        <div className="text-sm text-brand-800">
          <p className="font-semibold mb-1">Why do we need to verify your identity?</p>
          <p className="leading-relaxed opacity-90">
            As a platform facilitating payments and professional services, Kilele Bridge
            is required to verify member identities under{" "}
            <strong>Kenya&apos;s Anti-Money Laundering regulations</strong> and our own
            commitment to a trusted community.
          </p>
        </div>
      </div>

      {/* What you'll need */}
      <div>
        <p className="text-sm font-semibold mb-3">What you&apos;ll need</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: FileImage, label: "National ID — Front", desc: "Clear photo showing your name, photo, and ID number" },
            { icon: FileImage, label: "National ID — Back",  desc: "Clear photo showing the back of your ID card" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 p-3 rounded-xl border bg-background"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                <item.icon className="h-4 w-4 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy commitments */}
      <div className="rounded-xl border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b">
          <Lock className="h-4 w-4 text-growth-600" />
          <p className="text-sm font-semibold">How we protect your data</p>
          <Badge variant="success" className="ml-auto text-[10px]">DPA Compliant</Badge>
        </div>
        <ul className="divide-y">
          {[
            "Your ID images are encrypted at rest using AES-256.",
            "Only authorised Kilele Bridge compliance staff can view your documents.",
            "Documents are retained for no longer than 12 months after account closure.",
            "We never share your identity documents with third parties.",
            "Your rights under the Kenya Data Protection Act, 2019 are fully respected.",
          ].map((point) => (
            <li key={point} className="flex items-start gap-2.5 px-4 py-2.5 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-growth-500 mt-0.5 shrink-0" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      <Button size="lg" className="w-full gap-2" onClick={onNext}>
        I understand — Continue
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Upload
// ---------------------------------------------------------------------------
interface UploadErrors {
  front?: string;
  back?: string;
}

function StepUpload({
  frontFile,
  backFile,
  errors,
  onFront,
  onBackFile,
  onNext,
  onPrev,
}: {
  frontFile: File | null;
  backFile: File | null;
  errors: UploadErrors;
  onFront: (f: File | null) => void;
  onBackFile: (f: File | null) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tips banner */}
      <div className="flex gap-2.5 p-3.5 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs leading-relaxed">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-500" />
        <span>
          <strong>Tips for a clear photo:</strong> Good lighting, no glare, all
          four corners visible, text must be readable.
        </span>
      </div>

      {/* Drop zones */}
      <div className="space-y-5">
        <IdDropZone
          label="Front of National ID"
          side="front"
          file={frontFile}
          onFileSelect={onFront}
          error={errors.front}
        />
        <IdDropZone
          label="Back of National ID"
          side="back"
          file={backFile}
          onFileSelect={onBackFile}
          error={errors.back}
        />
      </div>

      {/* Encryption reminder */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5 text-growth-500" />
        <span>Files are encrypted before transmission and stored securely.</span>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 gap-2" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          className="flex-1 gap-2"
          onClick={onNext}
          disabled={!frontFile || !backFile}
        >
          Review
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Review & Submit
// ---------------------------------------------------------------------------
function StepReview({
  frontFile,
  backFile,
  isSubmitting,
  onSubmit,
  onBack,
}: {
  frontFile: File | null;
  backFile: File | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <p className="text-sm text-muted-foreground">
        Review the images you&apos;re about to submit. Once submitted, our team
        will verify them within 1–2 business days.
      </p>

      {/* File summary */}
      <div className="rounded-xl border divide-y overflow-hidden">
        {[
          { label: "Front of National ID", file: frontFile },
          { label: "Back of National ID",  file: backFile },
        ].map(({ label, file }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-growth-100 flex items-center justify-center shrink-0">
              <FileImage className="h-4 w-4 text-growth-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground truncate">{file?.name ?? "—"}</p>
            </div>
            <CheckCircle2 className="h-4 w-4 text-growth-500 shrink-0" />
          </div>
        ))}
      </div>

      {/* Final consent */}
      <div className="flex gap-2.5 p-4 rounded-xl bg-muted/50 border text-sm text-muted-foreground leading-relaxed">
        <ShieldCheck className="h-5 w-5 text-brand-500 mt-0.5 shrink-0" />
        <span>
          By submitting, you consent to Kilele Bridge processing your identity
          documents for verification purposes under the{" "}
          <strong className="text-foreground">Kenya Data Protection Act, 2019</strong>.
          Your documents will be encrypted and accessible only to authorised staff.
        </span>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 gap-2" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button className="flex-1 gap-2" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
          ) : (
            <><Send className="h-4 w-4" /> Submit for Verification</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success screen
// ---------------------------------------------------------------------------
function SubmitSuccess() {
  return (
    <div className="text-center space-y-5 py-6 animate-fade-in">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-growth-100 flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9 text-growth-500" />
        </div>
      </div>
      <div>
        <h3 className="font-display text-xl font-bold">Documents Submitted!</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
          Your National ID has been securely received. Our compliance team will
          review it within <strong>1–2 business days</strong>. You&apos;ll be
          notified once verified.
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-growth-700 bg-growth-50 border border-growth-200 rounded-full px-4 py-2 w-fit mx-auto">
        <Lock className="h-3.5 w-3.5" />
        Documents encrypted and stored securely
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function KycPage() {
  const [step, setStep] = useState(1);
  const [kycStatus, setKycStatus] = useState<KycStatus>("not_started");
  const [statusLoading, setStatusLoading] = useState(true);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [uploadErrors, setUploadErrors] = useState<{ front?: string; back?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    kycApi
      .getStatus()
      .then((r) => {
        setKycStatus(r.status);
        if (r.status === "pending" || r.status === "verified") {
          setSubmitted(true);
        }
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, []);

  function validateUpload(): boolean {
    const errs: { front?: string; back?: string } = {};
    if (!frontFile) errs.front = "Please upload the front of your National ID.";
    if (!backFile) errs.back = "Please upload the back of your National ID.";
    setUploadErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!frontFile || !backFile) return;
    setIsSubmitting(true);
    try {
      await kycApi.submit(frontFile, backFile);
      setSubmitted(true);
      setKycStatus("pending");
      toast({ variant: "success", title: "Documents submitted", description: "We'll review them within 1–2 business days." });
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-white/80 backdrop-blur-sm border-b px-4 sm:px-6 h-16 shrink-0">
        <button data-openmenu="true" className="lg:hidden p-2 rounded-lg hover:bg-muted -ml-1" aria-label="Open navigation">
          <Menu className="h-5 w-5 text-muted-foreground pointer-events-none" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold">Identity Verification</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Secure KYC process — Kenya Data Protection Act compliant
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-growth-700 bg-growth-50 border border-growth-200 rounded-full px-3 py-1.5 font-medium">
          <Lock className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">256-bit Encrypted</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-xl mx-auto space-y-6 animate-fade-in">

          {/* Status banner */}
          {!statusLoading && (
            <KycStatusBanner status={kycStatus} />
          )}

          {/* Main card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-brand-500" />
                    Verify Your Identity
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Upload your Kenyan National ID to complete verification
                  </CardDescription>
                </div>
              </div>

              {/* Step indicator */}
              {!submitted && (
                <div className="mt-4 flex justify-center">
                  <KycStepIndicator
                    currentStep={step}
                    totalSteps={3}
                    stepLabels={STEP_LABELS}
                  />
                </div>
              )}
            </CardHeader>

            <CardContent>
              {submitted ? (
                <SubmitSuccess />
              ) : (
                <>
                  {step === 1 && <StepIntro onNext={() => setStep(2)} />}
                  {step === 2 && (
                    <StepUpload
                      frontFile={frontFile}
                      backFile={backFile}
                      errors={uploadErrors}
                      onFront={setFrontFile}
                      onBackFile={setBackFile}
                      onNext={() => {
                        if (validateUpload()) setStep(3);
                      }}
                      onPrev={() => setStep(1)}
                    />
                  )}
                  {step === 3 && (
                    <StepReview
                      frontFile={frontFile}
                      backFile={backFile}
                      isSubmitting={isSubmitting}
                      onSubmit={handleSubmit}
                      onBack={() => setStep(2)}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Privacy footer */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p className="flex items-center justify-center gap-1.5">
              <Lock className="h-3 w-3" />
              Your documents are encrypted at rest and in transit.
            </p>
            <p>
              Questions?{" "}
              <a href="mailto:privacy@kilelebridge.co.ke" className="text-brand-600 hover:underline">
                privacy@kilelebridge.co.ke
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
