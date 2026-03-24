"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function SuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying your payment...");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(async () => {
      try {
        attempts++;
        const res = await api("/user/me");
        if (res.ok) {
           const data = await res.json();
           if (data.user?.isSubscribed) {
              clearInterval(interval);
              setStatus("Payment verified!");
              setIsDone(true);
              setTimeout(() => {
                router.replace("/");
              }, 1500);
              return;
           }
        }
        
        if (attempts >= 10) { // Give up polling after 20 seconds
           clearInterval(interval);
           setStatus("Taking a bit longer than expected...");
           setTimeout(() => {
             router.replace("/");
           }, 2000);
        }
      } catch (err) {
        // silently ignore fetch errors during polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex flex-col h-screen w-full items-center justify-center bg-background gap-6">
       {!isDone ? (
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
       ) : (
          <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-in zoom-in" />
       )}
       <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Success</h1>
          <p className="text-muted-foreground">{status}</p>
       </div>
    </div>
  );
}
