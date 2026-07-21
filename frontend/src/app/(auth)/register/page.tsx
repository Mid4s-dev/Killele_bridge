"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Eye, EyeOff, Loader2, UserPlus } from "lucide-react";

import { authApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Schema — mirrors backend validation
// ---------------------------------------------------------------------------
const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Full name must be at least 2 characters.")
      .max(120),
    email: z.string().email("Enter a valid email address."),
    phone_number: z.string().regex(/^2547\d{8}$|^2541\d{8}$|^07\d{8}$|^01\d{8}$/, "Enter a valid Kenyan phone number (e.g. 2547XXXXXXXX or 07XXXXXXXX)."),
    role_requested: z.enum(["member", "vendor"], {
      errorMap: () => ({ message: "Select your account type." }),
    }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password is too long.")
      .regex(/[A-Z]/, "Must contain an uppercase letter.")
      .regex(/[a-z]/, "Must contain a lowercase letter.")
      .regex(/\d/, "Must contain a digit."),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Password strength meter
// ---------------------------------------------------------------------------
function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Weak", color: "bg-destructive" };
  if (score === 3) return { score, label: "Fair", color: "bg-yellow-400" };
  if (score === 4) return { score, label: "Good", color: "bg-brand-400" };
  return { score, label: "Strong", color: "bg-growth-500" };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role_requested: "member",
    },
  });

  const passwordValue = watch("password", "");
  const strength = getStrength(passwordValue);

  async function onSubmit(values: RegisterForm) {
    try {
      await authApi.register({
        full_name: values.full_name,
        email: values.email,
        phone_number: values.phone_number,
        password: values.password,
        role_requested: values.role_requested,
      });
      setSuccess(true);
      toast({
        variant: "success",
        title: "Account created!",
        description: "Please log in to continue.",
      });
      setTimeout(() => router.push("/login"), 1800);
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="text-center space-y-4 animate-fade-in py-10">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-growth-500" />
        </div>
        <h2 className="font-display text-2xl font-bold">You&apos;re in!</h2>
        <p className="text-muted-foreground">Your account has been created. Redirecting you to login…</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Heading */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Create your account</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Full name */}
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            type="text"
            autoComplete="name"
            placeholder="Jane Mwangi"
            aria-invalid={!!errors.full_name}
            {...register("full_name")}
          />
          {errors.full_name && (
            <p role="alert" className="text-xs text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="jane@example.co.ke"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p role="alert" className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Phone number */}
        <div className="space-y-1.5">
          <Label htmlFor="phone_number">Phone number</Label>
          <Input
            id="phone_number"
            type="tel"
            autoComplete="tel"
            placeholder="e.g. 254712345678"
            aria-invalid={!!errors.phone_number}
            {...register("phone_number")}
          />
          {errors.phone_number && (
            <p role="alert" className="text-xs text-destructive">{errors.phone_number.message}</p>
          )}
        </div>

        {/* Account type selector */}
        <div className="space-y-2.5">
          <Label>I am registering as a</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={cn(
                "relative flex cursor-pointer rounded-lg border-2 p-4 transition-all",
                watch("role_requested") === "member"
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <input
                type="radio"
                value="member"
                className="sr-only"
                {...register("role_requested")}
              />
              <div className="flex-1">
                <span className="block text-sm font-semibold text-gray-900">
                  Freelancer (Member)
                </span>
                <span className="mt-1 block text-xs text-gray-600">
                  Access training, coaching, and tools to build your freelancing business.
                </span>
              </div>
            </label>

            <label
              className={cn(
                "relative flex cursor-pointer rounded-lg border-2 p-4 transition-all",
                watch("role_requested") === "vendor"
                  ? "border-gold-500 bg-gold-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <input
                type="radio"
                value="vendor"
                className="sr-only"
                {...register("role_requested")}
              />
              <div className="flex-1">
                <span className="block text-sm font-semibold text-gray-900">
                  Vendor (Seller)
                </span>
                <span className="mt-1 block text-xs text-gray-600">
                  Post accounts for sale and offer tasks to the marketplace.
                </span>
              </div>
            </label>
          </div>
          {errors.role_requested && (
            <p role="alert" className="text-xs text-destructive">{errors.role_requested.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              aria-invalid={!!errors.password}
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Strength meter */}
          {passwordValue.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-300",
                      i <= strength.score ? strength.color : "bg-muted"
                    )}
                  />
                ))}
              </div>
              <p className={cn("text-xs font-medium", {
                "text-destructive": strength.score <= 2,
                "text-yellow-600": strength.score === 3,
                "text-brand-500": strength.score === 4,
                "text-growth-600": strength.score === 5,
              })}>
                {strength.label} password
              </p>
            </div>
          )}
          {errors.password && (
            <p role="alert" className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirm_password"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your password"
              aria-invalid={!!errors.confirm_password}
              className="pr-10"
              {...register("confirm_password")}
            />
            <button
              type="button"
              aria-label={showConfirm ? "Hide" : "Show"}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirm_password && (
            <p role="alert" className="text-xs text-destructive">{errors.confirm_password.message}</p>
          )}
        </div>

        {/* Terms */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-brand-600 hover:underline">Terms of Service</Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>.
          Your data is protected under the{" "}
          <span className="font-medium text-foreground">Kenya Data Protection Act, 2019</span>.
        </p>

        {/* Submit */}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
          ) : (
            <><UserPlus className="h-4 w-4" /> Create account</>
          )}
        </Button>
      </form>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1.5">🔒 Secure registration</span>
        <span className="flex items-center gap-1.5">🛡️ DPA compliant</span>
      </div>
    </div>
  );
}
