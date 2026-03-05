"use client";

export function TopbarSkeleton() {
  return (
    <div className="flex items-center justify-between px-6 py-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="bg-gray-200 w-5 h-5 rounded" />
        <div className="bg-gray-200 h-4 w-16 rounded" />
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-gray-200 h-8 w-24 rounded-md" />
        <div className="bg-gray-200 h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}
