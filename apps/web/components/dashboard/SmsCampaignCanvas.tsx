"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  X,
  Play,
  Clock,
  Plus,
  Trash2,
  MessageSquare,
  Pause,
  Loader2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────
interface SmsStep {
  _id?: string;
  stepIndex: number;
  delaySeconds: number;
  message: string;
}

interface SmsCampaignDetails {
  _id: string;
  name: string;
  isActive?: boolean;
  isDefault?: boolean;
  steps: SmsStep[];
}

// ── Helpers ───────────────────────────────────────────────────────────
function formatDelay(secs: number): string {
  if (!secs || secs < 1) return "Immediately";
  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (mins) parts.push(`${mins}m`);
  if (parts.length === 0) parts.push(`${secs}s`);
  return parts.join(" ");
}

// ── Custom Nodes ──────────────────────────────────────────────────────
function SmsStepNode({ data }: NodeProps) {
  const isLocked = !(data as any).onEdit;
  const message = (data.message as string) || "";
  const preview = message.length > 80 ? `${message.slice(0, 80)}…` : message;
  return (
    <div
      className={`group flex w-[300px] flex-col rounded-xl border bg-card shadow-xl transition-all ${
        isLocked
          ? "border-blue-500/30 cursor-default opacity-90"
          : "border-border hover:border-muted-foreground/50 cursor-pointer"
      }`}
      onClick={() => (data as any).onEdit?.(data.step)}
    >
      {!data.isFirst && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-card !border-2 !border-muted-foreground/50"
        />
      )}
      <div className="flex items-start justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              SMS Step #{(data.stepIndex as number) + 1}
            </p>
            <p className="text-[12px] font-semibold text-foreground">
              {formatDelay(data.delaySeconds as number)}
            </p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 text-[12px] text-muted-foreground leading-relaxed min-h-[48px]">
        {preview || (
          <span className="italic text-muted-foreground/40">Empty message</span>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-border/50 px-4 py-2 text-[10px] text-muted-foreground/60">
        <Clock className="h-3 w-3" />
        Delay: {formatDelay(data.delaySeconds as number)}
      </div>

      <div className="absolute -right-10 top-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            (data as any).onDelete?.(data.step);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground hover:bg-red-500/20 hover:text-red-500"
          title="Delete Step"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-card !border-2 !border-muted-foreground/50"
      />
    </div>
  );
}

function AddNode({ data }: NodeProps) {
  return (
    <div className="flex w-[300px] items-center justify-center py-2">
      <Handle
        type="target"
        position={Position.Top}
        className="!border-none !bg-transparent text-transparent"
      />
      <button
        onClick={() => (data as any).onAdd?.()}
        className="flex items-center gap-2 rounded-full border border-dashed border-border bg-card px-4 py-2 text-[12px] text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground hover:bg-muted"
      >
        <Plus className="h-4 w-4" />
        Add Step
      </button>
    </div>
  );
}

const nodeTypes = {
  smsStepNode: SmsStepNode,
  addNode: AddNode,
};

// ══════════════════════════════════════════════════════════════════════
// MAIN CANVAS
// ══════════════════════════════════════════════════════════════════════
export default function SmsCampaignCanvas({
  campaignId,
  campaignName,
  onClose,
}: {
  campaignId: string;
  campaignName: string;
  onClose: () => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [campaign, setCampaign] = useState<SmsCampaignDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState<SmsStep | null>(null);

  // ── Fetch campaign ────────────────────────────────────────────────────
  const fetchCampaign = useCallback(async () => {
    try {
      const res = await api(`/sms/campaign/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        const inner = data?.data ?? data;
        const camp =
          inner && typeof inner === "object" && "campaign" in inner
            ? (inner as any).campaign
            : inner;
        const sortedSteps: SmsStep[] = Array.isArray(camp?.steps)
          ? [...camp.steps].sort(
              (a: any, b: any) => (a.stepIndex ?? 0) - (b.stepIndex ?? 0),
            )
          : [];
        setCampaign({ ...camp, steps: sortedSteps });
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  // ── Step actions ──────────────────────────────────────────────────────
  const handleEditStep = useCallback((step: SmsStep) => {
    setEditingStep(step);
    setShowStepModal(true);
  }, []);

  const handleAddStep = useCallback(() => {
    setEditingStep(null);
    setShowStepModal(true);
  }, []);

  const handleDeleteStep = useCallback(
    async (step: SmsStep) => {
      if (!confirm("Delete this SMS step?")) return;
      try {
        const res = await api(
          `/sms/campaign/${campaignId}/step/${step.stepIndex}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          fetchCampaign();
        } else {
          alert("Failed to delete step");
        }
      } catch {
        alert("Error deleting step");
      }
    },
    [campaignId, fetchCampaign],
  );

  // ── Pause / Resume ────────────────────────────────────────────────────
  async function handlePauseResume() {
    if (!campaign) return;
    setActionPending(true);
    const path = campaign.isActive ? "pause" : "resume";
    try {
      const res = await api(`/sms/campaign/${campaignId}/${path}`, {
        method: "POST",
      });
      if (res.ok) {
        fetchCampaign();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.message || `Failed to ${path} campaign`);
      }
    } catch {
      alert("Network error");
    } finally {
      setActionPending(false);
    }
  }

  // ── Set as default ────────────────────────────────────────────────────
  async function handleSetDefault() {
    setActionPending(true);
    try {
      const res = await api(`/sms/campaign/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) fetchCampaign();
    } catch {
      /* silent */
    } finally {
      setActionPending(false);
    }
  }

  // ── Sync flow nodes/edges ─────────────────────────────────────────────
  useEffect(() => {
    if (!campaign) return;
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const startY = 80;
    const ySpacing = 200;
    const xPos = 380;
    let lastNodeId: string | null = null;
    let currY = startY;
    const isLocked = campaign.isActive === true;

    campaign.steps.forEach((step, index) => {
      const nodeId = `step-${step.stepIndex}`;
      newNodes.push({
        id: nodeId,
        type: "smsStepNode",
        position: { x: xPos, y: currY },
        data: {
          stepIndex: step.stepIndex,
          delaySeconds: step.delaySeconds,
          message: step.message,
          step,
          isFirst: index === 0,
          onEdit: isLocked ? undefined : handleEditStep,
          onDelete: isLocked ? undefined : handleDeleteStep,
        },
      });

      if (lastNodeId) {
        newEdges.push({
          id: `edge-${lastNodeId}-${nodeId}`,
          source: lastNodeId,
          target: nodeId,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed, color: "currentColor" },
          style: { strokeWidth: 2 },
          className: "text-muted-foreground/40",
        });
      }
      lastNodeId = nodeId;
      currY += ySpacing;
    });

    if (!isLocked) {
      const addNodeId = "add-btn";
      newNodes.push({
        id: addNodeId,
        type: "addNode",
        position: { x: xPos, y: currY },
        data: { onAdd: handleAddStep },
      });
      if (lastNodeId) {
        newEdges.push({
          id: `edge-${lastNodeId}-${addNodeId}`,
          source: lastNodeId,
          target: addNodeId,
          type: "straight",
          animated: true,
          style: { strokeWidth: 2, strokeDasharray: "5,5" },
          className: "text-muted-foreground/40",
        });
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [campaign, handleEditStep, handleDeleteStep, handleAddStep, setNodes, setEdges]);

  const nextStepIndex = campaign?.steps.length ?? 0;
  const isActive = !!campaign?.isActive;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background animate-in slide-in-from-right-8 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground leading-none">
                {campaignName}
              </h2>
              {campaign?.isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Default
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  isActive
                    ? "bg-green-500 animate-pulse"
                    : "bg-muted-foreground"
                }`}
              ></span>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                {isActive ? "Active" : "Paused"}
              </p>
              {campaign && (
                <span className="text-[10px] text-muted-foreground/40">
                  · {campaign.steps.length} step
                  {campaign.steps.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {campaign && !campaign.isDefault && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSetDefault}
              disabled={actionPending}
              className="h-8 gap-1.5 rounded-md px-3 text-xs"
            >
              <Star className="h-3.5 w-3.5" />
              Set Default
            </Button>
          )}

          {isActive ? (
            <Button
              size="sm"
              onClick={handlePauseResume}
              disabled={actionPending}
              className="h-8 gap-1.5 rounded-md px-4 text-xs bg-yellow-600 hover:bg-yellow-700 text-white border-0 shadow-md"
            >
              {actionPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Pause className="h-3.5 w-3.5 fill-current" />
              )}
              Pause Campaign
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handlePauseResume}
              disabled={actionPending}
              className="h-8 gap-1.5 rounded-md px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md"
            >
              {actionPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
              Resume Campaign
            </Button>
          )}

          <div className="h-4 w-px bg-border mx-1"></div>
          {!isActive && (
            <Button
              size="sm"
              onClick={handleAddStep}
              className="h-8 gap-1.5 rounded-md px-3 text-xs bg-muted hover:bg-muted-foreground/20 text-foreground border-0"
              variant="outline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Step
            </Button>
          )}
          <button
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading flow...
          </div>
        ) : !campaign ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Could not load campaign.
          </div>
        ) : campaign.steps.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  No steps yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60 leading-relaxed">
                  Add your first SMS step to start the drip sequence.
                </p>
              </div>
              <Button size="sm" onClick={handleAddStep} className="h-8 gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add First Step
              </Button>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            className="bg-background"
          >
            <Background
              gap={24}
              size={2}
              className="text-muted-foreground/20"
              color="currentColor"
            />
            <Controls className="[&>button]:!bg-card [&>button]:!border-b-border [&>button]:!text-foreground [&>button:hover]:!bg-muted !shadow-md" />
          </ReactFlow>
        )}
      </div>

      {showStepModal && (
        <SmsStepEditorModal
          campaignId={campaignId}
          step={editingStep}
          nextStepIndex={nextStepIndex}
          onClose={() => setShowStepModal(false)}
          onSuccess={() => {
            setShowStepModal(false);
            fetchCampaign();
          }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Step Editor Modal
// ══════════════════════════════════════════════════════════════════════
const DELAY_PRESETS = [
  { label: "Immediately", seconds: 0 },
  { label: "5 minutes", seconds: 300 },
  { label: "1 hour", seconds: 3600 },
  { label: "1 day", seconds: 86400 },
  { label: "3 days", seconds: 259200 },
  { label: "1 week", seconds: 604800 },
];

function SmsStepEditorModal({
  campaignId,
  step,
  nextStepIndex,
  onClose,
  onSuccess,
}: {
  campaignId: string;
  step: SmsStep | null;
  nextStepIndex: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!step;
  const [message, setMessage] = useState(step?.message || "");
  const [delaySeconds, setDelaySeconds] = useState<number>(
    step?.delaySeconds ?? 0,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const charCount = message.length;
  const segments = charCount === 0 ? 0 : Math.ceil(charCount / 160);

  async function handleSubmit() {
    if (!message.trim()) {
      setError("Message is required");
      return;
    }
    if (delaySeconds < 0) {
      setError("Delay must be 0 or greater");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const endpoint = isEditing
        ? `/sms/campaign/${campaignId}/step/${step!.stepIndex}`
        : `/sms/campaign/${campaignId}/step`;
      const method = isEditing ? "PUT" : "POST";
      const payload: any = {
        message: message.trim(),
        delaySeconds: Number(delaySeconds),
      };
      if (!isEditing) payload.stepIndex = nextStepIndex;

      const res = await api(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Failed to save step");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {isEditing
                  ? `Edit Step ${step!.stepIndex + 1}`
                  : `Add Step ${nextStepIndex + 1}`}
              </h2>
              <p className="text-[11px] text-muted-foreground/60">
                Configure timing and message body for this SMS.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Delay */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <Clock className="h-3 w-3" />
              Delay before sending
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {DELAY_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setDelaySeconds(p.seconds)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] transition-colors ${
                    delaySeconds === p.seconds
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                      : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.04]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={delaySeconds}
                onChange={(e) =>
                  setDelaySeconds(parseInt(e.target.value, 10) || 0)
                }
                className="h-9 max-w-[180px] bg-muted/50 text-[13px]"
              />
              <span className="text-[11px] text-muted-foreground">
                seconds · {formatDelay(delaySeconds)}
              </span>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="mb-2 flex items-center justify-between text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" />
                Message
              </span>
              <span className="text-[10px] normal-case text-muted-foreground/50">
                {charCount} chars · {segments} segment{segments === 1 ? "" : "s"}
              </span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi {{name}}, thanks for reaching out about the property at..."
              rows={6}
              className="w-full rounded-md border border-border bg-muted/50 p-3 text-[13px] text-foreground outline-none focus:border-blue-500/50 resize-none"
            />
            <p className="mt-1.5 text-[10px] text-muted-foreground/50">
              Use <code className="bg-white/[0.04] px-1 rounded">{"{{name}}"}</code>{" "}
              and other variables for personalization. Each 160 chars = 1
              segment.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-[11px] text-red-400">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
            className="h-8 text-xs min-w-[100px]"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Add Step"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
