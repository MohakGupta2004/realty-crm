"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import { leadsApi, type Lead } from "@/lib/leads";

interface DeleteLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadDeleted?: () => void;
}

export function DeleteLeadDialog({
  lead,
  open,
  onOpenChange,
  onLeadDeleted,
}: DeleteLeadDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!lead) return;

    setError(null);
    setIsLoading(true);

    try {
      await leadsApi.deleteLead(lead._id);
      onOpenChange(false);
      onLeadDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete lead");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Lead
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this lead? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {lead && (
          <div className="py-4">
            <p className="text-sm font-medium">Lead to delete:</p>
            <p className="text-sm text-muted-foreground">{lead.name}</p>
            <p className="text-sm text-muted-foreground">{lead.email}</p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Lead"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
