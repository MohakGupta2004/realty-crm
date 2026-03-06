import {
  Search,
  Settings,
  User,
  Building2,
  Target,
  CheckSquare,
  StickyNote,
} from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

// Sidebar navigation items - easy to add more later
const navItems = [
  { icon: Search, label: "Search" },
  { icon: Settings, label: "Settings" },
];

const workspaceItems = [
  { icon: User, label: "People" },
  { icon: Building2, label: "Companies" },
  { icon: Target, label: "Opportunities" },
  { icon: CheckSquare, label: "Tasks" },
  { icon: StickyNote, label: "Notes" },
];

export default function DashboardSidebar() {
  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4">
        <Image
          src="/logo.png"
          alt="RealtyCRM Logo"
          width={28}
          height={28}
          className="rounded-md"
        />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Top nav */}
      <nav className="flex flex-col gap-1 px-2">
        {navItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Workspace section */}
      <div className="mt-4 px-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
      </div>

      <nav className="flex flex-col gap-1 px-2">
        {workspaceItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Bottom spacer + skeleton avatar */}
      <div className="mt-auto border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </aside>
  );
}
