"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import PeopleTable from "@/components/people-table";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const peopleTableRef = useRef<{ refresh: () => void }>(null);

  const handleLeadCreated = useCallback(() => {
    // Trigger refresh
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // While auth state is being determined, show skeleton
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // If not authenticated, show skeleton with auth overlay
  if (!isAuthenticated) {
    return (
      <div className="relative">
        <DashboardSkeleton />
        {/* Auth overlay */}
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-2xl font-bold mb-2">Sign in required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to view your dashboard and manage your leads.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push("/auth/login")}>
                Sign in
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/auth/signup")}
              >
                Create account
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show real dashboard
  return (
    <div className="flex h-screen bg-[#f1f1f1]">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar onLeadCreated={handleLeadCreated} />
        <PeopleTable key={refreshTrigger} />
      </div>
    </div>
  );
}
