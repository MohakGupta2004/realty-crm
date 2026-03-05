"use client";

import { SidebarSkeleton } from "./SidebarSkeleton";
import { TopbarSkeleton } from "./TopbarSkeleton";
import { PeopleTableSkeleton } from "./PeopleTableSkeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-[#f1f1f1]">
      <SidebarSkeleton />
      <div className="flex flex-col flex-1">
        <TopbarSkeleton />
        <PeopleTableSkeleton />
      </div>
    </div>
  );
}
