"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentLoaderProps {
  loading: boolean;
  className?: string;
  text?: string;
}

export function ContentLoader({ loading, className, text = "Loading..." }: ContentLoaderProps) {
  if (!loading) return null;

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 gap-3 animate-in fade-in duration-300", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );
}
