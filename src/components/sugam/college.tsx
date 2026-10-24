"use client";
import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, ClipboardList, Clock, FileText, MailCheck } from "lucide-react";
import { api, fmtDate, timeAgo, CATEGORY_LABELS } from "@/lib/client";
import { Card, DemoBanner, EmptyState, KpiCard, PageHead, PriorityBadge, SectionTitle, SlaChip, SourceBadge, Spinner, StatusBadge } from "@/components/sugam/ui-bits";
import type { CaseRow, InternalReportRow, SummaryData, User } from "@/lib/types";

// ─────────────────── College Nodal Officer workspace (§8.1) ───────────────────
export function CollegeWorkspace({ user, onOpenCase, refreshKey }: {
  user: User; onOpenCase: (id: string) => void; refreshKey: number;
}) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [cases, setCases] = useState<CaseRow[] | null>(null);
  const [reports, setReports] = useState<InternalReportRow[] | null>(null);

  const load = useCallback(() => {
    api<SummaryData>("/api/v1/dashboard/summary").then((r) => setData(r.success ? (r as unknown as SummaryData) : null));
    api<{ cases: CaseRow[] }>("/api/v1/cases?pageSize=25").then((r) => setCases(r.success ? r.cases : []));
    api<{ reports: InternalReportRow[] }>("/api/v1/admin/reports").then((r) => setReports(r.success ? r.reports : []));
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const ack = async (id: string) => {
    const r = await api("/api/v1/admin/reports", { method: "PATCH", json: { id, action: "ACKNOWLEDGE" } });
    if (r.success) load();
  };

  const open = (cases ?? []).filter((c) => !["RESOLVED", "CLOSED"].includes(c.status));
  const responseRequests = (cases ?? []).filter((c) => c.status === "WAITING_FOR_INFORMATION" || c.status === "ACTION_REQUIRED");

  return (
    <div>
      <PageHead title="Institution workspace" subtitle={`${user.institution?.name ?? "Your institution"} · cases assigned to your institution only — complainant identities are protected.`} />
      <DemoBanner />

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard title="Open cases" value={data?.college?.assigned ?? "…"} tone="navy" icon={<ClipboardList className="h-4 w-4" />} />
        <KpiCard title="Due soon" value={data?.college?.dueSoon ?? "…"} tone="amber" icon={<Clock className="h-4 w-4" />} />
        <KpiCard title="Overdue" value={data?.college?.overdue ?? "…"} tone="red" icon={<AlertTriangle className="h-4 w-4" />} />
        <KpiCard title="Response needed" value={responseRequests.length} subtitle="info requested by officer" tone="amber" icon={<Bell className="h-4 w-4" />} />
        <KpiCard title="Resolved" value={data?.college?.resolved ?? "…"} tone="teal" icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <SectionTitle hint="Open the case to respond with supporting documents — a response never auto-resolves the case">Assigned cases</SectionTitle>
          {cases === null ? <Spinner /> : cases.length === 0 ? (
            <EmptyState icon={<FileText className="h-10 w-10" />} title="No cases assigned to your institution" hint="New cases will appear here with notifications." />
          ) : (
            <div className="space-y-2.5">
              {cases.map((c) => (
                <button key={c.id} onClick={() => onOpenCase(c.id)} className="flex w-full items-center gap-3 rounded-lg border border-su-border bg-white p-3.5 text-left transition hover:border-su-blue">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-su-blue">{c.caseNumber}</span>
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                      <SourceBadge source={c.sourceSystem} />
                    </div>
                    <div className="mt-1 truncate font-medium text-su-text">{c.subject}</div>
                    <div className="text-[11px] text-su-muted">{CATEGORY_LABELS[c.category] ?? c.category} · filed {timeAgo(c.createdAt)}</div>
                  </div>
                  <SlaChip dueAt={c.dueAt} breached={c.slaBreached} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="text-sm font-bold text-su-navy">How responding works</div>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-su-muted">
              <li>Open the case and read the officer&apos;s request.</li>
              <li>Use a pre-defined response format (⚡) or write your own.</li>
              <li>Attach supporting evidence in the Evidence tab (PDF/JPG, ≤10 MB).</li>
              <li>Submit the response — an AICTE officer reviews it and decides the next step. Your response never auto-closes a case.</li>
            </ol>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-su-navy"><MailCheck className="h-4 w-4 text-su-saffron" /> Notices &amp; reports</div>
            {reports === null ? <Spinner /> : reports.length === 0 ? (
              <p className="mt-1.5 text-xs text-su-muted">No accountability reports from officers. Keep response times healthy to avoid escalation.</p>
            ) : (
              <div className="mt-2 space-y-2.5">
                {reports.map((r) => (
                  <div key={r.id} className={`rounded-lg border p-2.5 text-xs ${r.status === "ACKNOWLEDGED" ? "border-[#BFE0D2] bg-su-green-soft/40" : "border-[#EBD9A8] bg-su-amber-soft/50"}`}>
                    <div className="font-semibold text-su-text">{r.subject}</div>
                    <div className="mt-0.5 leading-relaxed text-su-muted">{r.message}</div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[10px] text-su-muted">{r.officerName} · {fmtDate(r.createdAt)}{r.caseNumber ? ` · re ${r.caseNumber}` : ""}</span>
                      {r.status !== "ACKNOWLEDGED" && (
                        <button onClick={() => ack(r.id)} className="rounded bg-su-teal px-2 py-1 text-[10px] font-bold text-white">Acknowledge</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
