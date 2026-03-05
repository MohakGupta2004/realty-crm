"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error from backend
      const errorMsg = searchParams.get("error");
      if (errorMsg) {
        setError(decodeURIComponent(errorMsg));
        setTimeout(() => router.push("/auth/login"), 3000);
        return;
      }

      // The backend should have set the refresh token as HTTP-only cookie
      // We need to get the access token - either from URL param or by calling refresh
      const accessToken = searchParams.get("token");

      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
        router.push("/dashboard");
      } else {
        // Try to refresh to get the token
        const refreshed = await refreshToken();
        if (refreshed) {
          router.push("/dashboard");
        } else {
          setError("Authentication failed. Please try again.");
          setTimeout(() => router.push("/auth/login"), 3000);
        }
      }
    };

    handleCallback();
  }, [router, searchParams, refreshToken]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Completing sign in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
