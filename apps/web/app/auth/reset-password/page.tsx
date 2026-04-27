"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, Check, X, CheckCircle2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/auth";

const PASSWORD_RULES = [
  { label: "6–32 characters", test: (p: string) => p.length >= 6 && p.length <= 32 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const allRulesPass = PASSWORD_RULES.every((r) => r.test(password));

  async function handleSubmit() {
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Something went wrong");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-destructive">Invalid reset link.</p>
        <button onClick={() => router.replace("/")} className="mt-3 text-xs text-primary hover:underline">
          Back to sign in
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-400" />
        <div>
          <h2 className="text-xl font-semibold text-foreground">Password updated</h2>
          <p className="mt-1 text-sm text-muted-foreground">You can now sign in with your new password.</p>
        </div>
        <Button className="w-full py-5" onClick={() => router.replace("/")}>
          Go to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Set new password</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Choose a strong password for your account</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          New Password
        </label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && allRulesPass && handleSubmit()}
            className="border-border/60 bg-background/50 py-5 pr-10 transition-colors focus:border-primary/60"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {password.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-accent/5 p-4 shadow-sm animate-in zoom-in-95 duration-200">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b border-border/10 pb-1.5 leading-none">
            Password requirements
          </p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
            {PASSWORD_RULES.map((rule) => {
              const passes = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${passes ? "text-emerald-400" : "text-muted-foreground/60"}`}
                >
                  {passes ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>{rule.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !allRulesPass}
        className="w-full py-5 transition-all"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
      </Button>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 shadow-lg">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
