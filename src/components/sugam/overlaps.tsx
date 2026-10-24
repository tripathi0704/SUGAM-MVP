"use client";
import React, { useEffect, useState } from "react";
import {
  AlertTriangle, Building2, CheckCircle2, FileText, ArrowRight,
  GitMerge, RefreshCw, ShieldAlert, Sparkles, User, ExternalLink,
  MessageSquare, Clock, MapPin, Send,
} from "lucide-react";
import { api, fmtDate, STATUS_LABELS, BUREAU_LABELS, CATEGORY_LABELS } from "@/lib/client";
import { Card, PageHead, Spinner, EmptyState, StatusBadge, PriorityBadge } from "@/components/sugam/ui-bits";
import type { OverlapGroup, User as UserType } from "@/lib/types";

export function OverlapMonitor({
  user,
  onOpenCase,
  onOpen360,
  refreshKey,
}: {
  user: UserType;
  onOpenCase: (id: string) => void;
  onOpen360: (id: string) => void;
  refreshKey: number;
}) {
  const [overlaps, setOverlaps] = useState<OverlapGroup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCoordination, setActiveCoordination] = useState<OverlapGroup | null>(null);
  const [coordinationNotes, setCoordinationNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadOverlaps = () => {
    setLoading(true);
    api<{ overlaps: OverlapGroup[]; totalOverlaps: number }>("/api/v1/cases/overlaps")
      .then((res) => {
        setOverlaps(res.success ? res.overlaps : []);
        setLoading(false);
      })
      .catch(() => {
        setOverlaps([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadOverlaps();
  }, [refreshKey]);

  const handleCoordinate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCoordination) return;
    setSubmitting(true);
    const caseIds = activeCoordination.cases.map((c) => c.id);
    const res = await api("/api/v1/cases/overlaps", {
      json: {
        caseIds,
        notes: coordinationNotes || "Cross-bureau coordination established. Joint communication to institution approved.",
      },
    });
    setSubmitting(false);
    if (res.success) {
      setSuccessMsg(`Inter-bureau coordination initiated for ${activeCoordination.institutionName}. Status updated to COORDINATION_REQUIRED.`);
      setActiveCoordination(null);
      setCoordinationNotes("");
      loadOverlaps();
    }
  };

  return (
    <div className="space-y-6">
      <PageHead
        title="Cross-Bureau Overlap & Coordination Monitor"
        subtitle="Central AICTE Registry · Automated detection of parallel complaint cases across AICTE Bureaus (Regulation Bureau vs PGRC vs others)"
      >
        <button
          onClick={loadOverlaps}
          className="flex items-center gap-1.5 rounded-lg border border-su-blue/40 bg-white px-3 py-2 text-xs font-bold text-su-blue hover:bg-su-blue-soft"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Re-scan Overlaps
        </button>
      </PageHead>

      {/* PS 26264 Core Concept Callout */}
      <div className="relative overflow-hidden rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/50 p-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-su-amber text-white shadow-sm">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-su-amber px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
                Statutory Regulatory Priority
              </span>
              <span className="text-xs font-semibold text-su-amber">AICTE Regulation Bureau Priority</span>
            </div>
            <h3 className="mt-1 text-sm font-bold text-su-navy">
              Single-Window Coordination for Multi-Bureau Cases
            </h3>
            <p className="mt-0.5 text-xs text-su-text/80 leading-relaxed">
              When an institution receives multiple grievances simultaneously (e.g. <b>Regulation Bureau</b> initiates compliance action while <b>PGRC</b> processes a student petition), S.U.G.A.M. automatically detects the common institution and triggers:
              <span className="ml-1 inline-block rounded border border-red-300 bg-red-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-su-red">
                &ldquo;Potential Overlapping Cases – Coordination Required&rdquo;
              </span>.
              This prevents duplicate show-cause notices and ensures joint regulatory action.
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <Spinner label="Scanning database for cross-bureau case collisions…" />
      ) : !overlaps || overlaps.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-10 w-10 text-emerald-600" />}
          title="No Cross-Bureau Overlaps Detected"
          hint="All active cases are currently contained within individual designated bureaus. New filings are automatically monitored in real-time."
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between text-xs font-bold text-su-navy">
            <span>{overlaps.length} Institution{overlaps.length > 1 ? "s" : ""} with Active Multi-Bureau Grievance Overlaps</span>
            <span className="text-su-muted">Showing live database matches</span>
          </div>

          {overlaps.map((group) => {
            const isCoordRequired = group.cases.some((c) => c.status === "COORDINATION_REQUIRED") || group.coordinationStatus === "COORDINATION_REQUIRED";

            return (
              <Card key={group.institutionId} className="overflow-hidden border-2 border-amber-300 shadow-md">
                {/* Overlap Header Banner */}
                <div className="bg-gradient-to-r from-red-600 to-amber-600 px-5 py-3 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold animate-pulse">
                        ⚠️
                      </span>
                      <span className="text-sm font-extrabold uppercase tracking-wide">
                        Potential Overlapping Cases – Coordination Required
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-black/25 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm">
                        {group.bureaus.map((b) => BUREAU_LABELS[b] ?? b).join(" ⚡ ")}
                      </span>
                      <button
                        onClick={() => onOpen360(group.institutionId)}
                        className="flex items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-bold text-su-navy shadow hover:bg-slate-100"
                      >
                        <Building2 className="h-3.5 w-3.5 text-su-blue" />
                        Institution 360°
                      </button>
                    </div>
                  </div>
                </div>

                {/* Institution Profile Summary Strip */}
                <div className="border-b border-su-border/70 bg-su-canvas/60 px-5 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-su-blue">
                          AICTE Permanent ID: {group.permanentId ?? "1-938210491"}
                        </span>
                        <span className="text-xs text-su-muted">·</span>
                        <span className="font-mono text-xs text-su-muted">Registry Code: {group.institutionCode}</span>
                      </div>
                      <h4 className="mt-0.5 text-base font-bold text-su-navy">{group.institutionName}</h4>
                      <p className="flex items-center gap-1.5 text-xs text-su-muted">
                        <MapPin className="h-3 w-3" />
                        Region: <span className="font-semibold text-su-text">{group.region ?? "Western"}</span>
                        {group.state && <span>· State: {group.state}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveCoordination(group)}
                        className="flex items-center gap-1.5 rounded-lg bg-su-blue px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-su-navy"
                      >
                        <GitMerge className="h-3.5 w-3.5 text-su-saffron" />
                        Initiate Joint Coordination
                      </button>
                    </div>
                  </div>
                </div>

                {/* Side-by-side Overlapping Cases Display */}
                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-su-muted">
                    <span>Conflicting / Parallel Active Cases ({group.cases.length})</span>
                    <span className="text-[11px] font-normal normal-case text-su-muted">
                      Both cases investigate this institution under distinct Bureau jurisdictions
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {group.cases.map((c, idx) => {
                      const isRB = c.bureau === "REGULATION_BUREAU";
                      const isPGRC = c.bureau === "PGRC";

                      return (
                        <div
                          key={c.id}
                          className={`flex flex-col justify-between rounded-xl border p-4 transition-all hover:shadow-md ${
                            isRB
                              ? "border-red-300 bg-red-50/40"
                              : isPGRC
                              ? "border-blue-300 bg-blue-50/40"
                              : "border-su-border bg-white"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                  isRB
                                    ? "bg-red-700 text-white"
                                    : isPGRC
                                    ? "bg-blue-700 text-white"
                                    : "bg-su-navy text-white"
                                }`}
                              >
                                {c.bureau ? (BUREAU_LABELS[c.bureau] ?? c.bureau) : "Unassigned Bureau"}
                              </span>
                              <span className="font-mono text-xs font-bold text-su-blue">{c.caseNumber}</span>
                            </div>

                            <h5 className="mt-2 text-sm font-bold text-su-navy line-clamp-2">{c.subject}</h5>

                            <div className="mt-3 space-y-1.5 text-xs text-su-muted">
                              <div className="flex items-center justify-between">
                                <span>Status:</span>
                                <StatusBadge status={c.status} />
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Assigned Official:</span>
                                <span className="font-medium text-su-text">{c.assignedOfficer?.name ?? "Bureau Registry"}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Date Received:</span>
                                <span>{fmtDate(c.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                            <span className="text-[11px] text-su-muted">
                              Priority: <b className="text-su-navy">{c.priority}</b>
                            </span>
                            <button
                              onClick={() => onOpenCase(c.id)}
                              className="flex items-center gap-1 text-xs font-bold text-su-blue hover:underline"
                            >
                              Open Case <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Coordination Status Indicator */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-su-canvas p-3 text-xs">
                    <div className="flex items-center gap-2 text-su-text">
                      <Sparkles className="h-4 w-4 text-su-saffron" />
                      <span>
                        <b>System Recommendation:</b> Issue a single consolidated inquiry notice from Regulation Bureau to ensure college compliance without duplicate bureaucratic burden.
                      </span>
                    </div>
                    {isCoordRequired ? (
                      <span className="rounded-full bg-su-amber-soft px-3 py-1 font-bold text-su-amber border border-amber-300">
                        ⚡ Coordination Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-3 py-1 font-bold text-su-red border border-red-200">
                        Pending Coordination
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Inter-Bureau Coordination Action Modal */}
      {activeCoordination && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-su-navy">
              <GitMerge className="h-5 w-5 text-su-saffron" />
              <h3 className="text-base font-bold">Initiate Inter-Bureau Coordination</h3>
            </div>
            <p className="mt-1 text-xs text-su-muted">
              Connect Regulation Bureau (RB) and PGRC officers investigating <b>{activeCoordination.institutionName}</b> (AICTE Permanent ID: {activeCoordination.permanentId ?? "1-938210491"}).
            </p>

            <form onSubmit={handleCoordinate} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-su-navy">Joint Coordination Strategy &amp; Notes</label>
                <textarea
                  value={coordinationNotes}
                  onChange={(e) => setCoordinationNotes(e.target.value)}
                  rows={4}
                  placeholder="Specify common directives, joint show-cause provisions, or assign primary lead bureau (e.g. Regulation Bureau to lead regulatory proceedings while PGRC monitors student compensation)..."
                  className="mt-1 w-full rounded-lg border border-su-border p-3 text-xs outline-none focus:border-su-blue focus:ring-1 focus:ring-su-blue"
                  required
                />
              </div>

              <div className="rounded-lg bg-amber-50 p-3 text-[11px] text-amber-900 leading-relaxed border border-amber-200">
                <b>Action Outcome:</b> All {activeCoordination.cases.length} cases will be transitioned to <b>COORDINATION_REQUIRED</b>. Timeline events and audit hashes will be logged for both bureaus, and assigned officials will receive instant notifications.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveCoordination(null)}
                  className="rounded-lg border border-su-border px-4 py-2 text-xs font-semibold text-su-navy hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-lg bg-su-blue px-4 py-2 text-xs font-bold text-white hover:bg-su-navy disabled:opacity-50"
                >
                  {submitting ? "Initiating..." : "Confirm Joint Coordination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
