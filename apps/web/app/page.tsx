"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTable from "@/components/dashboard/DashboardTable";
import AuthModal from "@/components/auth/LoginModal";
import { isLoggedIn, getToken, API_BASE_URL } from "@/lib/auth";

// ── Auth state machine ───────────────────────────────────────────────
// "checking"       → loading spinner while we figure things out
// "unauthenticated"→ show login modal (providers / email form)
// "needs-workspace"→ show workspace-creation modal
// "ready"          → redirect to /dashboard (user has token + workspace)
type AuthState = "checking" | "unauthenticated" | "needs-workspace" | "ready";

export default function Home() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("checking");

  useEffect(() => {
    async function resolve() {
      // 1. No token → show login
      if (!isLoggedIn()) {
        setAuthState("unauthenticated");
        return;
      }

      // 2. Has token → check for workspace
      try {
        const res = await fetch(`${API_BASE_URL}/workspace`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.name) {
            // Has workspace → go to dashboard
            setAuthState("ready");
            router.replace("/dashboard");
            return;
          }
        }

        // Token valid but no workspace yet
        setAuthState("needs-workspace");
      } catch {
        // API error — treat as needing workspace
        setAuthState("needs-workspace");
      }
    }

    resolve();
  }, [router]);

  // Loading state
  if (authState === "checking" || authState === "ready") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="animate-pulse text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Skeleton dashboard behind the modal */}
      <DashboardSidebar />
      <DashboardTable />

      {/* Auth modal — shows login or workspace step based on state */}
      <AuthModal isAuthenticated={authState === "needs-workspace"} />
    </div>
  );
}
