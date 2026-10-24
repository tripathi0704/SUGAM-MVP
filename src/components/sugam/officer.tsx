"use client";
import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpDown, Building2, ClipboardList, Download, Filter, Inbox, Plus, Search, Users, GitMerge } from "lucide-react";
import { api, fmtDate, fmtDateTime, timeAgo, slaLeft, CATEGORY_LABELS, BUREAU_LABELS, SOURCE_LABELS, STATUS_LABELS, REGION_LABELS } from "@/lib/client";
import { BureauChip, Card, DemoBanner, EmptyState, KpiCard, PageHead, PriorityBadge, SectionTitle, SlaChip, SourceBadge, Spinner, StatusBadge } from "@/components/sugam/ui-bits";
import type { CaseRow, InstitutionRow, SummaryData, User } from "@/lib/types";

// ─────────────────── Officer Overview Dashboard (§8.4) ───────────────────
export function OfficerDashboard({ user, onOpenCase, refreshKey, onNavigate }: {
  user: User; onOpenCase: (id: string) => void; refreshKey: number; onNavigate: (v: string) => void;
}) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [workload, setWorkload] = useState<{ matrix: { bureau: string; total: number; byStatus: Record<string, number> }[]; unassigned: number; ageing: { bucket: string; count: number }[] } | null>(null);

  useEffect(() => {
    api<SummaryData>("/api/v1/dashboard/summary").then((r) => setData(r.success ? (r as unknown as SummaryData) : null));
    api<{ matrix: { bureau: string; total: number; byStatus: Record<string, number> }[]; unassigned: number; ageing: { bucket: string; count: number }[] }>("/api/v1/dashboard/workload").then((r) => setWorkload(r.success ? r : null));
  }, [refreshKey]);

  if (!data) return <Spinner label="Computing dashboard from live database queries…" />;
  const statuses = ["RECEIVED", "NEEDS_TRIAGE", "ASSIGNED", "UNDER_PROCESS", "ACTION_INITIATED", "IN_REVIEW", "COORDINATION_REQUIRED", "WAITING_FOR_INFORMATION", "ACTION_REQUIRED", "PENDING_REVIEW", "REOPENED"];

  return (
    <div>
      <PageHead title="Overview dashboard" subtitle={`All counts are computed live from the case database · ${fmtDate(new Date())} · signed in as ${user.name}`}>
        <button onClick={() => onNavigate("overlaps")} className="flex items-center gap-1.5 rounded-lg border border-su-amber bg-amber-50 px-3 py-2 text-xs font-bold text-su-amber hover:bg-amber-100">
          <GitMerge className="h-3.5 w-3.5" /> Overlaps Monitor ({(data.overlapsCount ?? 0)})
        </button>
        <button onClick={() => onNavigate("cases")} className="rounded-lg border border-su-blue/40 bg-white px-3 py-2 text-xs font-bold text-su-blue hover:bg-su-blue-soft">Open register</button>
        {user.primaryRole === "INTAKE_OFFICER" && (
          <button onClick={() => onNavigate("intake")} className="rounded-lg bg-su-blue px-3 py-2 text-xs font-bold text-white">Intake queue ({data.needsTriage})</button>
        )}
      </PageHead>
      <DemoBanner />

      {/* SIH PS 26264 Flagship Alert Banner */}
      {(data.overlapsCount ?? 0) > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-su-amber text-white shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-su-navy text-sm">Potential Overlapping Cases – Coordination Required</span>
                <span className="rounded-full bg-su-red px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white animate-pulse">
                  {data.overlapsCount} {data.overlapsCount === 1 ? "Collision Detected" : "Collisions Detected"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-su-text/80">
                Parallel complaints identified across multiple AICTE Bureaus (e.g. <b>Regulation Bureau</b> &amp; <b>PGRC</b>) targeting the same institution. Joint coordination is required to prevent contradictory actions.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("overlaps")}
            className="flex items-center gap-1.5 rounded-lg bg-su-amber px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-amber-600 transition"
          >
            Review Cross-Bureau Overlaps ({data.overlapsCount}) →
          </button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <KpiCard title="Total cases" value={data.total} tone="navy" />
        <KpiCard title="Open / pending" value={data.open} tone="amber" />
        <KpiCard
          title="Cross-Bureau Overlaps"
          value={data.overlapsCount ?? 0}
          subtitle="Multi-bureau collisions"
          tone={(data.overlapsCount ?? 0) > 0 ? "red" : "navy"}
        />
        <KpiCard title="Due soon" value={data.dueSoon} subtitle="≤3 days statutory window" tone="amber" />
        <KpiCard title="Overdue" value={data.overdue} tone="red" />
        <KpiCard title="Unassigned" value={data.unassigned} tone="teal" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        <div>
          <SectionTitle hint="Open cases by bureau × status (statutory aggregate)">Workload by bureau</SectionTitle>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-su-border text-left uppercase tracking-wide text-su-muted">
                    <th className="px-3 py-2.5">Bureau</th><th className="px-2 py-2.5 text-center">Open</th>
                    {statuses.slice(0, 6).map((s) => <th key={s} className="px-1 py-2.5 text-center" title={STATUS_LABELS[s]}>{s.slice(0, 3)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {workload?.matrix.filter((m) => m.total > 0).map((m) => (
                    <tr key={m.bureau} className="border-b border-su-border/50 last:border-0">
                      <td className="px-3 py-2.5 font-semibold text-su-text">{BUREAU_LABELS[m.bureau] ?? m.bureau}</td>
                      <td className="px-2 py-2.5 text-center font-bold text-su-navy">{m.total}</td>
                      {statuses.slice(0, 6).map((s) => <td key={s} className="px-1 py-2.5 text-center text-su-muted">{m.byStatus[s] || "·"}</td>)}
                    </tr>
                  ))}
                  {(workload?.unassigned ?? 0) > 0 && (
                    <tr className="border-t border-su-border bg-su-amber-soft/40">
                      <td className="px-3 py-2.5 font-semibold text-su-amber">Not yet routed</td>
                      <td className="px-2 py-2.5 text-center font-bold text-su-amber">{workload?.unassigned}</td>
                      {statuses.slice(0, 6).map((s) => <td key={s} className="px-1 py-2.5" />)}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <div>
          <SectionTitle hint="How long open cases have been waiting">Ageing buckets</SectionTitle>
          <Card className="space-y-2.5 p-4">
            {workload?.ageing.map((a) => {
              const max = Math.max(...workload.ageing.map((x) => x.count), 1);
              return (
                <div key={a.bucket} className="flex items-center gap-3">
                  <span className="w-20 text-xs font-medium text-su-muted">{a.bucket}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded-md bg-su-canvas">
                    <div className={`h-full rounded-md ${a.bucket === "30+ days" ? "bg-su-red" : a.bucket === "16-30 days" ? "bg-su-amber" : "bg-su-blue"}`} style={{ width: `${Math.round((a.count / max) * 100)}%` }} />
                  </div>
                  <span className="w-8 text-right text-sm font-bold tabular-nums text-su-navy">{a.count}</span>
                </div>
              );
            })}
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        <div>
          <SectionTitle hint="Overdue first, then critical, then due soon — from live queries">Priority review queue</SectionTitle>
          {data.priorityQueue.length === 0 ? (
            <EmptyState icon={<ClipboardList className="h-8 w-8" />} title="Queue is clear" hint="No urgent open cases right now." />
          ) : (
            <div className="space-y-2">
              {data.priorityQueue.map((c) => (
                <button key={c.id} onClick={() => onOpenCase(c.id)} className="flex w-full items-center gap-3 rounded-lg border border-su-border bg-white p-3 text-left transition hover:border-su-blue">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-su-blue">{c.caseNumber}</span><PriorityBadge priority={c.priority} /></div>
                    <div className="mt-0.5 truncate text-sm font-medium text-su-text">{c.subject}</div>
                    <div className="text-[11px] text-su-muted">{typeof c.institution === "string" ? c.institution : c.institution?.name}</div>
                  </div>
                  <div className="text-right"><SlaChip dueAt={c.dueAt} breached={c.slaBreached} /><div className="mt-1"><StatusBadge status={c.status} /></div></div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <SectionTitle hint="Latest case events the current user is permitted to see">Recent activity</SectionTitle>
          <Card className="max-h-[340px] overflow-y-auto p-4">
            <ol className="space-y-3">
              {data.recentEvents.map((e) => (
                <li key={e.id} className="flex gap-2.5 text-sm">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-su-blue" />
                  <div className="min-w-0">
                    <div className="text-xs leading-snug text-su-text">{e.summary.slice(0, 140)}{e.summary.length > 140 ? "…" : ""}</div>
                    <div className="text-[11px] text-su-muted">{e.caseNumber ? <b className="font-mono text-su-blue">{e.caseNumber}</b> : null} · {timeAgo(e.createdAt)}{e.actorName ? ` · ${e.actorName}` : ""}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────── Complaint Register (§8.1) ───────────────────
export function ComplaintRegister({ user, onOpenCase, refreshKey }: {
  user: User; onOpenCase: (id: string) => void; refreshKey: number;
}) {
  const [rows, setRows] = useState<CaseRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [bureau, setBureau] = useState("");
  const [priority, setPriority] = useState("");
  const [source, setSource] = useState("");
  const [due, setDue] = useState("");
  const [region, setRegion] = useState("");
  const [overlapOnly, setOverlapOnly] = useState(false);
  const [mine, setMine] = useState(false);

  const query = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), pageSize: "12" });
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    if (category) p.set("category", category);
    if (bureau) p.set("bureau", bureau);
    if (priority) p.set("priority", priority);
    if (source) p.set("source", source);
    if (due) p.set("due", due);
    if (region) p.set("region", region);
    if (overlapOnly) p.set("overlapOnly", "1");
    if (mine) p.set("mine", "1");
    return p.toString();
  }, [page, q, status, category, bureau, priority, source, due, region, overlapOnly, mine]);

  useEffect(() => {
    setRows(null);
    const t = setTimeout(() => {
      api<{ cases: CaseRow[]; total: number }>(`/api/v1/cases?${query}`).then((r) => { if (r.success) { setRows(r.cases); setTotal(r.total); } else setRows([]); });
    }, 150);
    return () => clearTimeout(t);
  }, [query, refreshKey]);

  const pages = Math.ceil(total / 12);
  const filters: { label: string; value: string; set: (v: string) => void; options: [string, string][] }[] = [
    { label: "Bureau", value: bureau, set: setBureau, options: Object.entries(BUREAU_LABELS) },
    { label: "Status", value: status, set: setStatus, options: Object.entries(STATUS_LABELS) },
    { label: "Region", value: region, set: setRegion, options: Object.entries(REGION_LABELS) },
    { label: "Category", value: category, set: setCategory, options: Object.entries(CATEGORY_LABELS) },
    { label: "Priority", value: priority, set: setPriority, options: [["LOW", "Low"], ["NORMAL", "Normal"], ["HIGH", "High"], ["CRITICAL", "Critical"]] },
    { label: "Source", value: source, set: setSource, options: Object.entries(SOURCE_LABELS) },
    { label: "Deadline", value: due, set: setDue, options: [["overdue", "Overdue"], ["soon", "Due soon"], ["none", "No deadline"]] },
  ];

  return (
    <div>
      <PageHead title="Complaint register" subtitle="Searchable, paginated case register — filtered and scoped on the server for your role.">
        <button
          onClick={() => { setOverlapOnly(!overlapOnly); setPage(1); }}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
            overlapOnly
              ? "bg-su-amber text-white shadow-sm"
              : "border border-amber-300 bg-amber-50 text-su-amber hover:bg-amber-100"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {overlapOnly ? "Showing Overlaps Only" : "Filter Overlapping Cases"}
        </button>
        {user.primaryRole !== "AUDITOR" && (
          <button onClick={() => setMine(!mine)} className={`rounded-lg px-3 py-2 text-xs font-bold ${mine ? "bg-su-blue text-white" : "border border-su-border bg-white text-su-navy"}`}>My assignments only</button>
        )}
      </PageHead>
      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-su-muted" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search Case ID, subject, institution or AICTE ID…"
              className="w-full rounded-lg border border-su-border py-2 pl-9 pr-3 text-sm outline-none focus:border-su-blue" />
          </div>
          {filters.map((f) => (
            <select key={f.label} value={f.value} onChange={(e) => { f.set(e.target.value); setPage(1); }}
              className="rounded-lg border border-su-border bg-white px-2 py-2 text-xs text-su-text">
              <option value="">{f.label}: all</option>
              {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          {(q || status || category || bureau || priority || source || due || region || overlapOnly || mine) && (
            <button onClick={() => { setQ(""); setStatus(""); setCategory(""); setBureau(""); setPriority(""); setSource(""); setDue(""); setRegion(""); setOverlapOnly(false); setMine(false); setPage(1); }}
              className="rounded-lg px-2 py-2 text-xs font-semibold text-su-red hover:underline">Clear</button>
          )}
        </div>
      </Card>

      {rows === null ? <Spinner /> : rows.length === 0 ? (
        <EmptyState icon={<Filter className="h-8 w-8" />} title="No cases match these filters" hint="Try clearing filters or widening your search." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-su-border text-left text-xs uppercase tracking-wide text-su-muted">
                  <th className="px-4 py-3">Case ID</th><th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Institution &amp; Region</th><th className="px-4 py-3">Bureau</th>
                  <th className="px-4 py-3">Status</th><th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3">Source</th><th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} onClick={() => onOpenCase(c.id)} className="cursor-pointer border-b border-su-border/60 last:border-0 hover:bg-su-blue-soft/50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-su-blue">{c.caseNumber}</td>
                    <td className="max-w-[260px] px-4 py-3">
                      <div className="truncate font-medium text-su-text">{c.subject}</div>
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="max-w-[210px] px-4 py-3">
                      <div className="truncate text-xs font-semibold text-su-navy">{c.institution?.name}</div>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        {c.institution?.permanentId && (
                          <span className="font-mono text-[10px] font-bold text-su-blue bg-su-blue-soft px-1 rounded">
                            {c.institution.permanentId}
                          </span>
                        )}
                        {c.region && (
                          <span className="text-[10px] text-su-muted">
                            · {REGION_LABELS[c.region] ? REGION_LABELS[c.region].split(" ")[0] : c.region}
                          </span>
                        )}
                      </div>
                      {c.overlapFlag && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-su-amber">
                            <AlertTriangle className="h-2.5 w-2.5" /> Overlapping ({c.coordinationStatus || "Coord. Required"})
                          </span>
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-1 font-mono text-[10px] text-su-muted">
                        <span className="text-su-amber" title="Identity protected under Whistleblower protocol">🔒</span>
                        <span>Complaint ID:</span>
                        <span className="font-semibold text-su-navy">{c.caseNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><BureauChip bureau={c.bureau} /></td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3"><SlaChip dueAt={c.dueAt} breached={c.slaBreached} /></td>
                    <td className="px-4 py-3"><SourceBadge source={c.sourceSystem} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-su-muted">{timeAgo(c.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-su-border px-4 py-3 text-xs text-su-muted">
            <span>{total} case{total === 1 ? "" : "s"} · page {page} of {pages || 1}</span>
            <div className="flex gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-su-border px-3 py-1.5 font-semibold text-su-navy disabled:opacity-40">← Prev</button>
              <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-lg border border-su-border px-3 py-1.5 font-semibold text-su-navy disabled:opacity-40">Next →</button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─────────────────── My Work (assigned queue) ───────────────────
export function MyWork({ user, onOpenCase, refreshKey }: { user: User; onOpenCase: (id: string) => void; refreshKey: number }) {
  const [rows, setRows] = useState<CaseRow[] | null>(null);
  useEffect(() => {
    api<{ cases: CaseRow[] }>("/api/v1/cases?mine=1&pageSize=25").then((r) => {
      const list = r.success ? r.cases : [];
      const rank = (c: CaseRow) => (c.slaBreached ? 0 : c.priority === "CRITICAL" ? 1 : 2);
      setRows([...list].sort((a, b) => rank(a) - rank(b)));
    });
  }, [refreshKey]);

  return (
    <div>
      <PageHead title="My work" subtitle="Cases assigned to you, ordered by deadline pressure. Status changes are validated server-side." />
      {rows === null ? <Spinner /> : rows.length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-10 w-10" />} title="Nothing assigned to you yet" hint="New assignments appear here instantly with in-app notifications." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((c) => {
            const s = slaLeft(c.dueAt);
            return (
              <button key={c.id} onClick={() => onOpenCase(c.id)} className="rounded-xl border border-su-border bg-white p-4 text-left shadow-[0_1px_2px_rgba(23,50,77,0.04)] transition hover:-translate-y-px hover:shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-su-blue">{c.caseNumber}</span>
                  <SlaChip dueAt={c.dueAt} breached={c.slaBreached} />
                </div>
                <div className="mt-1.5 font-semibold leading-snug text-su-navy">{c.subject}</div>
                <div className="mt-0.5 text-xs text-su-muted">{c.institution?.name} · {CATEGORY_LABELS[c.category] ?? c.category}</div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5"><StatusBadge status={c.status} /><PriorityBadge priority={c.priority} /><BureauChip bureau={c.bureau} /></div>
                {c.nextActionLabel && <div className="mt-2 rounded bg-su-canvas px-2 py-1 text-[11px] text-su-muted">Next: {c.nextActionLabel}</div>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────── Intake Queue (registry officer) ───────────────────
export function IntakeQueue({ onOpenCase, refreshKey }: { onOpenCase: (id: string) => void; refreshKey: number }) {
  const [rows, setRows] = useState<CaseRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const load = () => {
    api<{ cases: CaseRow[] }>("/api/v1/cases?pageSize=25").then((r) => {
      const list = (r.success ? r.cases : []).filter((c) => ["RECEIVED", "NEEDS_TRIAGE"].includes(c.status));
      setRows(list);
    });
  };
  useEffect(() => { load(); }, [refreshKey]);

  const acceptSuggestion = async (c: CaseRow) => {
    setBusyId(c.id); setNotice(null);
    // Accept the rule suggestion by moving to NEEDS_TRIAGE (records audit + event)
    const r = await api(`/api/v1/cases/${c.id}`, { method: "PATCH", json: { status: "NEEDS_TRIAGE", reason: "Intake review: category/bureau rule suggestion accepted." } });
    setBusyId(null);
    if (!r.success) { setNotice(r.error?.message ?? "Action failed."); return; }
    setNotice(`${c.caseNumber} marked triaged. Next: assign an officer via the case page.`);
    load();
  };

  return (
    <div>
      <PageHead title="Intake queue" subtitle="Register, validate and triage incoming records. Rule suggestions are explainable and officer-overridable.">
        <button onClick={() => setShowImport(!showImport)} className="rounded-lg border border-su-blue/40 bg-white px-3 py-2 text-xs font-bold text-su-blue">Simulated import</button>
      </PageHead>
      {showImport && <ImportPanel onDone={() => { setShowImport(false); load(); }} />}
      {notice && <div className="mb-4 rounded-lg bg-su-blue-soft px-3 py-2 text-xs font-medium text-su-blue">{notice}</div>}

      {rows === null ? <Spinner /> : rows.length === 0 ? (
        <EmptyState icon={<Inbox className="h-10 w-10" />} title="Queue is clear" hint="No cases waiting for triage." />
      ) : (
        <div className="space-y-3">
          {rows.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => onOpenCase(c.id)} className="font-mono text-xs font-bold text-su-blue hover:underline">{c.caseNumber}</button>
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                    <SourceBadge source={c.sourceSystem} />
                  </div>
                  <div className="mt-1 font-semibold text-su-navy">{c.subject}</div>
                  <div className="text-xs text-su-muted">{c.institution?.name} · filed {timeAgo(c.createdAt)} · <BureauChip bureau={c.bureau} /></div>
                  {c.ruleExplanation && <div className="mt-2 rounded-lg border border-[#EAD3A2] bg-su-saffron-soft/60 px-3 py-2 text-[11px] leading-relaxed text-su-text/85">✦ {c.ruleExplanation}</div>}
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <button onClick={() => acceptSuggestion(c)} disabled={busyId === c.id} className="flex items-center gap-1.5 rounded-lg bg-su-blue px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                    {busyId === c.id ? "Saving…" : "Accept & triage"}
                  </button>
                  <button onClick={() => onOpenCase(c.id)} className="rounded-lg border border-su-border px-3 py-2 text-xs font-bold text-su-navy">Open case</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────── Simulated import panel (Pipeline G) ───────────────────
export function ImportPanel({ onDone }: { onDone: () => void }) {
  const [csv, setCsv] = useState(`CPG-2026-0501,AICTE-2087,Laboratory fee collected without receipt,Lab fee of 3000 collected in cash without any receipt or online record,FEE_REFUND
CPG-2026-0502,AICTE-1042,Mess hygiene inspection overdue,Mess inspection due in August has not been conducted till date,HOSTEL
CPG-2026-0503,AICTE-1042,Mess hygiene inspection overdue (resubmission),Resubmitting the mess inspection grievance submitted earlier this month,HOSTEL
CPG-2026-0504,AICTE-9999,Unknown institution test row,This row references an institution code that does not exist,OTHER
CPG-2026-0505,AICTE-3120,Exam,SHORT`);
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<{ status: string; totalRows: number; importedRows: number; duplicateSkipped: number; rejected: { row: number; reason: string; data?: string }[]; preview?: { sourceRecordId: string; institution: string; subject: string; category: string; priority: string }[]; disclaimer?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    const r = await api<{ status: string; totalRows: number; importedRows: number; duplicateSkipped: number; rejected: { row: number; reason: string }[]; preview?: { sourceRecordId: string; institution: string; subject: string; category: string; priority: string }[]; disclaimer?: string }>("/api/v1/imports/csv", { json: { csv, dryRun } });
    setBusy(false);
    if (!r.success) { setResult({ status: "FAILED", totalRows: 0, importedRows: 0, duplicateSkipped: 0, rejected: [{ row: 0, reason: r.error?.message ?? "Import failed" }] }); return; }
    setResult(r as unknown as typeof result);
    if (!dryRun) onDone();
  };

  return (
    <Card className="mb-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-su-navy">SIMULATED CPGRAMS import</div>
          <p className="text-[11px] text-su-muted">CSV columns: sourceRecordId, institutionCode, subject, description, category(optional). Source-ID idempotency prevents duplicate cases.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-su-muted"><input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} /> Preview only</label>
          <button onClick={run} disabled={busy} className="rounded-lg bg-su-blue px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? "Running…" : dryRun ? "Preview import" : "Run import"}</button>
        </div>
      </div>
      <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={5} className="mt-3 w-full rounded-lg border border-su-border p-2.5 font-mono text-[11px]" />
      {result && (
        <div className="mt-3 rounded-lg border border-su-border bg-su-canvas/60 p-3 text-xs">
          <div className="flex flex-wrap gap-3 font-semibold">
            <span className={result.status === "SUCCESS" ? "text-su-teal" : result.status === "PARTIAL" ? "text-su-amber" : "text-su-red"}>Status: {result.status}</span>
            <span>{result.totalRows} rows</span><span className="text-su-teal">{result.importedRows} imported</span>
            <span className="text-su-amber">{result.duplicateSkipped} duplicate-skipped</span>
            <span className="text-su-red">{result.rejected.length} rejected</span>
          </div>
          {result.rejected.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.rejected.map((r, i) => <li key={i} className="text-su-red">Row {r.row}: {r.reason}{r.data ? ` — "${r.data}"` : ""}</li>)}
            </ul>
          )}
          {result.preview && result.preview.length > 0 && (
            <div className="mt-2 overflow-x-auto"><table className="w-full text-left text-[11px]">
              <thead><tr className="text-su-muted"><th className="py-1 pr-3">Source ID</th><th className="py-1 pr-3">Institution</th><th className="py-1 pr-3">Subject</th><th className="py-1 pr-3">Category</th><th className="py-1">Priority</th></tr></thead>
              <tbody>{result.preview.map((p, i) => <tr key={i} className="border-t border-su-border/60"><td className="py-1 pr-3 font-mono">{p.sourceRecordId}</td><td className="py-1 pr-3">{p.institution}</td><td className="py-1 pr-3">{p.subject}</td><td className="py-1 pr-3">{CATEGORY_LABELS[p.category]}</td><td className="py-1">{p.priority}</td></tr>)}</tbody>
            </table></div>
          )}
          {result.disclaimer && <p className="mt-2 text-[10px] text-su-muted">{result.disclaimer}</p>}
        </div>
      )}
    </Card>
  );
}
