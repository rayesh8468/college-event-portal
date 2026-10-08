"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, AlertCircle, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/validations";

function FormField({
  label,
  required,
  error,
  children,
  hint,
}: {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PasswordRequirement({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {met ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />
      )}
      <span className={met ? "text-green-600" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "Registration failed");
      }

      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-foreground">VIT Event Portal</span>
            </Link>
            <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Join your college event community today
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-100 border border-green-200/20 px-4 py-3">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Full Name" required error={errors.name?.message}>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Your full name"
                  className="pl-10"
                  {...register("name")}
                />
              </div>
            </FormField>

            <FormField label="College Email" required error={errors.email?.message}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@vit.ac.in"
                  className="pl-10"
                  {...register("email")}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Only <code>@vit.ac.in</code> email addresses are allowed
              </p>
            </FormField>

            <FormField label="Password" required error={errors.password?.message}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Min 8 characters"
                  className="pl-10"
                  {...register("password")}
                />
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <PasswordRequirement
                  label="Uppercase letter"
                  met={/[A-Z]/.test(password)}
                />
                <PasswordRequirement
                  label="Lowercase letter"
                  met={/[a-z]/.test(password)}
                />
                <PasswordRequirement
                  label="Number"
                  met={/[0-9]/.test(password)}
                />
              </div>
            </FormField>

            <FormField label="Confirm Password" required error={errors.confirmPassword?.message}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  className="pl-10"
                  {...register("confirmPassword")}
                />
              </div>
            </FormField>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Terms */}
          <p className="mt-4 text-xs text-muted-foreground text-center">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>

          {/* Footer */}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
