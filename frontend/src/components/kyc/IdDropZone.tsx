"use client";

/**
 * IdDropZone — accessible file drop-zone for a single ID image.
 *
 * Security UX decisions:
 * - Accepts only image/jpeg, image/png, image/webp — no PDFs or executables.
 * - 5 MB hard limit enforced client-side (backend must enforce server-side too).
 * - Lock icon + "Securely Encrypted" badge visible at all times.
 * - File name is displayed but never logged or transmitted until submit.
 * - Preview uses a local object URL — never uploaded on drop.
 */
import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import {
  CheckCircle2,
  ImageIcon,
  Lock,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED = { "image/jpeg": [], "image/png": [], "image/webp": [] };
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

interface IdDropZoneProps {
  label: string;
  side: "front" | "back";
  file: File | null;
  onFileSelect: (file: File | null) => void;
  error?: string;
}

export default function IdDropZone({
  label,
  side,
  file,
  onFileSelect,
  error,
}: IdDropZoneProps) {
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setRejectReason(null);

      if (rejected.length > 0) {
        const code = rejected[0].errors[0]?.code;
        if (code === "file-too-large") {
          setRejectReason("File is too large. Maximum size is 5 MB.");
        } else if (code === "file-invalid-type") {
          setRejectReason("Only JPEG, PNG, and WebP images are accepted.");
        } else {
          setRejectReason("This file cannot be accepted.");
        }
        return;
      }

      if (accepted.length > 0) {
        const picked = accepted[0];
        // Revoke previous object URL to avoid memory leaks
        if (preview) URL.revokeObjectURL(preview);
        setPreview(URL.createObjectURL(picked));
        onFileSelect(picked);
      }
    },
    [onFileSelect, preview]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    multiple: false,
  });

  function remove(e: React.MouseEvent) {
    e.stopPropagation();
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setRejectReason(null);
    onFileSelect(null);
  }

  const hasError = !!(error || rejectReason);

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-brand-500" />
          {label}
        </p>
        {/* Encryption badge */}
        <span className="flex items-center gap-1 text-[11px] font-medium text-growth-700 bg-growth-50 border border-growth-200 rounded-full px-2 py-0.5">
          <Lock className="h-3 w-3" />
          Securely Encrypted
        </span>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed",
          "cursor-pointer transition-all duration-200 select-none",
          "min-h-[160px] px-4 py-6 text-center",
          isDragActive
            ? "dropzone-active border-brand-500 bg-brand-50"
            : file
            ? "border-growth-400 bg-growth-50"
            : hasError
            ? "border-destructive/50 bg-destructive/5"
            : "border-border hover:border-brand-400 hover:bg-muted/40"
        )}
        role="button"
        aria-label={`Upload ${label}`}
        tabIndex={0}
      >
        <input {...getInputProps()} aria-label={`File input for ${label}`} />

        {file && preview ? (
          /* ── Preview state ───────────────────────────────────────── */
          <div className="w-full space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={`Preview of ${label}`}
              className="mx-auto max-h-28 rounded-lg object-contain border shadow-sm"
            />
            <div className="flex items-center justify-center gap-2 text-xs text-growth-700">
              <CheckCircle2 className="h-4 w-4 text-growth-500" />
              <span className="font-medium truncate max-w-[200px]">{file.name}</span>
              <button
                type="button"
                onClick={remove}
                aria-label={`Remove ${label}`}
                className="ml-1 p-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* ── Empty / drag state ──────────────────────────────────── */
          <div className="space-y-2">
            <div
              className={cn(
                "mx-auto w-12 h-12 rounded-xl flex items-center justify-center",
                isDragActive ? "bg-brand-500 text-white" : "bg-muted text-muted-foreground"
              )}
            >
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {isDragActive ? "Drop it here" : "Drag & drop or click to upload"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                JPEG, PNG, WebP · Max 5 MB
              </p>
            </div>
            {/* Visual guide for what to capture */}
            <div className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-3 py-1",
              side === "front"
                ? "bg-brand-50 text-brand-700 border border-brand-100"
                : "bg-purple-50 text-purple-700 border border-purple-100"
            )}>
              <ShieldCheck className="h-3 w-3" />
              {side === "front"
                ? "Show your photo & full name"
                : "Show your ID number & back details"}
            </div>
          </div>
        )}
      </div>

      {/* Error messages */}
      {(error || rejectReason) && (
        <p role="alert" className="text-xs text-destructive flex items-center gap-1">
          <span>⚠</span>
          {error ?? rejectReason}
        </p>
      )}
    </div>
  );
}
