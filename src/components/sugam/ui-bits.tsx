"use client";
import React from "react";
import { fmtDateTime, timeAgo, STATUS_LABELS, BUREAU_LABELS, SOURCE_LABELS } from "@/lib/client";

// ── S.U.G.A.M. 2.0 design system (institutional: white surfaces, navy trust,
// saffron accent, muted teal success, red/amber warnings — §8.2/§8.3) ──

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    RECEIVED: "bg-su-blue-soft text-su-blue border-[#C7DAE6]",
    NEEDS_TRIAGE: "bg-su-amber-soft text-su-amber border-[#EBD9A8]",
    ASSIGNED: "bg-[#E9F2F0] text-[#1F5F55] border-[#C2DED8]",
    IN_REVIEW: "bg-su-saffron-soft text-su-saffron border-[#EAD3A2]",
    WAITING_FOR_INFORMATION: "bg-su-amber-soft text-su-amber border-[#EBD9A8]",
    ACTION_REQUIRED: "bg-su-red-soft text-su-red border-[#F0C5C0]",
    PENDING_REVIEW: "bg-su-blue-soft text-su-blue border-[#C7DAE6]",
    RESOLVED: "bg-su-green-soft text-su-teal border-[#BFE0D2]",
    CLOSED: "bg-slate-100 text-slate-600 border-slate-200",
    REOPENED: "bg-su-red-soft text-su-red border-[#F0C5C0]",
  };
  return (
    <span data-status={status} className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {STATUS_LABELS[status] ?? status.replace(/_/g, " ")}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "CRITICAL")
    return <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-su-red px-2 py-0.5 text-xs font-bold text-white"><span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />CRITICAL</span>;
  if (priority === "HIGH") return <span className="rounded-full border border-[#EBD9A8] bg-su-amber-soft px-2 py-0.5 text-xs font-semibold text-su-amber">HIGH</span>;
  if (priority === "LOW") return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">LOW</span>;
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-su-muted">NORMAL</span>;
}

export function SlaChip({ dueAt, breached }: { dueAt: string | null; breached?: boolean }) {
  if (!dueAt) return <span className="text-xs text-su-muted">No deadline</span>;
  const ms = new Date(dueAt).getTime() - Date.now();
  const overdue = breached || ms <= 0;
  const days = Math.floor(Math.abs(ms) / 86400000);
  const hours = Math.floor((Math.abs(ms) % 86400000) / 3600000);
  const body = ms <= 0 ? `${days > 0 ? `${days}d ` : ""}${hours}h overdue` : days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${overdue ? "bg-su-red-soft text-su-red" : ms <= 3 * 86400000 ? "bg-su-amber-soft text-su-amber" : "bg-su-green-soft text-su-teal"}`}>
      {overdue ? "⚠" : "◷"} {body}
    </span>
  );
}

export function SourceBadge({ source }: { source: string }) {
  const simulated = source !== "DEMO_PORTAL";
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${simulated ? "border-[#EAD3A2] bg-su-saffron-soft text-su-saffron" : "border-su-border bg-su-canvas text-su-muted"}`} title={simulated ? "Simulated external source — no live government connection" : SOURCE_LABELS[source]}>
      {SOURCE_LABELS[source] ?? source}
    </span>
  );
}

export function KpiCard({ title, value, subtitle, icon, tone = "default", onClick }: {
  title: string; value: number | string; subtitle?: string; icon?: React.ReactNode;
  tone?: "default" | "navy" | "red" | "amber" | "teal"; onClick?: () => void;
}) {
  const tones: Record<string, string> = {
    default: "bg-white border-su-border",
    navy: "bg-su-navy border-su-navy text-white",
    red: "bg-su-red-soft border-[#F0C5C0] text-su-red",
    amber: "bg-su-amber-soft border-[#EBD9A8] text-su-amber",
    teal: "bg-su-green-soft border-[#BFE0D2] text-su-teal",
  };
  const sub: Record<string, string> = { navy: "text-white/70", default: "text-su-muted", red: "text-su-red/75", amber: "text-su-amber/75", teal: "text-su-teal/75" };
  return (
    <div onClick={onClick} className={`rounded-xl border p-4 shadow-[0_1px_2px_rgba(23,50,77,0.04)] ${tones[tone]} ${onClick ? "cursor-pointer transition hover:-translate-y-px hover:shadow-md" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold uppercase tracking-wide ${sub[tone]}`}>{title}</span>
        <span className={sub[tone]}>{icon}</span>
      </div>
      <div className="mt-1 text-3xl font-bold tabular-nums leading-none">{value}</div>
      {subtitle && <div className={`mt-1.5 text-xs ${sub[tone]}`}>{subtitle}</div>}
    </div>
  );
}

export function SectionTitle({ children, right, hint }: { children: React.ReactNode; right?: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-5 w-1 rounded-full bg-su-saffron" />
          <h2 className="text-base font-bold text-su-navy">{children}</h2>
        </div>
        {hint && <p className="mt-0.5 pl-3.5 text-xs text-su-muted">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-su-border bg-white shadow-[0_1px_2px_rgba(23,50,77,0.04)] ${className}`}>{children}</div>;
}

export function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-su-border bg-su-canvas/60 py-12 text-center">
      <div className="text-slate-300">{icon}</div>
      <div className="text-sm font-semibold text-su-muted">{title}</div>
      {hint && <div className="max-w-sm text-xs text-su-muted/80">{hint}</div>}
    </div>
  );
}

export function DemoBanner() {
  // Production Government Mode: Hide prototype/demo notices
  return null;
}

export function BrandMark({ small, light }: { small?: boolean; light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex items-center justify-center rounded-lg bg-su-saffron font-extrabold text-white ${small ? "h-8 w-8 text-sm" : "h-10 w-10 text-lg"}`}>S</div>
      <div className="leading-tight">
        <div className={`font-extrabold tracking-tight ${light ? "text-white" : "text-su-navy"} ${small ? "text-base" : "text-lg"}`}>सुगम (S.U.G.A.M.)</div>
        <div className={`text-[10px] font-medium uppercase tracking-wider ${light ? "text-white/80" : "text-[#ED6C02]"}`}>Single Unified Gateway for AICTE Management</div>
      </div>
    </div>
  );
}

const EVENT_ICONS: Record<string, string> = {
  FILED: "📝", AUTO_ROUTED: "🎯", URGENCY_FLAGGED: "🚨", DUPLICATE_FLAGGED: "🧩",
  TRIAGED: "🧭", ASSIGNED: "👤", STATUS_CHANGED: "🔄", NEXT_ACTION_SET: "✅",
  RESPONSE_REQUESTED: "📣", RESPONSE_ADDED: "📨", NOTE_ADDED: "🗒️", EVIDENCE_ADDED: "📎",
  RATED: "⭐", REOPENED: "🔁", SLA_CHECK: "⏰", ESCALATED: "📢", REPORT_SENT: "📢",
  LINKED: "🔗", IMPORTED: "📥",
};

export function Timeline({ events }: { events: { id: string; eventType: string; summary: string; createdAt: string; visibility?: string; actorName?: string | null; actor?: { name: string; primaryRole: string } | null }[] }) {
  if (events.length === 0) return <div className="py-6 text-center text-sm text-su-muted">No activity recorded yet.</div>;
  return (
    <ol className="relative ml-3 space-y-4 border-l-2 border-su-border pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] ring-1 ring-su-border">
            {EVENT_ICONS[e.eventType] ?? "•"}
          </span>
          <div className="text-sm leading-snug text-su-text">{e.summary}</div>
          <div className="mt-0.5 text-xs text-su-muted/80">
            {fmtDateTime(e.createdAt)} · {timeAgo(e.createdAt)}{e.actorName ? ` · ${e.actorName}` : e.actor ? ` · ${e.actor.name}` : ""}
            {e.visibility === "INTERNAL" && <span className="ml-1.5 rounded bg-su-canvas px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-su-muted">Internal</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}

// Explainable-automation suggestion card (§1.3: show why a rule fired)
export function RuleSuggestionCard({ title, reason, actions }: { title: string; reason: string; actions?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#EAD3A2] bg-su-saffron-soft/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-su-saffron">✦ {title}</div>
          <p className="mt-1 text-xs leading-relaxed text-su-text/85">{reason}</p>
        </div>
        {actions && <div className="flex shrink-0 gap-1.5">{actions}</div>}
      </div>
    </div>
  );
}

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs font-medium text-su-red">{msg}</p>;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-su-muted">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-su-blue border-t-transparent" />
      {label ?? "Loading…"}
    </div>
  );
}

export function BureauChip({ bureau }: { bureau: string | null }) {
  if (!bureau) return <span className="text-xs text-su-muted">Unrouted</span>;
  return <span className="whitespace-nowrap text-xs font-medium text-su-muted">{BUREAU_LABELS[bureau] ?? bureau}</span>;
}

export function PageHead({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-su-navy">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-su-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
