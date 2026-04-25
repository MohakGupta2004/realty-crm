"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Clock,
  MessageSquare,
  Tag,
  Phone,
  CheckCircle2,
  ShoppingCart,
  Globe2,
  Hash,
  Loader2,
  Star,
  PauseCircle,
  PlayCircle,
  Calendar,
  History as HistoryIcon,
  ArrowLeft,
  Send,
  Inbox as InboxIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { ContentLoader } from "@/components/ui/content-loader";
import SmsCampaignCanvas from "./SmsCampaignCanvas";

// ── Types ─────────────────────────────────────────────────────────────
interface SmsCampaign {
  _id: string;
  name: string;
  isActive?: boolean;
  isDefault?: boolean;
  steps?: any[];
  createdAt: string;
  updatedAt: string;
}

interface SmsStatus {
  isOnboarded: boolean;
  hasSMSCampaignEnabled: boolean;
  phoneNumber?: string;
  twilioNumber?: string;
  number?: string;
}

interface SmsCampaignsViewProps {
  workspaceId: string;
  userRole?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `about ${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `about ${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `about ${months} month${months > 1 ? "s" : ""} ago`;
}

function getNumber(s: SmsStatus | null): string | undefined {
  if (!s) return undefined;
  return s.phoneNumber || s.twilioNumber || s.number;
}

function unwrapCampaign(payload: any): { campaign: any; enrollments: any[] } {
  const inner = payload?.data ?? payload;
  if (inner && typeof inner === "object" && "campaign" in inner) {
    return {
      campaign: inner.campaign,
      enrollments: Array.isArray(inner.leads) ? inner.leads : [],
    };
  }
  return {
    campaign: inner,
    enrollments: Array.isArray(inner?.leads) ? inner.leads : [],
  };
}

const TABLE_COLUMNS = [
  { key: "name", label: "Name", icon: MessageSquare },
  { key: "default", label: "Default", icon: Star },
  { key: "status", label: "Status", icon: Tag },
  { key: "createdAt", label: "Created", icon: Clock },
];

// ══════════════════════════════════════════════════════════════════════
// MAIN VIEW
// ══════════════════════════════════════════════════════════════════════
export default function SmsCampaignsView({
  workspaceId,
}: SmsCampaignsViewProps) {
  const [status, setStatus] = useState<SmsStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<SmsCampaign | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCanvasFor, setShowCanvasFor] = useState<SmsCampaign | null>(null);
  const [togglingGlobal, setTogglingGlobal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // ── Fetch status ──────────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await api("/sms/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data?.data || data);
      }
    } catch {
      /* silent */
    } finally {
      setStatusLoading(false);
    }
  }, []);

  // ── Fetch campaigns ───────────────────────────────────────────────────
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await api("/sms/campaign");
      if (res.ok) {
        const data = await res.json();
        const list = data?.data || data?.campaigns || [];
        setCampaigns(Array.isArray(list) ? list : []);
      }
    } catch {
      /* silent */
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (status?.isOnboarded) {
      fetchCampaigns();
    } else {
      setCampaignsLoading(false);
    }
  }, [status?.isOnboarded, fetchCampaigns]);

  useEffect(() => {
    if (selectedCampaign) {
      const updated = campaigns.find((c) => c._id === selectedCampaign._id);
      if (updated) setSelectedCampaign(updated);
    }
  }, [campaigns]);

  // ── Toggle global SMS switch ──────────────────────────────────────────
  async function handleToggleGlobal(checked: boolean) {
    if (!status?.isOnboarded || togglingGlobal) return;
    setTogglingGlobal(true);
    try {
      const res = await api("/sms/status/toggle", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasSMSCampaignEnabled: checked }),
      });
      if (res.ok) {
        setStatus((prev) =>
          prev ? { ...prev, hasSMSCampaignEnabled: checked } : prev,
        );
      }
    } catch {
      /* silent */
    } finally {
      setTogglingGlobal(false);
    }
  }

  // ── Create campaign ───────────────────────────────────────────────────
  async function handleCreate() {
    if (!newName.trim()) {
      setFormError("Name is required");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      const res = await api("/sms/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          steps: [
            {
              stepIndex: 0,
              delaySeconds: 0,
              message:
                "Hi {{name}}, thanks for your interest! Reply STOP to unsubscribe.",
            },
          ],
          isDefault: newIsDefault,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data?.message || "Failed to create campaign");
        return;
      }
      setNewName("");
      setNewIsDefault(false);
      setShowNewForm(false);
      fetchCampaigns();
    } catch {
      setFormError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Default toggle ────────────────────────────────────────────────────
  async function handleSetDefault(campaignId: string) {
    try {
      const res = await api(`/sms/campaign/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) fetchCampaigns();
    } catch {
      /* silent */
    }
  }

  // ── Selection ─────────────────────────────────────────────────────────
  function toggleAll() {
    if (selectedIds.size === campaigns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(campaigns.map((c) => c._id)));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  async function handleBulkDelete() {
    if (
      !confirm(
        `Delete ${selectedIds.size} campaign${selectedIds.size === 1 ? "" : "s"}?`,
      )
    )
      return;
    setBulkDeleting(true);
    try {
      for (const id of selectedIds) {
        await api(`/sms/campaign/${id}`, { method: "DELETE" });
      }
      setSelectedIds(new Set());
      if (selectedCampaign && selectedIds.has(selectedCampaign._id)) {
        setSelectedCampaign(null);
      }
      fetchCampaigns();
    } catch {
      alert("Failed to delete some campaigns.");
    } finally {
      setBulkDeleting(false);
    }
  }

  function handleRowClick(c: SmsCampaign) {
    setSelectedCampaign(selectedCampaign?._id === c._id ? null : c);
  }

  const phoneNumber = getNumber(status);

  // ── Loading state ─────────────────────────────────────────────────────
  if (statusLoading) {
    return (
      <div className="flex flex-1 flex-col bg-background">
        <ContentLoader loading text="Checking SMS configuration..." />
      </div>
    );
  }

  // ── Not onboarded → empty state with Buy button ───────────────────────
  if (!status?.isOnboarded) {
    return (
      <div className="flex flex-1 flex-col bg-background">
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-sm font-semibold text-foreground">
              SMS Campaigns
            </h1>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-8">
          <div className="flex max-w-md flex-col items-center gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Phone className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">
                No phone number yet
              </h2>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                Buy a Twilio number to start sending SMS drip campaigns to your
                leads. Pick a country and area code below.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowBuyModal(true)}
              className="h-9 gap-2 rounded-md px-4 text-xs"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Buy a Number
            </Button>
          </div>
        </div>

        {showBuyModal && (
          <BuyNumberModal
            onClose={() => setShowBuyModal(false)}
            onSuccess={async () => {
              setShowBuyModal(false);
              setStatusLoading(true);
              await fetchStatus();
            }}
          />
        )}
      </div>
    );
  }

  // ── Onboarded → campaigns list ────────────────────────────────────────
  return (
    <div className="flex flex-1 overflow-hidden relative">
      <div className="flex flex-1 flex-col bg-background">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-2.5">
          <div className="flex items-center gap-2 shrink-0">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-sm font-semibold text-foreground">
              SMS Campaigns
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="h-7 gap-1.5 rounded-md px-3 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30"
              >
                {bulkDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>Delete Selected ({selectedIds.size})</>
                )}
              </Button>
            )}
            <div className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1">
              <span className="text-[11px] text-muted-foreground">
                SMS {status.hasSMSCampaignEnabled ? "On" : "Off"}
              </span>
              <Switch
                size="sm"
                checked={!!status.hasSMSCampaignEnabled}
                onCheckedChange={handleToggleGlobal}
                disabled={togglingGlobal}
              />
            </div>
            {phoneNumber && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-400 border border-blue-500/20 truncate">
                <Phone className="h-3 w-3" />
                {phoneNumber}
              </span>
            )}
            <Button
              size="sm"
              onClick={() => setShowNewForm(true)}
              className="h-7 gap-1.5 rounded-md px-3 text-xs"
            >
              <Plus className="h-3 w-3" />
              New campaign
            </Button>
          </div>
        </div>

        {/* Sub-header */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-1.5">
          <span className="text-xs text-muted-foreground">
            All Campaigns · {campaigns.length}
          </span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[800px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded appearance-none border border-gray-400 bg-transparent checked:bg-blue-500"
                    checked={
                      campaigns.length > 0 &&
                      selectedIds.size === campaigns.length
                    }
                    onChange={toggleAll}
                  />
                </th>
                {TABLE_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-2.5 text-xs font-medium text-muted-foreground"
                  >
                    <span className="flex items-center gap-1.5">
                      <col.icon className="h-3 w-3" />
                      {col.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaignsLoading && (
                <tr>
                  <td colSpan={5} className="py-12">
                    <ContentLoader
                      loading
                      text="Fetching SMS campaigns..."
                    />
                  </td>
                </tr>
              )}

              {!campaignsLoading &&
                campaigns.map((c) => (
                  <tr
                    key={c._id}
                    onClick={(e) => {
                      if (
                        (e.target as HTMLElement).tagName.toLowerCase() ===
                        "input"
                      )
                        return;
                      handleRowClick(c);
                    }}
                    className={`cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] ${
                      selectedCampaign?._id === c._id ? "bg-white/[0.05]" : ""
                    } ${selectedIds.has(c._id) ? "bg-blue-500/[0.02]" : ""}`}
                  >
                    <td className="px-4 py-2.5 w-10">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded appearance-none border border-gray-400 bg-transparent checked:bg-blue-500"
                        checked={selectedIds.has(c._id)}
                        onChange={() => toggleOne(c._id)}
                      />
                    </td>
                    <td className="px-4 py-2.5 font-medium">{c.name}</td>
                    <td className="px-4 py-2.5">
                      {c.isDefault ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          Default
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/40">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] capitalize ${
                          c.isActive
                            ? "bg-green-500/15 text-green-400 border border-green-500/20"
                            : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                        }`}
                      >
                        {c.isActive ? (
                          <PlayCircle className="h-2.5 w-2.5" />
                        ) : (
                          <PauseCircle className="h-2.5 w-2.5" />
                        )}
                        {c.isActive ? "active" : "paused"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-muted-foreground">
                      {timeAgo(c.createdAt)}
                    </td>
                  </tr>
                ))}

              {/* Add row */}
              {!campaignsLoading && !showNewForm ? (
                <tr>
                  <td colSpan={5}>
                    <button
                      onClick={() => setShowNewForm(true)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-muted-foreground/60 transition-colors hover:bg-white/[0.02] hover:text-muted-foreground"
                    >
                      <Plus className="h-3 w-3" />
                      Add New
                    </button>
                  </td>
                </tr>
              ) : showNewForm ? (
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <td className="px-4 py-2 w-10"></td>
                  <td className="px-4 py-2">
                    <Input
                      placeholder="Campaign name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      className="h-8 border-0 bg-white/[0.04] px-3 text-[13px] shadow-none placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-white/10"
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-2">
                    <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={newIsDefault}
                        onChange={(e) => setNewIsDefault(e.target.checked)}
                        className="h-3.5 w-3.5 rounded appearance-none border border-gray-400 bg-transparent checked:bg-amber-500"
                      />
                      Default
                    </label>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-block rounded-full bg-yellow-500/15 px-2.5 py-1 text-[11px] text-yellow-400">
                      paused
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleCreate}
                        disabled={submitting}
                        className="h-7 rounded-md px-3 text-[11px]"
                      >
                        {submitting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                      <button
                        onClick={() => {
                          setShowNewForm(false);
                          setNewName("");
                          setNewIsDefault(false);
                          setFormError("");
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!campaignsLoading && campaigns.length === 0 && !showNewForm && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <p className="text-sm text-muted-foreground">
                      No SMS campaigns yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Click &quot;+ New campaign&quot; to create your first SMS
                      drip.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {formError && (
            <p className="px-5 py-2 text-xs text-destructive">{formError}</p>
          )}
        </div>

        {campaigns.length > 0 && (
          <div className="flex items-center gap-6 border-t border-white/[0.06] px-5 py-2 text-[11px] text-muted-foreground">
            <span>Count all {campaigns.length}</span>
          </div>
        )}
      </div>

      {/* ── Detail panel ──────────────────────────────────────────────── */}
      {selectedCampaign && (
        <>
          <button
            type="button"
            aria-label="Close campaign details"
            onClick={() => setSelectedCampaign(null)}
            className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[1px] xl:hidden"
          />
          <SmsCampaignDetailPanel
            campaign={selectedCampaign}
            workspaceId={workspaceId}
            onClose={() => setSelectedCampaign(null)}
            onLaunchEditor={() => setShowCanvasFor(selectedCampaign)}
            onSetDefault={() => handleSetDefault(selectedCampaign._id)}
          />
        </>
      )}

      {/* ── Canvas overlay ────────────────────────────────────────────── */}
      {showCanvasFor && (
        <SmsCampaignCanvas
          campaignId={showCanvasFor._id}
          campaignName={showCanvasFor.name}
          onClose={() => {
            setShowCanvasFor(null);
            fetchCampaigns();
          }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Detail Panel
// ══════════════════════════════════════════════════════════════════════
function SmsCampaignDetailPanel({
  campaign,
  workspaceId,
  onClose,
  onLaunchEditor,
  onSetDefault,
}: {
  campaign: SmsCampaign;
  workspaceId: string;
  onClose: () => void;
  onLaunchEditor: () => void;
  onSetDefault: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "leads">(
    "overview",
  );

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex h-full w-full max-w-[min(100vw,28rem)] flex-col border-l border-white/[0.06] bg-background p-4 shadow-2xl animate-in slide-in-from-right-8 duration-200 sm:max-w-[24rem] sm:p-5 xl:static xl:z-auto xl:w-[400px] xl:max-w-none xl:shrink-0 xl:shadow-none">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {campaign.name}
          </h2>
          {campaign.isDefault && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20 shrink-0">
              <Star className="h-2.5 w-2.5 fill-current" />
              Default
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 overflow-x-auto border-b border-white/[0.06]">
        <button
          onClick={() => setActiveTab("overview")}
          className={`shrink-0 pb-2.5 text-xs font-medium transition-colors ${
            activeTab === "overview"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`shrink-0 pb-2.5 text-xs font-medium transition-colors ${
            activeTab === "activity"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Activity
        </button>
        <button
          onClick={() => setActiveTab("leads")}
          className={`shrink-0 pb-2.5 text-xs font-medium transition-colors ${
            activeTab === "leads"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Leads
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        {activeTab === "overview" ? (
          <SmsOverviewTab
            campaign={campaign}
            onLaunchEditor={onLaunchEditor}
            onSetDefault={onSetDefault}
          />
        ) : activeTab === "leads" ? (
          <SmsLeadsTab campaign={campaign} workspaceId={workspaceId} />
        ) : (
          <SmsActivityTab campaign={campaign} workspaceId={workspaceId} />
        )}
      </div>
    </aside>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────
function SmsOverviewTab({
  campaign,
  onLaunchEditor,
  onSetDefault,
}: {
  campaign: SmsCampaign;
  onLaunchEditor: () => void;
  onSetDefault: () => void;
}) {
  const stepCount = Array.isArray(campaign.steps) ? campaign.steps.length : 0;
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">Status</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] capitalize ${
              campaign.isActive
                ? "bg-green-500/15 text-green-400 border border-green-500/20"
                : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
            }`}
          >
            {campaign.isActive ? "active" : "paused"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">Default</span>
          {campaign.isDefault ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
              <Star className="h-2.5 w-2.5 fill-current" />
              Yes
            </span>
          ) : (
            <button
              onClick={onSetDefault}
              className="text-[11px] text-blue-400 hover:underline"
            >
              Set as default
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">Steps</span>
          <span className="text-sm">{stepCount}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">Created</span>
          <span className="text-sm">
            {new Date(campaign.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Visual Canvas */}
      <div className="mt-8 pt-6 border-t border-white/[0.06]">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          Campaign Flow
        </h3>
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-5 text-center sm:p-6">
          <MessageSquare className="w-8 h-8 text-muted-foreground/50" />
          <div>
            <p className="text-sm font-medium">Visual Canvas</p>
            <p className="text-xs text-muted-foreground mt-1">
              Manage your visual SMS sequence.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-xs h-7"
            onClick={onLaunchEditor}
          >
            Launch Editor
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Leads Tab ──────────────────────────────────────────────────────────
function SmsLeadsTab({
  campaign,
  workspaceId,
}: {
  campaign: SmsCampaign;
  workspaceId: string;
}) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const [campRes, leadsRes] = await Promise.all([
        api(`/sms/campaign/${campaign._id}`),
        api(`/lead/workspace/${workspaceId}`),
      ]);

      let enrollments: any[] = [];
      if (campRes.ok) {
        const data = await campRes.json();
        enrollments = unwrapCampaign(data).enrollments;
      }

      let workspaceLeads: any[] = [];
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        workspaceLeads = data.leads || data.data || [];
      }

      const leadMap = new Map<string, any>(
        workspaceLeads.map((l: any) => [String(l._id), l]),
      );

      const enriched = enrollments.map((e: any) => {
        const leadId = String(e.leadId || e._id);
        const full = leadMap.get(leadId);
        return {
          enrollmentId: e._id,
          _id: leadId,
          leadId,
          name: full?.name || "Unknown lead",
          phone: full?.phone,
          email: full?.email,
          status: e.status || full?.status || "enrolled",
        };
      });
      setLeads(enriched);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [campaign._id, workspaceId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Campaign Leads</h3>
        <Button
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="h-7 px-2.5 text-xs text-white bg-white/10 hover:bg-white/20 border-0"
          variant="outline"
        >
          <Plus className="h-3 w-3 mr-1.5" />
          Add Leads
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white/[0.02] rounded-md border border-white/[0.04] gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground/60">Loading leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-xs text-muted-foreground py-8 text-center bg-white/[0.02] rounded-md border border-white/[0.04]">
          No leads in this campaign yet.
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead: any) => {
            const id = lead._id || lead.leadId || lead.id;
            const name = lead.name || lead.leadName || "Unknown";
            const phone = lead.phone || lead.phoneNumber || lead.email || "—";
            const stat = lead.status || lead.state || "enrolled";
            return (
              <div
                key={id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-foreground">
                    {name}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">
                    {phone}
                  </p>
                </div>
                <span className="inline-block rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400 border border-blue-500/20 capitalize">
                  {String(stat).toLowerCase().replace(/_/g, " ")}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddLeadsToSmsCampaignModal
          campaignId={campaign._id}
          workspaceId={workspaceId}
          existingLeadIds={
            new Set(leads.map((l: any) => l._id || l.leadId || l.id))
          }
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchLeads}
        />
      )}
    </div>
  );
}

// ── Activity Tab ───────────────────────────────────────────────────────
function SmsActivityTab({
  campaign,
  workspaceId: _workspaceId,
}: {
  campaign: SmsCampaign;
  workspaceId: string;
}) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [campRes, leadsRes] = await Promise.all([
          api(`/sms/campaign/${campaign._id}`),
          api(`/lead/workspace/${_workspaceId}`),
        ]);
        if (!campRes.ok) return;
        const data = await campRes.json();
        const enrollments = unwrapCampaign(data).enrollments;

        let workspaceLeads: any[] = [];
        if (leadsRes.ok) {
          const ld = await leadsRes.json();
          workspaceLeads = ld.leads || ld.data || [];
        }
        const leadMap = new Map<string, any>(
          workspaceLeads.map((l: any) => [String(l._id), l]),
        );

        const all: any[] = [];
        for (const e of enrollments) {
          const leadId = String(e.leadId || e._id);
          if (!leadId) continue;
          const full = leadMap.get(leadId);
          try {
            const r = await api(`/sms/lead/${leadId}/messages`);
            if (!r.ok) continue;
            const md = await r.json();
            const msgs = md?.data || md?.messages || [];
            for (const m of msgs) {
              all.push({
                ...m,
                leadName: full?.name || "Lead",
                leadPhone: full?.phone,
              });
            }
          } catch {
            /* silent */
          }
        }
        all.sort((a, b) => {
          const ta = new Date(a.createdAt || a.sentAt || 0).getTime();
          const tb = new Date(b.createdAt || b.sentAt || 0).getTime();
          return tb - ta;
        });
        if (!cancelled) setEvents(all);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [campaign._id, _workspaceId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pr-1">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <HistoryIcon className="h-4 w-4 text-blue-400" />
          SMS Activity
        </h3>
        <span className="text-[10px] bg-white/[0.04] px-2 py-0.5 rounded-full text-muted-foreground/60 font-bold uppercase">
          {events.length} Events
        </span>
      </div>

      <div className="relative space-y-4 pl-2">
        {events.length > 0 && (
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/[0.06]" />
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white/[0.02] rounded-xl border border-white/[0.04] gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground/60">
              Loading activity...
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-xs text-muted-foreground py-12 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/[0.08]">
            <Send className="h-8 w-8 text-muted-foreground/10 mx-auto mb-3" />
            <p>No SMS activity recorded yet.</p>
            <p className="text-[10px] mt-1 opacity-50">
              Messages will appear here once the campaign starts sending.
            </p>
          </div>
        ) : (
          events.map((event, idx) => {
            const dir = (event.direction || event.type || "outbound")
              .toString()
              .toLowerCase();
            const inbound = dir.includes("in") || dir.includes("reply");
            const ts = event.createdAt || event.sentAt || event.timestamp;
            return (
              <div key={idx} className="relative flex gap-4 group">
                <div
                  className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm ring-4 ring-background ${
                    inbound
                      ? "border-green-500/30"
                      : "border-blue-500/30"
                  }`}
                >
                  {inbound ? (
                    <InboxIcon className="h-3 w-3 text-green-400" />
                  ) : (
                    <Send className="h-3 w-3 text-blue-400" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-bold text-foreground">
                      {event.leadName}{" "}
                      <span className="text-[10px] font-medium text-muted-foreground/40 ml-1">
                        {inbound ? "replied" : "received SMS"}
                      </span>
                    </p>
                    {ts && (
                      <span className="text-[10px] text-muted-foreground/40 font-medium whitespace-nowrap">
                        {timeAgo(ts)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground/70 mt-1 leading-relaxed">
                    {event.message || event.body || event.text || "(empty)"}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Add Leads Modal ────────────────────────────────────────────────────
function AddLeadsToSmsCampaignModal({
  campaignId,
  workspaceId,
  existingLeadIds,
  onClose,
  onSuccess,
}: {
  campaignId: string;
  workspaceId: string;
  existingLeadIds: Set<string>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api(`/lead/workspace/${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setAllLeads(data.leads || data.data || []);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workspaceId]);

  const available = allLeads.filter((l) => !existingLeadIds.has(l._id));

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function submit() {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await api("/sms/assign-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: Array.from(selected),
          campaignId,
        }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const d = await res.json().catch(() => ({}));
        const invalidCount = Array.isArray(d?.invalidLeadIds)
          ? d.invalidLeadIds.length
          : 0;
        const base = d?.message || "Failed to assign leads";
        setError(
          invalidCount > 0
            ? `${base} (${invalidCount} lead${invalidCount === 1 ? "" : "s"} not owned by you)`
            : base,
        );
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#121212] p-6 shadow-2xl flex flex-col max-h-[80vh]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Add Leads to Campaign
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 mb-4 space-y-2">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Loading...
            </p>
          ) : available.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No available leads to add.
            </p>
          ) : (
            available.map((lead: any) => (
              <label
                key={lead._id}
                className={`flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${
                  selected.has(lead._id)
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded appearance-none border border-gray-400 bg-transparent checked:bg-blue-500"
                  checked={selected.has(lead._id)}
                  onChange={() => toggle(lead._id)}
                />
                <div>
                  <p className="text-[13px] font-medium text-foreground">
                    {lead.name}
                  </p>
                  {(lead.phone || lead.email) && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {lead.phone || lead.email}
                    </p>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

        {error && <p className="text-[11px] text-red-400 mb-3">{error}</p>}

        <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.08]">
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
            onClick={submit}
            disabled={submitting || selected.size === 0}
            className="h-8 text-xs min-w-[120px]"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            ) : null}
            {submitting ? "Adding..." : `Add ${selected.size} Leads`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Buy Number Modal
// ══════════════════════════════════════════════════════════════════════
const COUNTRY_OPTIONS = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "AU", label: "Australia" },
  { code: "IN", label: "India" },
];

function BuyNumberModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [country, setCountry] = useState("US");
  const [areaCode, setAreaCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  async function handleBuy() {
    if (!areaCode.trim()) {
      setError("Area code required");
      return;
    }
    if (!confirmed) {
      setError("Please confirm the purchase");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await api("/sms/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, areaCode: areaCode.trim() }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Could not purchase number");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#121212] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
              <Phone className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">
              Buy Twilio Number
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground/70 mb-5 leading-relaxed">
          We&apos;ll provision a new number under your Twilio subaccount.
          Standard carrier fees apply.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <Globe2 className="h-3 w-3" />
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full h-9 rounded-md border border-white/[0.08] bg-white/[0.02] px-3 text-[13px] text-foreground outline-none focus:border-blue-500/50"
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code} className="bg-[#121212]">
                  {c.label} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <Hash className="h-3 w-3" />
              Area Code
            </label>
            <Input
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 512"
              maxLength={5}
              className="h-9 border-white/[0.08] bg-white/[0.02] text-[13px]"
            />
            <p className="mt-1 text-[10px] text-muted-foreground/50">
              Pick any local area code (3 digits for US/CA).
            </p>
          </div>

          <label className="flex items-start gap-2.5 rounded-md border border-white/[0.06] bg-white/[0.02] p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded appearance-none border border-gray-400 bg-transparent checked:bg-blue-500 shrink-0"
            />
            <span className="text-[11px] text-muted-foreground leading-relaxed">
              I authorize the purchase of a Twilio phone number under my
              subaccount and accept the recurring monthly carrier fees.
            </span>
          </label>
        </div>

        {error && (
          <p className="mt-3 text-[11px] text-red-400 flex items-center gap-1.5">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-white/[0.06]">
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
            onClick={handleBuy}
            disabled={submitting || !confirmed}
            className="h-8 gap-1.5 text-xs min-w-[120px]"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Confirm & Buy
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
