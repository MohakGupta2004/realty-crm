"use client";

import { useState, useEffect, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  User02Icon,
  Mail01Icon,
  Building01Icon,
  Call02Icon,
  MoreVerticalIcon,
  Edit02Icon,
  Delete01Icon,
} from "@hugeicons/core-free-icons";
import { Loader2, AlertCircle } from "lucide-react";
import { leadsApi, type Lead } from "@/lib/leads";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { EditLeadDialog, DeleteLeadDialog } from "@/components/leads";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PeopleTable() {
  const { currentWorkspace } = useWorkspace();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [cols, setCols] = useState([40, 240, 260, 160, 160, 100, 60]);

  const fetchLeads = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await leadsApi.getLeads(currentWorkspace._id);
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch leads");
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const startResize = (index: number, e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = cols[index];

    const onMove = (e: MouseEvent) => {
      const newCols = [...cols];
      newCols[index] = Math.max(60, startWidth + (e.clientX - startX));
      setCols(newCols);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDeleteDialogOpen(true);
  };

  const grid = `
    ${cols[0]}px
    ${cols[1]}px
    ${cols[2]}px
    ${cols[3]}px
    ${cols[4]}px
    ${cols[5]}px
    ${cols[6]}px
  `;

  if (!currentWorkspace) {
    return (
      <div className="flex-1 rounded-lg bg-white m-3 flex items-center justify-center">
        <Alert className="max-w-md mx-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a workspace to view leads
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 rounded-lg bg-white m-3">
      <div className="rounded-t-lg overflow-hidden">
        {/* HEADER */}
        <div
          style={{ gridTemplateColumns: grid }}
          className="grid text-sm text-gray-500 border-b bg-gray-50"
        >
          <HeaderCell resize={(e: any) => startResize(0, e)}>
            <Checkbox />
          </HeaderCell>

          <HeaderCell resize={(e: any) => startResize(1, e)}>
            <HugeiconsIcon icon={User02Icon} size={14} />
            Name
          </HeaderCell>

          <HeaderCell resize={(e: any) => startResize(2, e)}>
            <HugeiconsIcon icon={Mail01Icon} size={14} />
            Email
          </HeaderCell>

          <HeaderCell resize={(e: any) => startResize(3, e)}>
            <HugeiconsIcon icon={Building01Icon} size={14} />
            Source
          </HeaderCell>

          <HeaderCell resize={(e: any) => startResize(4, e)}>
            <HugeiconsIcon icon={Call02Icon} size={14} />
            Phone
          </HeaderCell>

          <HeaderCell resize={(e: any) => startResize(5, e)}>Status</HeaderCell>

          <HeaderCell resize={(e: any) => startResize(6, e)}>
            <span></span>
          </HeaderCell>
        </div>

        {/* ERROR */}
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* LOADING */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && !error && leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <p className="text-sm">No leads found</p>
            <p className="text-xs mt-1">
              Create your first lead to get started
            </p>
          </div>
        )}

        {/* ROWS */}
        {!isLoading &&
          leads.map((lead) => (
            <div
              key={lead._id}
              style={{ gridTemplateColumns: grid }}
              className="grid text-sm border-b hover:bg-gray-50"
            >
              <Cell>
                <Checkbox />
              </Cell>

              <Cell>{lead.name}</Cell>

              <Cell>
                <Tag>{lead.email}</Tag>
              </Cell>

              <Cell>
                <Tag>{lead.source}</Tag>
              </Cell>

              <Cell>
                <Tag>{lead.phone}</Tag>
              </Cell>

              <Cell>
                <StatusBadge status={lead.status} />
              </Cell>

              <Cell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(lead)}>
                      <HugeiconsIcon
                        icon={Edit02Icon}
                        size={14}
                        className="mr-2"
                      />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(lead)}
                      className="text-destructive"
                    >
                      <HugeiconsIcon
                        icon={Delete01Icon}
                        size={14}
                        className="mr-2"
                      />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Cell>
            </div>
          ))}
      </div>

      {/* DIALOGS */}
      <EditLeadDialog
        lead={selectedLead}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onLeadUpdated={fetchLeads}
      />

      <DeleteLeadDialog
        lead={selectedLead}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onLeadDeleted={fetchLeads}
      />
    </div>
  );
}

function HeaderCell({
  children,
  resize,
}: {
  children: React.ReactNode;
  resize: any;
}) {
  return (
    <div className="relative flex items-center gap-2 px-4 py-2 border-r last:border-r-0">
      {children}
      <div
        onMouseDown={resize}
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-gray-400"
      />
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-2 flex items-center border-r last:border-r-0">
      {children}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 text-xs border rounded-md bg-gray-100 truncate max-w-full">
      {children}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: "new" | "contacted" | "converted" | "lost";
}) {
  const styles = {
    new: "bg-blue-100 text-blue-800 border-blue-200",
    contacted: "bg-yellow-100 text-yellow-800 border-yellow-200",
    converted: "bg-green-100 text-green-800 border-green-200",
    lost: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs border rounded-md capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}
