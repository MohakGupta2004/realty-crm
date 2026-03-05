import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Filter, SlidersHorizontal } from "lucide-react";

// Column headers matching a CRM contacts/companies table
const columns = [
  "", // checkbox
  "Name",
  "Domain",
  "Employees",
  "People",
  "Address",
  "Account",
  "Created",
  "ICP",
  "LinkedIn",
  "Duplex",
];

// Number of skeleton rows to display
const ROW_COUNT = 12;

export default function DashboardTable() {
  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground">Companies</h2>
          <Skeleton className="h-5 w-8 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
            <Filter className="h-3 w-3" />
            <span>Filter</span>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
            <SlidersHorizontal className="h-3 w-3" />
            <span>Sort</span>
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground">
            <Plus className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-11 gap-2 border-b border-border px-4 py-2">
          {columns.map((col, i) => (
            <div key={i} className="text-xs font-medium text-muted-foreground">
              {col}
            </div>
          ))}
        </div>

        {/* Skeleton rows */}
        {Array.from({ length: ROW_COUNT }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-11 items-center gap-2 border-b border-border px-4 py-3"
          >
            {/* Checkbox */}
            <Skeleton className="h-4 w-4 rounded-sm" />
            {/* Name with colored dot */}
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{
                  backgroundColor: [
                    "#f97316",
                    "#3b82f6",
                    "#6366f1",
                    "#ef4444",
                    "#8b5cf6",
                    "#06b6d4",
                    "#ec4899",
                    "#10b981",
                    "#f59e0b",
                    "#14b8a6",
                    "#a855f7",
                    "#f43f5e",
                  ][rowIndex % 12],
                }}
              />
              <Skeleton className="h-3 w-16" />
            </div>
            {/* Remaining columns */}
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <span>+ Add New</span>
        <span className="ml-auto">
          <Skeleton className="h-3 w-20 inline-block" />
        </span>
      </div>
    </div>
  );
}
