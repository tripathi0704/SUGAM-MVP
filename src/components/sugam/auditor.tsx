"use client";
import React, { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Search } from "lucide-react";
import { api, fmtDateTime } from "@/lib/client";
import { Card, DemoBanner, EmptyState, KpiCard, PageHead, SectionTitle, Spinner } from "@/components/sugam/ui-bits";
import type { AuditRow } from "@/lib/types";

interface VerifyData {
  valid: boolean; checked: number; brokenAtSequence: number | null; reason: string | null;
  method: string; disclaimer: string;
}

export function AuditView({ onOpenCase }: { onOpenCase: (id: string) => void }) {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [actions, setActions] = useState<{ action: string; count: number }[]>([]);
  const [verify, setVerify] = useState<VerifyData | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setRows(null);
      const p = new URLSearchParams({ page: String(page), pageSize: "15" });
      if (q) p.set("q", q);
      if (action) p.set("action", action);
      api<{ events: AuditRow[]; total: number; actionCounts: { action: string; count: number }[] }>(`/api/v1/audit/events?${p}`)
        .then((r) => { if (r.success) { setRows(r.events); setTotal(r.total); setActions(r.actionCounts); } else setRows([]); });
    }, 150);
    return () => clearTimeout(t);
  }, [page, q, action]);

  const runVerify = async () => {
    setVerifying(true);
    const r = await api<VerifyData>("/api/v1/audit/verify");
    setVerifying(false);
    if (r.success) setVerify({ valid: r.valid, checked: r.checked, brokenAtSequence: r.brokenAtSequence, reason: r.reason, method: r.method, disclaimer: r.disclaimer });
  };

  return (
    <div>
      <PageHead title="Audit &amp; integrity" subtitle="Read-only view of the append-only audit trail. Every event is hash-linked to its predecessor.">
        <button onClick={runVerify} disabled={verifying}
          className="flex items-center gap-2 rounded-lg bg-su-teal px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
          <ShieldCheck className="h-4 w-4" /> {verifying ? "Verifying chain…" : "Run integrity check"}
        </button>
      </PageHead>
      <DemoBanner />

      {verify && (
        <Card className={`mt-4 border-l-4 p-4 ${verify.valid ? "border-l-[#176B61] bg-su-green-soft/40" : "border-l-[#B42318] bg-su-red-soft/50"}`} data-testid="integrity-result">
          <div className="flex items-start gap-3">
            {verify.valid ? <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-su-teal" /> : <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-su-red" />}
            <div>
              <div className="font-bold text-su-navy">
                Hash-chain integrity check {verify.valid ? "passed" : "FAILED"}
              </div>
              <div className="mt-1 text-xs leading-relaxed text-su-text/80">
                {verify.valid
                  ? `All ${verify.checked} events verified: each eventHash matches the recomputed SHA-256 of its canonical content, and each event references the previous event's hash.`
                  : `Verification failed at sequence ${verify.brokenAtSequence}: ${verify.reason}`}
              </div>
              <div className="mt-1.5 text-[11px] text-su-muted">{verify.method}</div>
              <div className="mt-1 text-[10px] italic text-su-muted">{verify.disclaimer}</div>
            </div>
          </div>
        </Card>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard title="Audit events" value={total} tone="navy" />
        <KpiCard title="Event types" value={actions.length} />
        <KpiCard title="Last event" value={rows?.[0]?.sequence ?? "—"} subtitle={rows?.[0] ? `seq #${rows[0].sequence}` : ""} />
        <KpiCard title="Chain status" value={verify ? (verify.valid ? "VALID" : "BROKEN") : "Not checked"} tone={verify ? (verify.valid ? "teal" : "red") : "default"} />
      </div>

      <Card className="mt-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-su-muted" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search summary, actor email, target…"
              className="w-full rounded-lg border border-su-border py-2 pl-9 pr-3 text-sm outline-none focus:border-su-blue" />
          </div>
          <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="rounded-lg border border-su-border bg-white px-2 py-2 text-xs">
            <option value="">All actions</option>
            {actions.map((a) => <option key={a.action} value={a.action}>{a.action.replace(/_/g, " ")} ({a.count})</option>)}
          </select>
        </div>
      </Card>

      {rows === null ? <Spinner /> : rows.length === 0 ? (
        <EmptyState icon={<Search className="h-8 w-8" />} title="No audit events match" />
      ) : (
        <Card className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-su-border text-left text-xs uppercase tracking-wide text-su-muted">
                <th className="px-4 py-3">#</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3">Actor</th><th className="px-4 py-3">Time</th><th className="px-4 py-3">Hash (first 12)</th>
              </tr></thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="border-b border-su-border/60 last:border-0 align-top hover:bg-su-canvas/60">
                    <td className="px-4 py-3 text-xs font-bold tabular-nums text-su-navy">{e.sequence}</td>
                    <td className="px-4 py-3"><span className="rounded bg-su-blue-soft px-1.5 py-0.5 text-[10px] font-bold text-su-blue">{e.action.replace(/_/g, " ")}</span></td>
                    <td className="max-w-[320px] px-4 py-3 text-xs text-su-text">{e.summary}</td>
                    <td className="px-4 py-3 text-xs text-su-muted">{e.actorEmail ?? "system"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-su-muted">{fmtDateTime(e.createdAt)}</td>
                    <td className="px-4 py-3"><code className="rounded bg-su-canvas px-1.5 py-0.5 font-mono text-[10px] text-su-muted">{e.eventHash.slice(0, 12)}…</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-su-border px-4 py-3 text-xs text-su-muted">
            <span>{total} events · page {page}</span>
            <div className="flex gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-su-border px-3 py-1.5 font-semibold text-su-navy disabled:opacity-40">← Prev</button>
              <button disabled={page * 15 >= total} onClick={() => setPage(page + 1)} className="rounded-lg border border-su-border px-3 py-1.5 font-semibold text-su-navy disabled:opacity-40">Next →</button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
