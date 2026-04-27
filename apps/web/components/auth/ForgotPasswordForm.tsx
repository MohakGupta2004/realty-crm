"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { API_BASE_URL } from "@/lib/auth";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export default function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Something went wrong");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex w-full flex-col items-center gap-4 text-center">
        <MailCheck className="h-10 w-10 text-emerald-400" />
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Check your email</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            If <span className="font-medium text-foreground">{email}</span> is registered, we&apos;ve sent a reset link. Check your inbox.
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-xs text-primary transition-colors hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to sign in</span>
      </button>

      <div className="text-center">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Forgot password?</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Enter your email and we&apos;ll send a reset link
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          Email
        </label>
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && email.trim() && handleSubmit()}
          className="border-border/60 bg-background/50 py-5 transition-colors focus:border-primary/60"
          autoFocus
        />
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !email.trim()}
        className="w-full py-5 transition-all"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
      </Button>
    </div>
  );
}
