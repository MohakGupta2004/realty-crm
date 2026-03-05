"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Users,
  X,
  Mail,
  Phone,
  Globe,
  Clock,
  Tag,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL, getToken } from "@/lib/auth";

// ── Types ─────────────────────────────────────────────────────────────
interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface LeadsViewProps {
  workspaceId: string;
}

// ── Constants ─────────────────────────────────────────────────────────
const STATUSES = ["new", "contacted", "converted", "lost"] as const;

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> =
  {
    new: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa", dot: "#3b82f6" },
    contacted: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24", dot: "#f59e0b" },
    converted: { bg: "rgba(16,185,129,0.15)", text: "#34d399", dot: "#10b981" },
    lost: { bg: "rgba(239,68,68,0.15)", text: "#f87171", dot: "#ef4444" },
  };

const DEFAULT_STATUS_STYLE = {
  bg: "rgba(255,255,255,0.1)",
  text: "#999",
  dot: "#666",
};

const COUNTRY_CODES = [
  { code: "+1", label: "US/CA" },
  { code: "+44", label: "UK" },
  { code: "+91", label: "IN" },
  { code: "+61", label: "AU" },
  { code: "+49", label: "DE" },
  { code: "+33", label: "FR" },
  { code: "+81", label: "JP" },
  { code: "+86", label: "CN" },
  { code: "+971", label: "AE" },
  { code: "+65", label: "SG" },
  { code: "+55", label: "BR" },
  { code: "+52", label: "MX" },
  { code: "+27", label: "ZA" },
  { code: "+82", label: "KR" },
  { code: "+39", label: "IT" },
];

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
  { key: "name", label: "Name", icon: Users },
  { key: "email", label: "Email", icon: Mail },
  { key: "phone", label: "Phone", icon: Phone },
  { key: "status", label: "Status", icon: Tag },
  { key: "source", label: "Source", icon: Globe },
  { key: "createdAt", label: "Created", icon: Clock },
];

// ══════════════════════════════════════════════════════════════════════
// LeadsView
// ══════════════════════════════════════════════════════════════════════
export default function LeadsView({ workspaceId }: LeadsViewProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // inline editing
  const [editingCell, setEditingCell] = useState<{
    leadId: string;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");

  // new-lead form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCountryCode, setNewCountryCode] = useState("+91");
  const [newPhone, setNewPhone] = useState("");
  const [newSource, setNewSource] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = getToken();

  // ── Fetch leads ───────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/lead/workspace/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [workspaceId, token]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Keep selected lead in sync after refetch
  useEffect(() => {
    if (selectedLead) {
      const updated = leads.find((l) => l._id === selectedLead._id);
      if (updated) setSelectedLead(updated);
    }
  }, [leads]);

  // ── Create lead ───────────────────────────────────────────────────
  async function handleCreate() {
    if (!newName.trim()) {
      setFormError("Name is required");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      const fullPhone = newPhone.trim()
        ? `${newCountryCode} ${newPhone.trim()}`
        : "";
      const res = await fetch(`${API_BASE_URL}/lead/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          phone: fullPhone,
          source: newSource.trim() || "manual",
          workspaceId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.message || "Failed to create lead");
        return;
      }
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewSource("");
      setShowNewForm(false);
      fetchLeads();
    } catch {
      setFormError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Inline update ─────────────────────────────────────────────────
  async function saveInlineEdit(leadId: string, field: string, value: string) {
    setEditingCell(null);
    try {
      const res = await fetch(`${API_BASE_URL}/lead/details/${leadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) fetchLeads();
    } catch {
      /* silent */
    }
  }

  function startEditing(leadId: string, field: string, currentValue: string) {
    setEditingCell({ leadId, field });
    setEditValue(currentValue);
  }

  // ── Row click ─────────────────────────────────────────────────────
  function handleRowClick(lead: Lead) {
    setSelectedLead(selectedLead?._id === lead._id ? null : lead);
  }

  // ══════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Main table area ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-background">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-2.5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-sm font-semibold text-foreground">Leads</h1>
          </div>
          <Button
            size="sm"
            onClick={() => setShowNewForm(true)}
            className="h-7 gap-1.5 rounded-md px-3 text-xs"
          >
            <Plus className="h-3 w-3" />
            New record
          </Button>
        </div>

        {/* Sub-header: count */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-1.5">
          <span className="text-xs text-muted-foreground">
            All Leads · {leads.length}
          </span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
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
              {/* ── Existing leads ────────────────────────────────── */}
              {leads.map((lead) => (
                <tr
                  key={lead._id}
                  onClick={() => handleRowClick(lead)}
                  className={`cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] ${
                    selectedLead?._id === lead._id ? "bg-white/[0.05]" : ""
                  }`}
                >
                  {/* Name */}
                  <td className="px-4 py-2.5">
                    <EditableNameCell
                      lead={lead}
                      editing={
                        editingCell?.leadId === lead._id &&
                        editingCell?.field === "name"
                      }
                      editValue={editValue}
                      onStart={() => startEditing(lead._id, "name", lead.name)}
                      onChange={setEditValue}
                      onSave={(v) => saveInlineEdit(lead._id, "name", v)}
                      onCancel={() => setEditingCell(null)}
                    />
                  </td>

                  {/* Email */}
                  <td className="px-4 py-2.5">
                    <EditableChipCell
                      value={lead.email}
                      editing={
                        editingCell?.leadId === lead._id &&
                        editingCell?.field === "email"
                      }
                      editValue={editValue}
                      onStart={() =>
                        startEditing(lead._id, "email", lead.email)
                      }
                      onChange={setEditValue}
                      onSave={(v) => saveInlineEdit(lead._id, "email", v)}
                      onCancel={() => setEditingCell(null)}
                    />
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-2.5">
                    <EditableChipCell
                      value={lead.phone}
                      editing={
                        editingCell?.leadId === lead._id &&
                        editingCell?.field === "phone"
                      }
                      editValue={editValue}
                      onStart={() =>
                        startEditing(lead._id, "phone", lead.phone)
                      }
                      onChange={setEditValue}
                      onSave={(v) => saveInlineEdit(lead._id, "phone", v)}
                      onCancel={() => setEditingCell(null)}
                    />
                  </td>

                  {/* Status */}
                  <td
                    className="px-4 py-2.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StatusDropdown
                      status={lead.status}
                      onChange={(s) => saveInlineEdit(lead._id, "status", s)}
                    />
                  </td>

                  {/* Source */}
                  <td className="px-4 py-2.5">
                    <EditableTextCell
                      value={lead.source}
                      editing={
                        editingCell?.leadId === lead._id &&
                        editingCell?.field === "source"
                      }
                      editValue={editValue}
                      onStart={() =>
                        startEditing(lead._id, "source", lead.source)
                      }
                      onChange={setEditValue}
                      onSave={(v) => saveInlineEdit(lead._id, "source", v)}
                      onCancel={() => setEditingCell(null)}
                    />
                  </td>

                  {/* Created At */}
                  <td className="px-4 py-2.5 text-[12px] text-muted-foreground">
                    {timeAgo(lead.createdAt)}
                  </td>
                </tr>
              ))}

              {/* ── "+ Add New" row — appears BELOW existing rows ─── */}
              {!showNewForm ? (
                <tr>
                  <td colSpan={6}>
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
                  {/* Name */}
                  <td className="px-4 py-2">
                    <Input
                      placeholder="Lead name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      className="h-8 border-0 bg-white/[0.04] px-3 text-[13px] shadow-none placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-white/10"
                      autoFocus
                    />
                  </td>
                  {/* Email */}
                  <td className="px-4 py-2">
                    <Input
                      placeholder="email@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      className="h-8 border-0 bg-white/[0.04] px-3 text-[13px] shadow-none placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-white/10"
                    />
                  </td>
                  {/* Phone with country code */}
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <CountryCodeSelect
                        value={newCountryCode}
                        onChange={setNewCountryCode}
                      />
                      <Input
                        placeholder="Phone number"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        className="h-8 flex-1 border-0 bg-white/[0.04] px-3 text-[13px] shadow-none placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-white/10"
                      />
                    </div>
                  </td>
                  {/* Status (defaults to new) */}
                  <td className="px-4 py-2">
                    <span className="inline-block rounded-full bg-blue-500/15 px-2.5 py-1 text-[11px] text-blue-400">
                      new
                    </span>
                  </td>
                  {/* Source */}
                  <td className="px-4 py-2">
                    <Input
                      placeholder="Source"
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      className="h-8 border-0 bg-white/[0.04] px-3 text-[13px] shadow-none placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-white/10"
                    />
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
              {!loading && leads.length === 0 && !showNewForm && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <p className="text-sm text-muted-foreground">
                      No leads yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Click "+ New record" to add your first lead.
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
        {leads.length > 0 && (
          <div className="flex items-center gap-6 border-t border-white/[0.06] px-5 py-2 text-[11px] text-muted-foreground">
            <span>Count all {leads.length}</span>
          </div>
        )}
      </div>

      {/* ── Detail panel (right side) ───────────────────────────────── */}
      {selectedLead && (
        <DetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={(field, value) =>
            saveInlineEdit(selectedLead._id, field, value)
          }
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SUB-‌COMPONENTS
// ══════════════════════════════════════════════════════════════════════

// ── Editable Name cell (with avatar) ──────────────────────────────────
function EditableNameCell({
  lead,
  editing,
  editValue,
  onStart,
  onChange,
  onSave,
  onCancel,
}: {
  lead: Lead;
  editing: boolean;
  editValue: string;
  onStart: () => void;
  onChange: (v: string) => void;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  if (editing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(editValue);
          if (e.key === "Escape") onCancel();
        }}
        onBlur={() => onSave(editValue)}
        className="h-7 border-0 bg-white/[0.06] px-2 text-[13px] font-medium shadow-none focus-visible:ring-1 focus-visible:ring-white/10"
        autoFocus
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  return (
    <span
      className="flex items-center gap-2 font-medium text-foreground"
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStart();
      }}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded bg-violet-600/80 text-[10px] font-bold text-white">
        {lead.name.charAt(0).toUpperCase()}
      </span>
      {lead.name}
    </span>
  );
}

// ── Editable chip cell (email / phone) ────────────────────────────────
function EditableChipCell({
  value,
  editing,
  editValue,
  onStart,
  onChange,
  onSave,
  onCancel,
}: {
  value: string;
  editing: boolean;
  editValue: string;
  onStart: () => void;
  onChange: (v: string) => void;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  if (editing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(editValue);
          if (e.key === "Escape") onCancel();
        }}
        onBlur={() => onSave(editValue)}
        className="h-7 border-0 bg-white/[0.06] px-2 text-[12px] shadow-none focus-visible:ring-1 focus-visible:ring-white/10"
        autoFocus
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  if (!value) {
    return (
      <span
        className="text-muted-foreground/30 text-[12px] cursor-text"
        onDoubleClick={(e) => {
          e.stopPropagation();
          onStart();
        }}
      >
        —
      </span>
    );
  }
  return (
    <span
      className="cursor-text rounded bg-white/[0.06] px-2 py-0.5 text-[12px] text-muted-foreground"
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStart();
      }}
    >
      {value}
    </span>
  );
}

// ── Editable plain text cell (source) ─────────────────────────────────
function EditableTextCell({
  value,
  editing,
  editValue,
  onStart,
  onChange,
  onSave,
  onCancel,
}: {
  value: string;
  editing: boolean;
  editValue: string;
  onStart: () => void;
  onChange: (v: string) => void;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  if (editing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(editValue);
          if (e.key === "Escape") onCancel();
        }}
        onBlur={() => onSave(editValue)}
        className="h-7 border-0 bg-white/[0.06] px-2 text-[12px] shadow-none focus-visible:ring-1 focus-visible:ring-white/10"
        autoFocus
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  return (
    <span
      className="cursor-text text-[12px] text-muted-foreground"
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStart();
      }}
    >
      {value || <span className="text-muted-foreground/30">—</span>}
    </span>
  );
}

// ── Status dropdown ───────────────────────────────────────────────────
function StatusDropdown({
  status,
  onChange,
}: {
  status: string;
  onChange: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition-colors"
        style={{
          backgroundColor: (
            STATUS_STYLES[(status || "new").toLowerCase()] ||
            DEFAULT_STATUS_STYLE
          ).bg,
          color: (
            STATUS_STYLES[(status || "new").toLowerCase()] ||
            DEFAULT_STATUS_STYLE
          ).text,
        }}
      >
        {status}
        <ChevronDown className="h-2.5 w-2.5 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-32 rounded-lg border border-white/[0.08] bg-[#1a1a1a] py-1 shadow-xl">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] capitalize text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              {s === (status || "new").toLowerCase() && (
                <Check className="h-3 w-3 text-foreground" />
              )}
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  backgroundColor: (STATUS_STYLES[s] || DEFAULT_STATUS_STYLE)
                    .dot,
                }}
              />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Country code select ───────────────────────────────────────────────
function CountryCodeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 items-center gap-0.5 rounded-md bg-white/[0.04] px-2 text-[12px] text-muted-foreground transition-colors hover:bg-white/[0.08]"
      >
        {value}
        <ChevronDown className="h-2.5 w-2.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-28 overflow-auto rounded-lg border border-white/[0.08] bg-[#1a1a1a] py-1 shadow-xl">
          {COUNTRY_CODES.map((cc) => (
            <button
              key={cc.code}
              onClick={() => {
                onChange(cc.code);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              <span>{cc.code}</span>
              <span className="text-muted-foreground/40">{cc.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────
function DetailPanel({
  lead,
  onClose,
  onUpdate,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdate: (field: string, value: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"home" | "timeline" | "tasks">(
    "home",
  );

  const tabs = [
    { key: "home" as const, label: "Home" },
    { key: "timeline" as const, label: "Timeline" },
    { key: "tasks" as const, label: "Tasks" },
  ];

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-white/[0.06] bg-sidebar">
      {/* Panel header */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <button
          onClick={onClose}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <span className="flex h-6 w-6 items-center justify-center rounded bg-violet-600/80 text-[10px] font-bold text-white">
          {lead.name.charAt(0).toUpperCase()}
        </span>
        <div className="flex-1 truncate">
          <p className="text-sm font-medium text-foreground">{lead.name}</p>
          <p className="text-[11px] text-muted-foreground">
            Created {timeAgo(lead.createdAt)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/[0.06] px-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "home" && <HomeTab lead={lead} onUpdate={onUpdate} />}
        {activeTab === "timeline" && (
          <div className="flex flex-1 items-center justify-center px-4 py-12">
            <p className="text-xs text-muted-foreground/60">
              Timeline coming soon
            </p>
          </div>
        )}
        {activeTab === "tasks" && (
          <div className="flex flex-1 items-center justify-center px-4 py-12">
            <p className="text-xs text-muted-foreground/60">
              Tasks coming soon
            </p>
          </div>
        )}
      </div>

      {/* Panel footer */}
      <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-4 py-2.5">
        <Button size="sm" className="h-7 gap-1.5 rounded-md px-4 text-xs">
          Open
        </Button>
      </div>
    </div>
  );
}

// ── Home tab content ──────────────────────────────────────────────────
function HomeTab({
  lead,
  onUpdate,
}: {
  lead: Lead;
  onUpdate: (field: string, value: string) => void;
}) {
  return (
    <div className="px-4 py-4">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        Fields
      </p>
      <p className="mb-4 text-[11px] text-muted-foreground/40">General</p>

      <div className="space-y-4">
        <EditableDetailRow
          icon={Mail}
          label="Email"
          value={lead.email}
          onSave={(v) => onUpdate("email", v)}
        />
        <EditableDetailRow
          icon={Phone}
          label="Phone"
          value={lead.phone}
          onSave={(v) => onUpdate("phone", v)}
        />
        <DetailStatusRow
          status={lead.status}
          onChange={(s) => onUpdate("status", s)}
        />
        <EditableDetailRow
          icon={Globe}
          label="Source"
          value={lead.source}
          onSave={(v) => onUpdate("source", v)}
        />
        <DetailRow
          icon={Clock}
          label="Last update"
          value={timeAgo(lead.updatedAt)}
        />
        <DetailRow
          icon={Clock}
          label="Created"
          value={timeAgo(lead.createdAt)}
        />
      </div>
    </div>
  );
}

// ── Detail Row (read-only) ────────────────────────────────────────────
function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex w-24 shrink-0 items-center gap-1.5 pt-0.5">
        <Icon className="h-3 w-3 text-muted-foreground/60" />
        <span className="text-[12px] text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1 text-[12px] text-foreground">
        {value || <span className="text-muted-foreground/30">—</span>}
      </div>
    </div>
  );
}

// ── Editable Detail Row ───────────────────────────────────────────────
function EditableDetailRow({
  icon: Icon,
  label,
  value,
  onSave,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  function save() {
    setEditing(false);
    if (localValue !== value) onSave(localValue);
  }

  if (editing) {
    return (
      <div className="flex items-start gap-3">
        <div className="flex w-24 shrink-0 items-center gap-1.5 pt-1.5">
          <Icon className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-[12px] text-muted-foreground">{label}</span>
        </div>
        <Input
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setLocalValue(value);
              setEditing(false);
            }
          }}
          className="h-7 flex-1 border-0 bg-white/[0.06] px-2 text-[12px] shadow-none focus-visible:ring-1 focus-visible:ring-white/10"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex w-24 shrink-0 items-center gap-1.5 pt-0.5">
        <Icon className="h-3 w-3 text-muted-foreground/60" />
        <span className="text-[12px] text-muted-foreground">{label}</span>
      </div>
      <div
        className="flex-1 cursor-text rounded px-1 py-0.5 text-[12px] text-foreground transition-colors hover:bg-white/[0.04]"
        onClick={() => {
          setLocalValue(value);
          setEditing(true);
        }}
      >
        {value || <span className="text-muted-foreground/30">{label}</span>}
      </div>
    </div>
  );
}

// ── Detail Status Row (dropdown) ──────────────────────────────────────
function DetailStatusRow({
  status,
  onChange,
}: {
  status: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex w-24 shrink-0 items-center gap-1.5 pt-0.5">
        <Tag className="h-3 w-3 text-muted-foreground/60" />
        <span className="text-[12px] text-muted-foreground">Status</span>
      </div>
      <div className="flex-1">
        <StatusDropdown status={status} onChange={onChange} />
      </div>
    </div>
  );
}
