"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Users,
  X,
  Clock,
  Megaphone,
  Tag,
  Trash2,
  Calendar,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL, getToken } from "@/lib/auth";
import CampaignCanvas from "./CampaignCanvas";

// ── Types ─────────────────────────────────────────────────────────────
interface Campaign {
  _id: string;
  name: string;
  status: string;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface CampaignsViewProps {
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

const TABLE_COLUMNS = [
  { key: "name", label: "Name", icon: Megaphone },
  { key: "description", label: "Description", icon: Settings },
  { key: "status", label: "Status", icon: Tag },
  { key: "createdAt", label: "Created", icon: Clock },
];

export default function CampaignsView({ workspaceId, userRole = "AGENT" }: CampaignsViewProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<Set<string>>(new Set());
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCanvasId, setShowCanvasId] = useState<string | null>(null);

  // new-campaign form
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = getToken();

  // ── Fetch campaigns ───────────────────────────────────────────────────
  const fetchCampaigns = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/campaign/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setCampaigns(Array.isArray(result.data) ? result.data : []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [workspaceId, token]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Keep selected campaign in sync after refetch
  useEffect(() => {
    if (selectedCampaign) {
      const updated = campaigns.find((c) => c._id === selectedCampaign._id);
      if (updated) setSelectedCampaign(updated);
    }
  }, [campaigns]);

  // ── Create campaign ───────────────────────────────────────────────────
  async function handleCreate() {
    if (!newName.trim()) {
      setFormError("Name is required");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/campaign/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || "No description provided",
          status: "created",
          workspaceId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.message || "Failed to create campaign");
        return;
      }
      setNewName("");
      setNewDescription("");
      setShowNewForm(false);
      fetchCampaigns();
    } catch {
      setFormError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Row click ─────────────────────────────────────────────────────
  function handleRowClick(campaign: Campaign) {
    setSelectedCampaign(selectedCampaign?._id === campaign._id ? null : campaign);
  }

  // ── Selection & Bulk Ops ──────────────────────────────────────────
  function toggleAll() {
    if (selectedCampaignIds.size === campaigns.length) {
      setSelectedCampaignIds(new Set());
    } else {
      setSelectedCampaignIds(new Set(campaigns.map((c) => c._id)));
    }
  }

  function toggleCampaign(id: string) {
    const next = new Set(selectedCampaignIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCampaignIds(next);
  }

  async function handleBulkDelete() {
    if (
      !confirm(`Are you sure you want to delete ${selectedCampaignIds.size} campaigns?`)
    )
      return;

    setSubmitting(true);
    try {
      for (const id of selectedCampaignIds) {
        await fetch(`${API_BASE_URL}/campaign/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setSelectedCampaignIds(new Set());
      fetchCampaigns();
    } catch {
      alert("Failed to delete some campaigns.");
    } finally {
      setSubmitting(false);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* ── Main table area ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-background">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-2.5">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-sm font-semibold text-foreground">Campaigns</h1>
          </div>
          <div className="flex items-center gap-2">
            {selectedCampaignIds.size > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={submitting}
                className="h-7 gap-1.5 rounded-md px-3 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30"
              >
                Delete Selected ({selectedCampaignIds.size})
              </Button>
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

        {/* Sub-header: count */}
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
                      campaigns.length > 0 && selectedCampaignIds.size === campaigns.length
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
              {/* ── Existing campaigns ────────────────────────────────── */}
              {campaigns.map((campaign) => (
                <tr
                  key={campaign._id}
                  onClick={(e) => {
                    if (
                      (e.target as HTMLElement).tagName.toLowerCase() ===
                      "input"
                    )
                      return;
                    handleRowClick(campaign);
                  }}
                  className={`cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] ${
                    selectedCampaign?._id === campaign._id ? "bg-white/[0.05]" : ""
                  } ${selectedCampaignIds.has(campaign._id) ? "bg-blue-500/[0.02]" : ""}`}
                >
                  {/* Select */}
                  <td className="px-4 py-2.5 w-10">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded appearance-none border border-gray-400 bg-transparent checked:bg-blue-500"
                      checked={selectedCampaignIds.has(campaign._id)}
                      onChange={() => toggleCampaign(campaign._id)}
                    />
                  </td>

                  {/* Name */}
                  <td className="px-4 py-2.5 font-medium">{campaign.name}</td>

                  {/* Description */}
                  <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[200px]">{campaign.description || ""}</td>

                  {/* Status */}
                  <td className="px-4 py-2.5">
                    <span className="inline-block rounded-full bg-blue-500/15 px-2.5 py-1 text-[11px] text-blue-400 capitalize">
                      {campaign.status || "draft"}
                    </span>
                  </td>

                  {/* Created At */}
                  <td className="px-4 py-2.5 text-[12px] text-muted-foreground">
                    {timeAgo(campaign.createdAt)}
                  </td>
                </tr>
              ))}

              {/* ── "+ Add New" row ─── */}
              {!showNewForm ? (
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
              ) : (
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {/* Checkbox Placeholder */}
                  <td className="px-4 py-2 w-10"></td>
                  {/* Name */}
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
                  {/* Description */}
                  <td className="px-4 py-2">
                    <Input
                      placeholder="Description"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      className="h-8 border-0 bg-white/[0.04] px-3 text-[13px] shadow-none placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-white/10"
                    />
                  </td>
                  {/* Status (defaults to draft) */}
                  <td className="px-4 py-2">
                    <span className="inline-block rounded-full bg-blue-500/15 px-2.5 py-1 text-[11px] text-blue-400">
                      draft
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleCreate}
                        disabled={submitting}
                        className="h-7 rounded-md px-3 text-[11px]"
                      >
                        {submitting ? "…" : "Save"}
                      </Button>
                      <button
                        onClick={() => setShowNewForm(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty state */}
              {!loading && campaigns.length === 0 && !showNewForm && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <p className="text-sm text-muted-foreground">
                      No campaigns yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Click "+ New campaign" to create your first automated campaign.
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

        {/* Footer stats */}
        {campaigns.length > 0 && (
          <div className="flex items-center gap-6 border-t border-white/[0.06] px-5 py-2 text-[11px] text-muted-foreground">
            <span>Count all {campaigns.length}</span>
          </div>
        )}
      </div>

      {/* ── Detail panel (right side) ───────────────────────────────── */}
      {selectedCampaign && (
        <CampaignDetailPanel
          campaign={selectedCampaign}
          workspaceId={workspaceId}
          onClose={() => setSelectedCampaign(null)}
          onLaunchEditor={() => setShowCanvasId(selectedCampaign._id)}
        />
      )}

      {/* ── Visual Canvas Overlay ───────────────────────────────────── */}
      {showCanvasId && selectedCampaign && showCanvasId === selectedCampaign._id && (
        <CampaignCanvas
          campaignId={selectedCampaign._id}
          campaignName={selectedCampaign.name}
          workspaceId={workspaceId}
          onClose={() => setShowCanvasId(null)}
        />
      )}
    </div>
  );
}

// ── Detail Panel Component ──────────────────────────────────────────────
function CampaignDetailPanel({
  campaign,
  workspaceId,
  onClose,
  onLaunchEditor,
}: {
  campaign: Campaign;
  workspaceId: string;
  onClose: () => void;
  onLaunchEditor: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "leads">("overview");

  return (
    <div className="w-[400px] border-l border-white/[0.06] bg-background p-5 flex flex-col h-full animate-in slide-in-from-right-8 duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">{campaign.name}</h2>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/[0.06] mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-2.5 text-xs font-medium transition-colors ${
            activeTab === "overview"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("leads")}
          className={`pb-2.5 text-xs font-medium transition-colors ${
            activeTab === "leads"
              ? "border-b-2 border-foreground text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Leads
        </button>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-1">
        {activeTab === "overview" ? (
          <>
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <span className="inline-block rounded-full bg-blue-500/15 px-2.5 py-1 text-[11px] text-blue-400 capitalize">
                  {campaign.status || "draft"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Description</span>
                <span className="text-sm truncate max-w-[200px] text-right">{campaign.description || "No description"}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Created</span>
                <span className="text-sm">{new Date(campaign.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Visual Canvas Placeholder */}
            <div className="mt-8 pt-6 border-t border-white/[0.06]">
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Campaign Flow
              </h3>
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-6 flex flex-col items-center justify-center text-center gap-3">
                <Megaphone className="w-8 h-8 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium">Visual Canvas</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage your visual email sequence.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-2 text-xs h-7" onClick={onLaunchEditor}>
                  Launch Editor
                </Button>
              </div>
            </div>
          </>
        ) : (
          <CampaignLeadsTab campaign={campaign} workspaceId={workspaceId} />
        )}
      </div>
    </div>
  );
}

// ── Campaign Leads Tab ──────────────────────────────────────────────────────
function CampaignLeadsTab({
  campaign,
  workspaceId,
}: {
  campaign: Campaign;
  workspaceId: string;
}) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/lead/campaign/${campaign._id}/workspace/${workspaceId}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [campaign._id, workspaceId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <div className="space-y-4">
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
        <div className="text-xs text-muted-foreground py-8 text-center bg-white/[0.02] rounded-md border border-white/[0.04]">
          Loading leads...
        </div>
      ) : leads.length === 0 ? (
        <div className="text-xs text-muted-foreground py-8 text-center bg-white/[0.02] rounded-md border border-white/[0.04]">
          No leads in this campaign yet.
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => (
            <div
              key={lead._id}
              className="flex items-center justify-between p-3 rounded-md bg-white/[0.02] border border-white/[0.04]"
            >
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  {lead.name}
                </p>
                {lead.email && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {lead.email}
                  </p>
                )}
              </div>
              <span className="inline-block rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] text-blue-400 capitalize">
                {lead.status || "new"}
              </span>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddLeadsToCampaignModal
          campaignId={campaign._id}
          workspaceId={workspaceId}
          existingLeadIds={new Set(leads.map((l) => l._id))}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchLeads}
        />
      )}
    </div>
  );
}

// ── Add Leads to Campaign Modal ─────────────────────────────────────────────
function AddLeadsToCampaignModal({
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/lead/workspace/${workspaceId}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAllLeads(data.leads || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [workspaceId]);

  const availableLeads = allLeads.filter((l) => !existingLeadIds.has(l._id));

  const toggleLead = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const submit = async () => {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/lead/assignCampaingToLeads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          leads: Array.from(selectedIds),
          campaignId,
          workspaceId,
        }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Failed to assign leads");
      }
    } catch {
      alert("Error assigning leads");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#121212] p-6 shadow-2xl flex flex-col max-h-[80vh]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Add Leads to Campaign</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 mb-4 space-y-2">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Loading...
            </p>
          ) : availableLeads.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No available leads to add.
            </p>
          ) : (
            availableLeads.map((lead) => (
              <label
                key={lead._id}
                className={`flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${
                  selectedIds.has(lead._id)
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded appearance-none border border-gray-400 bg-transparent checked:bg-blue-500"
                  checked={selectedIds.has(lead._id)}
                  onChange={() => toggleLead(lead._id)}
                />
                <div>
                  <p className="text-[13px] font-medium text-foreground">
                    {lead.name}
                  </p>
                  {lead.email && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {lead.email}
                    </p>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

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
            disabled={submitting || selectedIds.size === 0}
            className="h-8 text-xs"
          >
            {submitting ? "Adding..." : `Add ${selectedIds.size} Leads`}
          </Button>
        </div>
      </div>
    </div>
  );
}
