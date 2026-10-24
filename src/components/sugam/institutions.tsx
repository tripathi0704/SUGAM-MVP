"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Building2, Plus, Search, ShieldCheck, Users, AlertTriangle } from "lucide-react";
import { api, fmtDate, CATEGORY_LABELS, BUREAU_LABELS, REGION_LABELS } from "@/lib/client";
import { Card, DemoBanner, EmptyState, KpiCard, PageHead, SectionTitle, Spinner, StatusBadge, BureauChip } from "@/components/sugam/ui-bits";
import type { InstitutionRow, Institution360, InternalReportRow, User } from "@/lib/types";

export function InstitutionDirectory({ user, onOpen360, refreshKey }: {
  user: User; onOpen360: (id: string) => void; refreshKey: number;
}) {
  const [rows, setRows] = useState<InstitutionRow[] | null>(null);
  const [q, setQ] = useState("");
  const [total, setTotal] = useState(0);
  const isAdmin = user.primaryRole === "PLATFORM_ADMIN";
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setRows(null);
      api<{ institutions: InstitutionRow[]; total: number }>(`/api/v1/institutions?pageSize=20&q=${encodeURIComponent(q)}`).then((r) => { setRows(r.success ? r.institutions : []); setTotal(r.total); });
    }, 150);
    return () => clearTimeout(t);
  }, [q, refreshKey]);

  return (
    <div>
      <PageHead title="Institution directory" subtitle="Registry of institutions with live case counts. Institution 360° shows associated cases while preserving every Case ID.">
        {isAdmin && <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 rounded-lg bg-su-blue px-3 py-2 text-xs font-bold text-white"><Plus className="h-3.5 w-3.5" /> Add institution</button>}
      </PageHead>
      {isAdmin && showAdd && <AddInstitution onDone={() => setShowAdd(false)} />}
      <DemoBanner />
      <Card className="mt-4 mb-4 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-su-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, AICTE Permanent ID, registry code, state or district…"
            className="w-full rounded-lg border border-su-border py-2 pl-9 pr-3 text-sm outline-none focus:border-su-blue" />
        </div>
      </Card>
      {rows === null ? <Spinner /> : rows.length === 0 ? (
        <EmptyState icon={<Building2 className="h-10 w-10" />} title="No institutions found" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-su-border text-left text-xs uppercase tracking-wide text-su-muted">
                  <th className="px-4 py-3">Code &amp; AICTE PID</th><th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Region &amp; Location</th><th className="px-4 py-3 text-center">Total</th>
                  <th className="px-4 py-3 text-center">Open</th><th className="px-4 py-3 text-center">Overdue</th>
                  <th className="px-4 py-3 text-center">Resolved</th><th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id} className="border-b border-su-border/60 last:border-0 hover:bg-su-blue-soft/40">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-su-blue">
                      <div>{i.code}</div>
                      {i.permanentId && <div className="text-[10px] text-su-muted font-normal">PID: {i.permanentId}</div>}
                    </td>
                    <td className="px-4 py-3 font-medium text-su-text">
                      {i.name}
                      {i.dataSource === "OFFICER_ENTERED" && <span className="ml-1.5 rounded bg-su-blue-soft px-1 py-px text-[10px] font-bold text-su-blue">added by admin</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-su-muted">
                      <div className="font-semibold text-su-navy">{i.region ? (REGION_LABELS[i.region] ? REGION_LABELS[i.region].split(" ")[0] : i.region) : "—"}</div>
                      <div>{[i.district, i.state].filter(Boolean).join(", ") || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold tabular-nums text-su-navy">{i.totalCases}</td>
                    <td className="px-4 py-3 text-center tabular-nums text-su-amber">{i.openCases}</td>
                    <td className="px-4 py-3 text-center tabular-nums text-su-red">{i.overdueCases}</td>
                    <td className="px-4 py-3 text-center tabular-nums text-su-teal">{i.resolvedCases}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => onOpen360(i.id)} className="rounded-lg border border-su-blue/40 px-2.5 py-1.5 text-xs font-bold text-su-blue hover:bg-su-blue-soft">360° view</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-su-border px-4 py-2.5 text-xs text-su-muted">{total} institutions in the AICTE National Registry</div>
        </Card>
      )}
    </div>
  );
}

function AddInstitution({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true); setErrors({});
    const r = await api("/api/v1/institutions", { json: { code, name, state, district } });
    setBusy(false);
    if (!r.success) { setErrors(r.error?.fieldErrors ?? { code: r.error?.message ?? "Failed." }); return; }
    onDone();
  };

  return (
    <Card className="mb-4 p-4">
      <div className="text-sm font-bold text-su-navy">Add institution to National Registry</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div><label className="text-[11px] font-semibold uppercase text-su-muted">Code</label><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="AICTE-6100" className="mt-1 w-full rounded-lg border border-su-border px-3 py-2 text-sm" />{errors.code && <p className="text-xs text-su-red">{errors.code}</p>}</div>
        <div className="sm:col-span-2"><label className="text-[11px] font-semibold uppercase text-su-muted">Name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Institute of Technology" className="mt-1 w-full rounded-lg border border-su-border px-3 py-2 text-sm" />{errors.name && <p className="text-xs text-su-red">{errors.name}</p>}</div>
        <div><label className="text-[11px] font-semibold uppercase text-su-muted">State</label><input value={state} onChange={(e) => setState(e.target.value)} className="mt-1 w-full rounded-lg border border-su-border px-3 py-2 text-sm" /></div>
        <div><label className="text-[11px] font-semibold uppercase text-su-muted">District</label><input value={district} onChange={(e) => setDistrict(e.target.value)} className="mt-1 w-full rounded-lg border border-su-border px-3 py-2 text-sm" /></div>
      </div>
      <button onClick={save} disabled={busy} className="mt-3 rounded-lg bg-su-blue px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Save institution"}</button>
    </Card>
  );
}

// ─────────────────── Institution 360° (§9 Day 6) ───────────────────
export function Institution360({ id, onBack, onOpenCase, backLabel }: { id: string; onBack: () => void; onOpenCase: (cid: string) => void; backLabel?: string }) {
  const [data, setData] = useState<Institution360 | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<Institution360 & { institution: Institution360; totalCases: number; openCases: number; overdueCases: number; resolvedCases: number; score: Institution360["score"]; reports: InternalReportRow[]; cases: Institution360["cases"] }>(`/api/v1/institutions/${id}`).then((r) => {
      if (!r.success) { setErr(r.error?.message ?? "Failed to load."); return; }
      setData({ ...(r as unknown as Institution360) });
    });
  }, [id]);

  if (err) return <EmptyState icon={<Building2 className="h-10 w-10" />} title={err} />;
  if (!data) return <Spinner label="Assembling Institution 360° view…" />;

  const officers = data.nodalOfficers ?? [];
  const cases = data.cases ?? [];
  const reports = data.reports ?? [];

  const band = data.score.band;
  const bandTone = band === "GREEN" ? "bg-su-green-soft text-su-teal border-[#BFE0D2]" : band === "AMBER" ? "bg-su-amber-soft text-su-amber border-[#EBD9A8]" : "bg-su-red-soft text-su-red border-[#F0C5C0]";

  const activeCases = cases.filter((c) => ["RECEIVED", "NEEDS_TRIAGE", "ASSIGNED", "UNDER_PROCESS", "ACTION_INITIATED", "IN_REVIEW", "COORDINATION_REQUIRED", "WAITING_FOR_INFORMATION", "ACTION_REQUIRED"].includes(c.status));
  const distinctBureaus = Array.from(new Set(activeCases.map((c) => c.bureau).filter(Boolean)));
  const hasOverlaps = cases.some((c) => c.overlapFlag) || distinctBureaus.length > 1;

  return (
    <div>
      <button onClick={onBack} className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-su-blue hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> {backLabel ?? "Back to directory"}</button>
      <PageHead title="Institution 360°" subtitle="Centralized institution profile — tracking all multi-bureau cases while preserving independent case files." />

      {/* SIH PS 26264 Active Multi-Bureau Collision Alert */}
      {hasOverlaps && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-su-amber text-white shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-su-navy text-sm">Potential Overlapping Cases – Coordination Required</span>
                <span className="rounded bg-su-amber px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">Active Collision</span>
              </div>
              <p className="mt-0.5 text-xs text-su-text/80 leading-relaxed">
                This institution has simultaneous active proceedings across multiple bureaus ({distinctBureaus.map((b) => BUREAU_LABELS[b as string] ?? b).join(", ")}).
                AICTE single-window coordination protocol is active to prevent redundant inquiries or contradictory notices.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-su-blue">{data.code}</span>
                  {data.permanentId && (
                    <span className="rounded bg-su-blue-soft px-2 py-0.5 font-mono text-xs font-bold text-su-blue">
                      AICTE PID: {data.permanentId}
                    </span>
                  )}
                  {data.region && (
                    <span className="rounded bg-su-canvas border border-su-border px-2 py-0.5 text-xs font-medium text-su-navy">
                      📍 {REGION_LABELS[data.region] ?? data.region}
                    </span>
                  )}
                  <span className="rounded bg-su-green-soft px-2 py-0.5 text-xs font-bold text-su-teal">
                    {data.approvalStatus || "AICTE Approved"}
                  </span>
                </div>
                <h2 className="mt-1.5 text-lg font-bold text-su-navy">{data.name}</h2>
                <p className="text-xs text-su-muted">{data.address ? `${data.address} · ` : ""}{[data.district, data.state].filter(Boolean).join(", ") || "—"}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${bandTone}`}>Accountability score: {data.score.score ?? "—"}/100 · {band}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard title="Total cases" value={data.totalCases ?? 0} tone="navy" />
              <KpiCard title="Open" value={data.openCases ?? 0} tone="amber" />
              <KpiCard title="Overdue" value={data.overdueCases ?? 0} tone="red" />
              <KpiCard title="Resolved" value={data.resolvedCases ?? 0} tone="teal" />
            </div>
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
              <div className="rounded-lg bg-su-canvas px-3 py-2">Resolution speed: <b>{data.score.breakdown.speed}</b>/100 (40%)</div>
              <div className="rounded-lg bg-su-canvas px-3 py-2">SLA compliance: <b>{data.score.breakdown.sla}</b>/100 (35%)</div>
              <div className="rounded-lg bg-su-canvas px-3 py-2">Feedback: <b>{data.score.breakdown.feedback}</b>/100 (25%)</div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-su-muted">{data.score.note}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-su-muted"><Users className="h-3.5 w-3.5" /> Nodal officers: {officers.length > 0 ? officers.map((n) => n.name).join(", ") : "None registered"}</div>
          </Card>

          <div className="mt-5">
            <SectionTitle hint="Each row is an independent case with its own Case ID">Associated cases</SectionTitle>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-su-border text-left text-xs uppercase tracking-wide text-su-muted">
                    <th className="px-4 py-3">Case ID</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Bureau</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Complainant ID</th><th className="px-4 py-3">Filed</th>
                  </tr></thead>
                  <tbody>
                    {cases.map((c) => (
                      <tr key={c.id} onClick={() => onOpenCase(c.id)} className="cursor-pointer border-b border-su-border/60 last:border-0 hover:bg-su-blue-soft/50">
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-su-blue">
                          <div>{c.caseNumber}</div>
                          {c.overlapFlag && (
                            <span className="mt-0.5 inline-block rounded border border-amber-300 bg-amber-100 px-1 text-[9px] font-bold text-su-amber">
                              OVERLAP
                            </span>
                          )}
                        </td>
                        <td className="max-w-[220px] px-4 py-3"><div className="truncate text-su-text font-medium">{c.subject}</div><div className="text-[11px] text-su-muted">{CATEGORY_LABELS[c.category]}</div></td>
                        <td className="px-4 py-3"><BureauChip bureau={c.bureau} /></td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3 text-xs font-mono text-su-muted">🔒 {c.caseNumber}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-su-muted">{fmtDate(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {cases.length === 0 && <div className="px-4 py-8 text-center text-sm text-su-muted">No cases associated yet.</div>}
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-su-navy"><ShieldCheck className="h-4 w-4 text-su-teal" /> Verified findings vs allegations</div>
            <p className="mt-1.5 text-xs leading-relaxed text-su-muted">Complaints listed above are <b>allegations under review</b>. Nothing becomes a verified finding until an authorized officer records a decision on the specific case. Related cases are never silently merged.</p>
          </Card>
          <Card className="p-4">
            <div className="text-sm font-bold text-su-navy">Notices &amp; reports</div>
            {reports.length === 0 ? <p className="mt-1.5 text-xs text-su-muted">No internal reports sent to this institution.</p> : (
              <div className="mt-2 space-y-2.5">
                {reports.map((r) => (
                  <div key={r.id} className={`rounded-lg border p-2.5 text-xs ${r.status === "ACKNOWLEDGED" ? "border-[#BFE0D2] bg-su-green-soft/40" : "border-[#EBD9A8] bg-su-amber-soft/50"}`}>
                    <div className="font-semibold text-su-text">{r.subject}</div>
                    <div className="mt-0.5 text-su-muted">{r.message.slice(0, 120)}{r.message.length > 120 ? "…" : ""}</div>
                    <div className="mt-1 text-[10px] text-su-muted">{r.officerName} · {fmtDate(r.createdAt)} · {r.status}</div>
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
