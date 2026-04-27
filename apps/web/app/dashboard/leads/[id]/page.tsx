"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  Copy,
  Briefcase,
  User as UserIcon,
  Hash,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  NotesTab,
  TasksTab,
  TimelineTab,
  EmailsTab,
  EmailDraftForm,
  timeAgo,
  type Lead,
} from "@/components/dashboard/LeadsView";

type TabKey = "timeline" | "tasks" | "notes" | "emails";

const TABS: { key: TabKey; label: string }[] = [
  { key: "timeline", label: "Timeline" },
  { key: "tasks", label: "Tasks" },
  { key: "notes", label: "Notes" },
  { key: "emails", label: "Emails" },
];

const CORE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  phone: Phone,
  city: MapPin,
};

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const leadId = params?.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("timeline");
  const [showEmailDraft, setShowEmailDraft] = useState(false);
  const [generalOpen, setGeneralOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(true);
  const [members, setMembers] = useState<
    { _id: string; name: string; role: "OWNER" | "AGENT" }[]
  >([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState(false);
  const [reassignError, setReassignError] = useState<string | null>(null);

  const fetchLead = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const res = await api(`/lead/details/${leadId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Failed to load lead");
        setLead(null);
        return;
      }
      const data = await res.json();
      setLead(data.lead);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to load lead");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  useEffect(() => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") ||
            localStorage.getItem("token")
          : null;
      if (!token) return;
      const [, payload] = token.split(".");
      if (!payload) return;
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized.padEnd(
        Math.ceil(normalized.length / 4) * 4,
        "="
      );
      const decoded = JSON.parse(atob(padded));
      if (decoded?.id) setCurrentUserId(decoded.id);
    } catch {
      /* silent */
    }
  }, []);

  const workspaceId = useMemo(() => {
    if (!lead) return "";
    const wid = (lead as any).workspaceId;
    if (!wid) return "";
    return typeof wid === "string" ? wid : wid._id || "";
  }, [lead]);

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api(`/memberships/workspace/${workspaceId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const mapped = (data || [])
          .filter((m: any) => m?.user)
          .map((m: any) => ({
            _id: m.user._id,
            name: m.user.name,
            role: m.role as "OWNER" | "AGENT",
          }));
        setMembers(mapped);
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const isOwner = useMemo(() => {
    if (!currentUserId) return false;
    return members.some(
      (m) => m._id === currentUserId && m.role === "OWNER"
    );
  }, [members, currentUserId]);

  const currentOwnerId = useMemo(() => {
    if (!lead?.realtorId) return "";
    return typeof lead.realtorId === "object"
      ? (lead.realtorId as any)._id
      : (lead.realtorId as unknown as string);
  }, [lead]);

  const handleReassign = useCallback(
    async (newOwnerId: string) => {
      if (!leadId || !newOwnerId || newOwnerId === currentOwnerId) return;
      setReassigning(true);
      setReassignError(null);
      try {
        const res = await api(`/lead/details/${leadId}/owner`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newOwnerId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setReassignError(data?.message || "Failed to reassign");
          return;
        }
        if (data?.lead) setLead(data.lead);
      } catch (e: any) {
        setReassignError(e?.message || "Failed to reassign");
      } finally {
        setReassigning(false);
      }
    },
    [leadId, currentOwnerId]
  );

  const extraEntries = useMemo(() => {
    if (!lead?.extra_fields) return [] as [string, string][];
    return Object.entries(lead.extra_fields).filter(
      ([, v]) => v !== undefined && v !== null
    );
  }, [lead]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
        <p className="text-sm text-muted-foreground">
          {error || "Lead not found"}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard")}
        >
          Back to dashboard
        </Button>
      </div>
    );
  }

  const initials = lead.name?.charAt(0).toUpperCase() || "?";

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-sidebar/50 px-4 py-2.5 md:px-6">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <button
            onClick={() => router.push("/dashboard?view=leads")}
            className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Leads
          </button>
          <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
          <span className="truncate text-foreground">{lead.name}</span>
        </div>
        <Button
          size="sm"
          onClick={() => setShowEmailDraft(true)}
          className="h-8 gap-1.5 rounded-md px-3 text-[12px]"
        >
          <Send className="h-3 w-3" />
          Send Email
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left column: Lead details ─────────────────────────────── */}
        <aside className="w-full max-w-sm flex-shrink-0 overflow-y-auto border-r border-white/[0.06] bg-sidebar/30">
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-600/80 text-base font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-foreground">
                {lead.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Created {timeAgo(lead.createdAt)}
              </p>
            </div>
          </div>

          {/* General section */}
          <Section
            title="General"
            open={generalOpen}
            onToggle={() => setGeneralOpen((o) => !o)}
          >
            <FieldRow
              icon={Mail}
              label="Emails"
              value={lead.email}
              copyable
            />
            <FieldRow
              icon={Phone}
              label="Phones"
              value={lead.phone}
              copyable
            />
            {lead.city && (
              <FieldRow icon={MapPin} label="City" value={lead.city} />
            )}
            <FieldRow
              icon={Hash}
              label="Source"
              value={lead.source}
            />
            {lead.stageId?.name && (
              <FieldRow
                icon={Briefcase}
                label="Status"
                value={lead.stageId.name}
              />
            )}
          </Section>

          {/* Extra fields */}
          {extraEntries.length > 0 && (
            <Section
              title="Work"
              open={extraOpen}
              onToggle={() => setExtraOpen((o) => !o)}
            >
              {extraEntries.map(([k, v]) => {
                const Icon = CORE_ICONS[k.toLowerCase()] || Briefcase;
                return (
                  <FieldRow
                    key={k}
                    icon={Icon}
                    label={formatLabel(k)}
                    value={String(v)}
                  />
                );
              })}
            </Section>
          )}

          {/* System */}
          <Section
            title="System"
            open={systemOpen}
            onToggle={() => setSystemOpen((o) => !o)}
          >
            {isOwner && members.length > 0 ? (
              <OwnerSelectRow
                currentOwnerId={currentOwnerId}
                members={members}
                disabled={reassigning}
                error={reassignError}
                onChange={handleReassign}
              />
            ) : (
              lead.realtorId &&
              typeof lead.realtorId === "object" && (
                <FieldRow
                  icon={UserIcon}
                  label="Agent"
                  value={lead.realtorId.name}
                />
              )
            )}
            <FieldRow
              icon={Calendar}
              label="Created"
              value={new Date(lead.createdAt).toLocaleString()}
            />
            <FieldRow
              icon={Calendar}
              label="Updated"
              value={new Date(lead.updatedAt).toLocaleString()}
            />
          </Section>
        </aside>

        {/* ── Right column: Tabs ─────────────────────────────────────── */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-white/[0.06] bg-sidebar/20 px-4">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`relative px-3 py-3 text-[12px] font-medium transition-colors ${
                  activeTab === t.key
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                {activeTab === t.key && (
                  <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-t bg-foreground" />
                )}
              </button>
            ))}
          </div>

          {/* Tab body */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "timeline" && (
              <TimelineTab lead={lead} workspaceId={workspaceId} />
            )}
            {activeTab === "tasks" && (
              <TasksTab lead={lead} workspaceId={workspaceId} />
            )}
            {activeTab === "notes" && (
              <NotesTab lead={lead} workspaceId={workspaceId} />
            )}
            {activeTab === "emails" && (
              <EmailsTab lead={lead} workspaceId={workspaceId} />
            )}
          </div>
        </main>
      </div>

      {/* Email draft modal */}
      {showEmailDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowEmailDraft(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-xl border border-white/[0.08] bg-sidebar shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/[0.06] px-5 py-3">
              <p className="text-[13px] font-semibold text-foreground">
                Send Email to {lead.name}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {lead.email}
              </p>
            </div>
            <EmailDraftForm
              lead={lead}
              onCancel={() => setShowEmailDraft(false)}
              onSent={() => {
                setShowEmailDraft(false);
                if (activeTab === "emails") {
                  // trigger refetch by toggling
                  setActiveTab("timeline");
                  setTimeout(() => setActiveTab("emails"), 50);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────
function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-white/[0.04]">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>
      {open && <div className="space-y-px pb-3">{children}</div>}
    </div>
  );
}

function FieldRow({
  icon: Icon,
  label,
  value,
  copyable = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* silent */
    }
  }

  return (
    <div className="group flex items-start gap-3 px-5 py-2 transition-colors hover:bg-white/[0.02]">
      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center text-muted-foreground/60">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
          {label}
        </p>
        <p className="mt-0.5 break-words text-[12px] text-foreground">
          {value}
        </p>
      </div>
      {copyable && (
        <div className="mt-0.5 flex items-center gap-1">
          {copied && (
            <span className="text-[10px] text-green-400">Copied</span>
          )}
          <button
            onClick={handleCopy}
            className="hidden text-muted-foreground/60 transition-colors hover:text-foreground group-hover:block"
            aria-label="Copy"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function formatLabel(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function OwnerSelectRow({
  currentOwnerId,
  members,
  disabled,
  error,
  onChange,
}: {
  currentOwnerId: string;
  members: { _id: string; name: string; role: "OWNER" | "AGENT" }[];
  disabled: boolean;
  error: string | null;
  onChange: (newOwnerId: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-2">
      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center text-muted-foreground/60">
        <UserIcon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
          Agent
        </p>
        <select
          value={currentOwnerId}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="mt-1 w-full rounded-md border border-white/[0.08] bg-transparent px-2 py-1 text-[12px] text-foreground outline-none transition-colors hover:border-white/[0.16] focus:border-white/[0.24] disabled:opacity-60"
        >
          {members.map((m) => (
            <option
              key={m._id}
              value={m._id}
              className="bg-sidebar text-foreground"
            >
              {m.name} {m.role === "OWNER" ? "(Owner)" : ""}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-[10px] text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
