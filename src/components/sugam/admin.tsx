"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Database, Gavel, Play, Plug, Plus, RefreshCw, Send, ScrollText, Users } from "lucide-react";
import { api, fmtDate, fmtDateTime, CATEGORY_LABELS, BUREAU_LABELS, ROLE_LABELS } from "@/lib/client";
import { Card, DemoBanner, EmptyState, KpiCard, PageHead, SectionTitle, Spinner } from "@/components/sugam/ui-bits";
import { ImportPanel } from "@/components/sugam/officer";
import type { InternalReportRow, ReplyTemplateRow, SyncRunRow, UserAdminRow, User } from "@/lib/types";

// ─────────────────── Demo users & roles ───────────────────
export function AdminUsers({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<UserAdminRow[] | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const load = useCallback(() => {
    api<{ users: UserAdminRow[] }>("/api/v1/admin/users").then((r) => setRows(r.success ? r.users : []));
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);

  const toggle = async (id: string, isActive: boolean) => {
    await api(`/api/v1/admin/users/${id}`, { method: "PATCH", json: { isActive } });
    load();
  };

  return (
    <div>
      <PageHead title="Demo users &amp; roles" subtitle="Least-privilege demo accounts. Admin user management does NOT grant protected identity access (§1.2).">
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 rounded-lg bg-su-blue px-3 py-2 text-xs font-bold text-white"><Plus className="h-3.5 w-3.5" /> Add user</button>
      </PageHead>
      {showAdd && <AddUser onDone={() => setShowAdd(false)} />}
      {rows === null ? <Spinner /> : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-su-border text-left text-xs uppercase tracking-wide text-su-muted">
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Scope</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Added</th><th></th>
              </tr></thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b border-su-border/60 last:border-0">
                    <td className="px-4 py-3 font-medium text-su-text">{u.name}</td>
                    <td className="px-4 py-3 text-xs text-su-muted">{u.email}</td>
                    <td className="px-4 py-3"><span className="rounded bg-su-blue-soft px-1.5 py-0.5 text-[10px] font-bold text-su-blue">{ROLE_LABELS[u.primaryRole] ?? u.primaryRole}</span></td>
                    <td className="px-4 py-3 text-xs text-su-muted">{u.bureau ? BUREAU_LABELS[u.bureau] ?? u.bureau : u.institution ? u.institution.name : "—"}</td>
                    <td className="px-4 py-3">{u.isActive ? <span className="rounded-full bg-su-green-soft px-2 py-0.5 text-[10px] font-bold text-su-teal">ACTIVE</span> : <span className="rounded-full bg-su-red-soft px-2 py-0.5 text-[10px] font-bold text-su-red">DEACTIVATED</span>}</td>
                    <td className="px-4 py-3 text-xs text-su-muted">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggle(u.id, !u.isActive)} className="rounded-lg border border-su-border px-2.5 py-1.5 text-xs font-bold text-su-navy hover:bg-su-canvas">
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function AddUser({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", primaryRole: "COMPLAINANT", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    setBusy(true); setErrors({});
    const r = await api("/api/v1/admin/users", { json: form });
    setBusy(false);
    if (!r.success) { setErrors(r.error?.fieldErrors ?? { name: r.error?.message ?? "Failed." }); return; }
    onDone();
  };
  return (
    <Card className="mb-4 p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div><label className="text-[11px] font-semibold uppercase text-su-muted">Name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1 w-full rounded-lg border border-su-border px-3 py-2 text-sm" />{errors.name && <p className="text-xs text-su-red">{errors.name}</p>}</div>
        <div><label className="text-[11px] font-semibold uppercase text-su-muted">Email</label><input value={form.email} onChange={(e) => set("email", e.target.value)} className="mt-1 w-full rounded-lg border border-su-border px-3 py-2 text-sm" />{errors.email && <p className="text-xs text-su-red">{errors.email}</p>}</div>
        <div><label className="text-[11px] font-semibold uppercase text-su-muted">Role</label><select value={form.primaryRole} onChange={(e) => set("primaryRole", e.target.value)} className="mt-1 w-full rounded-lg border border-su-border px-3 py-2 text-sm">{Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label className="text-[11px] font-semibold uppercase text-su-muted">Password (≥8)</label><input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} className="mt-1 w-full rounded-lg border border-su-border px-3 py-2 text-sm" />{errors.password && <p className="text-xs text-su-red">{errors.password}</p>}</div>
      </div>
      <button onClick={save} disabled={busy} className="mt-3 rounded-lg bg-su-blue px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Create user"}</button>
    </Card>
  );
}

// ─────────────────── Integrations & imports ───────────────────
export function AdminIntegrations({ refreshKey, isAdmin }: { refreshKey: number; isAdmin: boolean }) {
  const [integrations, setIntegrations] = useState<{ key: string; name: string; status: string; detail: string; productionRequirements: string }[] | null>(null);
  const [runs, setRuns] = useState<SyncRunRow[] | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [templates, setTemplates] = useState<ReplyTemplateRow[]>([]);

  const load = useCallback(() => {
    api<{ integrations: typeof integrations }>("/api/v1/integrations/status").then((r) => setIntegrations(r.success ? r.integrations : []));
    api<{ runs: SyncRunRow[] }>("/api/v1/imports/runs").then((r) => setRuns(r.success ? r.runs : [])).catch(() => setRuns([]));
    api<{ templates: ReplyTemplateRow[] }>("/api/v1/admin/templates").then((r) => setTemplates(r.success ? r.templates : [])).catch(() => setTemplates([]));
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);

  return (
    <div>
      <PageHead title="Integrations &amp; imports" subtitle="Mock connectors are clearly labeled. No live government system is connected in the demo.">
        {isAdmin && <button onClick={() => setShowImport(!showImport)} className="rounded-lg bg-su-blue px-3 py-2 text-xs font-bold text-white">Run simulated import</button>}
      </PageHead>
      {showImport && isAdmin && <ImportPanel onDone={() => { setShowImport(false); load(); }} />}
      <div className="grid gap-3 lg:grid-cols-3">
        {(integrations ?? []).map((i) => (
          <Card key={i.key} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-su-navy"><Plug className="h-4 w-4 text-su-blue" /> {i.name}</div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${i.status === "ACTIVE_LOCAL" ? "bg-su-green-soft text-su-teal" : i.status === "SIMULATED" ? "bg-su-amber-soft text-su-amber" : "bg-slate-100 text-slate-500"}`}>{i.status}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-su-muted">{i.detail}</p>
            <p className="mt-2 rounded bg-su-canvas px-2 py-1.5 text-[10px] leading-relaxed text-su-muted"><b>Production requires:</b> {i.productionRequirements}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <SectionTitle hint="Import runs with per-row rejection reports (idempotency enforced)">Sync-run history</SectionTitle>
        {runs === null ? <Spinner /> : runs.length === 0 ? <EmptyState icon={<Database className="h-8 w-8" />} title="No import runs yet" /> : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-su-border text-left text-xs uppercase tracking-wide text-su-muted">
                  <th className="px-4 py-3">When</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Rows</th><th className="px-4 py-3 text-center">Imported</th><th className="px-4 py-3 text-center">Dup-skipped</th><th className="px-4 py-3 text-center">Rejected</th>
                </tr></thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id} className="border-b border-su-border/60 align-top last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-su-muted">{fmtDateTime(r.startedAt)}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-su-text">{r.sourceSystem}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.status === "SUCCESS" ? "bg-su-green-soft text-su-teal" : r.status === "PARTIAL" ? "bg-su-amber-soft text-su-amber" : "bg-su-red-soft text-su-red"}`}>{r.status}</span></td>
                      <td className="px-4 py-3 text-center tabular-nums">{r.totalRows}</td>
                      <td className="px-4 py-3 text-center tabular-nums text-su-teal">{r.importedRows}</td>
                      <td className="px-4 py-3 text-center tabular-nums text-su-amber">{r.duplicateSkipped}</td>
                      <td className="px-4 py-3 text-center tabular-nums text-su-red">{r.rejectedRows.length}
                        {r.rejectedRows.length > 0 && <div className="mt-1 space-y-0.5 text-left">{r.rejectedRows.map((x, i) => <div key={i} className="text-[10px] text-su-muted">Row {x.row}: {x.reason}</div>)}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <div className="mt-6">
        <SectionTitle hint="Pre-defined formats the college portal can apply in one click">Response templates</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-center justify-between text-sm font-bold text-su-navy">{t.title}{t.category && <span className="rounded bg-su-saffron-soft px-1.5 py-0.5 text-[10px] text-su-saffron">{CATEGORY_LABELS[t.category]}</span>}</div>
              <p className="mt-1.5 text-xs leading-relaxed text-su-muted">{t.body.slice(0, 160)}{t.body.length > 160 ? "…" : ""}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────── Policy configuration view ───────────────────
export function AdminPolicy() {
  const [data, setData] = useState<{ policy: Record<string, unknown>; routing: Record<string, string> } | null>(null);
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    api<{ policy: Record<string, unknown>; routingMap: Record<string, string> }>("/api/v1/demo/checks").then((r) => {
      if (r.success) setData({ policy: r.policy ?? {}, routing: r.routingMap ?? {} });
      else setDenied(true);
    });
  }, []);
  if (denied) return <EmptyState icon={<ScrollText className="h-8 w-8" />} title="Policy view is restricted" hint="Platform admin and officer roles can view the demo configuration." />;
  if (!data) return <Spinner />;
  const p = data.policy as { version?: string; slaDaysByPriority?: Record<string, number>; dueSoonDays?: number; note?: string };
  return (
    <div>
      <PageHead title="Policy configuration" subtitle="Demo thresholds are configuration — never hard-coded statutory deadlines." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm font-bold text-su-navy">SLA policy ({p.version ?? "demo"})</div>
          <div className="mt-3 space-y-2 text-sm">
            {Object.entries(p.slaDaysByPriority ?? {}).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-lg bg-su-canvas px-3 py-2">
                <span className="font-semibold text-su-text">{k}</span><span className="text-su-muted">{v} day{v === 1 ? "" : "s"}</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg bg-su-canvas px-3 py-2">
              <span className="font-semibold text-su-text">Due-soon window</span><span className="text-su-muted">{p.dueSoonDays ?? 3} days</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] italic text-su-muted">{p.note ?? ""}</p>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-bold text-su-navy">Category → bureau routing map</div>
          <div className="mt-3 space-y-1.5 text-sm">
            {Object.entries(data.routing).filter(([k]) => k !== "note").map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-lg bg-su-canvas px-3 py-2 text-xs">
                <span className="font-semibold text-su-text">{CATEGORY_LABELS[k] ?? k}</span>
                <span className="text-su-muted">→ {BUREAU_LABELS[v] ?? v}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] italic text-su-muted">Explainable and officer-overridable on every case.</p>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────── Institution ranking ───────────────────
export function AdminRanking() {
  const [rows, setRows] = useState<{ institutionId: string; code: string; name: string; state: string | null; totalCases: number; openCases: number; overdueCases: number; resolvedCount: number; breaches: number; avgResolutionDays: number | null; avgRating: number | null; score: number | null; band: string; breakdown: { speed: number; sla: number; feedback: number } }[] | null>(null);
  const [formula, setFormula] = useState("");
  useEffect(() => {
    api<{ institutions: typeof rows; formula: string }>("/api/v1/admin/scores").then((r) => { if (r.success) { setRows(r.institutions as never); setFormula(r.formula); } else setRows([]); });
  }, []);
  return (
    <div>
      <PageHead title="Institution ranking" subtitle="Accountability scores computed from real case data — formula fully disclosed." />
      {rows === null ? <Spinner /> : (
        <>
          <Card className="mb-4 border-l-4 border-l-su-saffron p-3 text-xs leading-relaxed text-su-muted">{formula}</Card>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-su-border text-left text-xs uppercase tracking-wide text-su-muted">
                  <th className="px-4 py-3">Rank</th><th className="px-4 py-3">Institution</th><th className="px-4 py-3 text-center">Cases</th>
                  <th className="px-4 py-3 text-center">Overdue</th><th className="px-4 py-3 text-center">SLA breaches</th>
                  <th className="px-4 py-3 text-center">Avg days</th><th className="px-4 py-3 text-center">Feedback</th>
                  <th className="px-4 py-3 text-center">Score</th>
                </tr></thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.institutionId} className="border-b border-su-border/60 last:border-0">
                      <td className="px-4 py-3 text-sm font-bold text-su-navy">#{idx + 1}</td>
                      <td className="px-4 py-3"><div className="font-medium text-su-text">{r.name}</div><div className="font-mono text-[10px] text-su-muted">{r.code}</div></td>
                      <td className="px-4 py-3 text-center tabular-nums">{r.totalCases} <span className="text-xs text-su-muted">({r.openCases} open)</span></td>
                      <td className="px-4 py-3 text-center tabular-nums text-su-red">{r.overdueCases}</td>
                      <td className="px-4 py-3 text-center tabular-nums text-su-amber">{r.breaches}</td>
                      <td className="px-4 py-3 text-center tabular-nums">{r.avgResolutionDays ?? "—"}</td>
                      <td className="px-4 py-3 text-center tabular-nums">{r.avgRating != null ? `${r.avgRating}/5` : "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {r.score == null ? <span className="text-xs text-su-muted">n/a</span> : (
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${r.band === "GREEN" ? "bg-su-green-soft text-su-teal" : r.band === "AMBER" ? "bg-su-amber-soft text-su-amber" : "bg-su-red-soft text-su-red"}`}>
                            <Gavel className="h-3 w-3" /> {r.score} · {r.band}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ─────────────────── Accountability reports ───────────────────
export function AdminReports({ user, refreshKey }: { user: User; refreshKey: number }) {
  const [rows, setRows] = useState<InternalReportRow[] | null>(null);
  const [showSend, setShowSend] = useState(false);
  const load = useCallback(() => {
    api<{ reports: InternalReportRow[] }>("/api/v1/admin/reports").then((r) => setRows(r.success ? r.reports : []));
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);
  const canSend = ["REVIEWING_OFFICER", "PLATFORM_ADMIN"].includes(user.primaryRole);

  return (
    <div>
      <PageHead title="Accountability reports" subtitle="Internal reports to institutions when complaints are missed or responses are overdue.">
        {canSend && <button onClick={() => setShowSend(!showSend)} className="flex items-center gap-1.5 rounded-lg bg-su-blue px-3 py-2 text-xs font-bold text-white"><Send className="h-3.5 w-3.5" /> Send report</button>}
      </PageHead>
      {showSend && canSend && <SendReport onDone={() => { setShowSend(false); load(); }} />}
      {rows === null ? <Spinner /> : rows.length === 0 ? (
        <EmptyState icon={<Send className="h-8 w-8" />} title="No reports" hint="Reports appear here when officers flag accountability concerns." />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id} className={`p-4 ${r.status === "ACKNOWLEDGED" ? "border-l-4 border-l-[#176B61]" : "border-l-4 border-l-[#B7791F]"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-su-navy">{r.subject}</div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.status === "ACKNOWLEDGED" ? "bg-su-green-soft text-su-teal" : "bg-su-amber-soft text-su-amber"}`}>{r.status}</span>
              </div>
              <div className="mt-0.5 text-xs text-su-muted">{r.institution?.name} ({r.institution?.code}){r.caseNumber ? ` · re ${r.caseNumber}` : ""} · by {r.officerName} · {fmtDate(r.createdAt)}</div>
              <p className="mt-2 text-sm leading-relaxed text-su-text">{r.message}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SendReport({ onDone }: { onDone: () => void }) {
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<{ institutions: { id: string; name: string }[] }>("/api/v1/institutions?pageSize=50").then((r) => setInstitutions(r.success ? r.institutions : []));
  }, []);
  const send = async () => {
    setBusy(true); setErrors({});
    const r = await api("/api/v1/admin/reports", { json: { institutionId, subject, message } });
    setBusy(false);
    if (!r.success) { setErrors(r.error?.fieldErrors ?? { subject: r.error?.message ?? "Failed." }); return; }
    onDone();
  };
  return (
    <Card className="mb-4 p-4">
      <div className="text-sm font-bold text-su-navy">Send internal report to institution</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-[11px] font-semibold uppercase text-su-muted">Institution</label>
          <select value={institutionId} onChange={(e) => setInstitutionId(e.target.value)} className="mt-1 w-full rounded-lg border border-su-border px-3 py-2 text-sm">
            <option value="">Select…</option>
            {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          {errors.institutionId && <p className="text-xs text-su-red">{errors.institutionId}</p>}
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase text-su-muted">Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full rounded-lg border border-su-border px-3 py-2 text-sm" />
          {errors.subject && <p className="text-xs text-su-red">{errors.subject}</p>}
        </div>
      </div>
      <div className="mt-3">
        <label className="text-[11px] font-semibold uppercase text-su-muted">Concern (min 20 chars)</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-su-border px-3 py-2 text-sm" />
        {errors.message && <p className="text-xs text-su-red">{errors.message}</p>}
      </div>
      <button onClick={send} disabled={busy} className="mt-3 rounded-lg bg-su-blue px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? "Sending…" : "Send report"}</button>
    </Card>
  );
}

// ─────────────────── Demo controls ───────────────────
export function AdminDemo({ onRefresh }: { onRefresh: () => void }) {
  const [checks, setChecks] = useState<{ checked: number; dueSoon: number; overdue: number; escalated: number; note: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const runChecks = async () => {
    setBusy("checks"); setMsg(null);
    const r = await api<{ checked: number; dueSoon: number; overdue: number; escalated: number; note: string }>("/api/v1/demo/checks", { json: {} });
    setBusy(null);
    if (r.success) setChecks({ checked: r.checked, dueSoon: r.dueSoon, overdue: r.overdue, escalated: r.escalated, note: r.note });
  };
  const reset = async () => {
    setBusy("reset"); setMsg(null);
    const r = await api("/api/v1/demo/reset", { json: {} });
    setBusy(null);
    setMsg(r.success ? "Demo dataset reset — fresh synthetic data created and hash chain restarted." : r.error?.message ?? "Reset failed.");
    if (r.success) onRefresh();
  };

  return (
    <div>
      <PageHead title="Demo controls" subtitle="Trigger automation visibly on stage: deadline checks, escalation, and a clean reset between demo runs." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-su-navy"><Play className="h-4 w-4 text-su-blue" /> Run demo deadline checks</div>
          <p className="mt-1.5 text-xs leading-relaxed text-su-muted">Evaluates every open case against the demo SLA policy: marks due-soon/overdue, creates deduplicated in-app notifications, and escalates overdue cases to the reviewing officer. Safe to run repeatedly.</p>
          <button onClick={runChecks} disabled={busy === "checks"} className="mt-3 flex items-center gap-2 rounded-lg bg-su-blue px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${busy === "checks" ? "animate-spin" : ""}`} /> Run checks now
          </button>
          {checks && (
            <div className="mt-3 rounded-lg bg-su-green-soft p-3 text-xs text-su-teal" data-testid="checks-result">
              <b>Result:</b> {checks.checked} open cases checked · {checks.dueSoon} due soon · <b>{checks.overdue} overdue</b> · {checks.escalated} newly escalated.
              <div className="mt-1 text-[10px] text-su-teal/80">{checks.note}</div>
            </div>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-su-navy"><Database className="h-4 w-4 text-su-red" /> Reset demo dataset</div>
          <p className="mt-1.5 text-xs leading-relaxed text-su-muted">Deletes all synthetic records and reseeds: 6 institutions, demo users for all 7 roles, 16 cases across every status, the duplicate pair, policies, templates, and one simulated import run. Disabled when DEMO_MODE=false.</p>
          <button onClick={reset} disabled={busy === "reset"} className="mt-3 flex items-center gap-2 rounded-lg border border-su-red/40 bg-white px-4 py-2.5 text-sm font-bold text-su-red disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${busy === "reset" ? "animate-spin" : ""}`} /> Reset demo data
          </button>
          {msg && <div className="mt-3 rounded-lg bg-su-blue-soft p-3 text-xs text-su-blue">{msg}</div>}
        </Card>
      </div>
    </div>
  );
}
