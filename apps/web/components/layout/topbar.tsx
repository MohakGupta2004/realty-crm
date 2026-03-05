"use client";

import { Button } from "@/components/ui/button";
import { Menu01Icon, User02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAuth } from "@/contexts/AuthContext";
import { CreateLeadDialog } from "@/components/leads";

interface TopbarProps {
  onLeadCreated?: () => void;
}

export default function Topbar({ onLeadCreated }: TopbarProps) {
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-between px-6 py-3">
      <div className="flex items-center justify-center gap-2 text-sm font-medium">
        <div className="">
          <HugeiconsIcon icon={User02Icon} size={18} />
        </div>
        People
      </div>

      <div className="flex items-center gap-3">
        <CreateLeadDialog onLeadCreated={onLeadCreated} />
        <Button size="sm" variant="outline">
          <HugeiconsIcon icon={Menu01Icon} size={8} />
        </Button>
      </div>
    </div>
  );
}
