"use client";

export function PeopleTableSkeleton() {
  return (
    <div className="flex-1 rounded-lg bg-white m-3 animate-pulse">
      <div className="rounded-t-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-6 text-sm border-b bg-gray-50">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-3 border-r last:border-r-0"
            >
              <div className="bg-gray-200 w-4 h-4 rounded" />
              <div className="bg-gray-200 h-4 w-16 rounded" />
            </div>
          ))}
        </div>

        {/* Rows */}
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="grid grid-cols-6 text-sm border-b">
            {[1, 2, 3, 4, 5, 6].map((col) => (
              <div key={col} className="px-4 py-3 border-r last:border-r-0">
                <div className="bg-gray-200 h-4 w-full rounded" />
              </div>
            ))}
          </div>
        ))}

        {/* Add row */}
        <div className="px-4 py-3">
          <div className="bg-gray-200 h-4 w-24 rounded" />
        </div>
      </div>
    </div>
  );
}
