"use client";

export function SidebarSkeleton() {
  return (
    <div className="w-50 flex flex-col animate-pulse">
      {/* Logo area */}
      <div className="px-4 py-4 flex items-center gap-2">
        <div className="bg-gray-200 w-6 h-6 rounded" />
        <div className="bg-gray-200 h-4 w-12 rounded" />
      </div>

      {/* Search and Settings */}
      <nav className="flex flex-col gap-1 px-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="bg-gray-200 w-4 h-4 rounded" />
          <div className="bg-gray-200 h-4 w-16 rounded" />
        </div>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="bg-gray-200 w-4 h-4 rounded" />
          <div className="bg-gray-200 h-4 w-16 rounded" />
        </div>
      </nav>

      {/* Workspace label */}
      <div className="px-3 py-3 mt-2">
        <div className="bg-gray-200 h-4 w-20 rounded" />
      </div>

      {/* Workspace items */}
      <nav className="flex flex-col gap-1 px-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <div className="bg-gray-200 w-4 h-4 rounded" />
            <div className="bg-gray-200 h-4 w-20 rounded" />
          </div>
        ))}
      </nav>
    </div>
  );
}
