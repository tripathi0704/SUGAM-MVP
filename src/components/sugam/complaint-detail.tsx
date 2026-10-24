"use client";
import React, { useCallback, useEffect, useState } from "react";
import { X, Loader2, Paperclip, Download, Link2, Star, XCircle, Check, Flag, AlertTriangle } from "lucide-react";
import { api, apiUpload, fmtDate, fmtDateTime, CATEGORY_LABELS, BUREAU_LABELS, STATUS_LABELS, slaLeft } from "@/lib/client";
import { Card, EmptyState, PriorityBadge, SlaChip, SourceBadge, StatusBadge, Timeline, RuleSuggestionCard, FieldError, Spinner, BureauChip } from "@/components/sugam/ui-bits";
import { TRANSITIONS, ROLE_LABELS } from "@/lib/constants";
import type { CaseRow, CaseEvent, CaseResponseRow, EvidenceMeta, ReplyTemplateRow, Suggestion, User } from "@/lib/types";

const TABS = ["Overview", "Timeline", "Evidence", "Responses", "Related", "Audit"] as const;
type Tab = (typeof TABS)[number];

export function ComplaintDetail({ id, user, onClose, onChanged }: {
  id: string; user: User; onClose: () => void; onChanged: () => void;
}) {
  const [kase, setKase] = useState<CaseRow | null>(null);
  const [events, setEvents] = useState<CaseEvent[] | null>(null);
  const [responses, setResponses] = useState<CaseResponseRow[] | null>(null);
  const [evidence, setEvidence] = useState<EvidenceMeta[] | null>(null);
  const [sugs, setSugs] = useState<Suggestion[]>([]);
  const [templates, setTemplates] = useState<ReplyTemplateRow[]>([]);
  const [tab, setTab] = useState<Tab>("Overview");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const roles = [user.primaryRole, ...user.roles];
  const isOfficer = ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER"].some((r) => roles.includes(r));
  const isReviewer = roles.includes("REVIEWING_OFFICER");
  const isCollege = roles.includes("INSTITUTION_OFFICER");
  const isStudent = roles.includes("COMPLAINANT") || kase?.complainantId === user.id;
  const isAdmin = roles.includes("PLATFORM_ADMIN");

  const load = useCallback(async () => {
    const [c, e, d, t] = await Promise.all([
      api<{ case: CaseRow }>(`/api/v1/cases/${id}`),
      api<{ events: CaseEvent[] }>(`/api/v1/cases/${id}/events`),
      api<{ suggestions: Suggestion[] }>(`/api/v1/cases/${id}/duplicates`),
      api<{ templates: ReplyTemplateRow[] }>("/api/v1/admin/templates").catch(() => ({ success: false, templates: [] }) as never),
    ]);
    if (c.success) setKase(c.case);
    if (e.success) setEvents(e.events);
    setSugs(d.success ? d.suggestions : []);
    if (t.success) setTemplates((t as { templates: ReplyTemplateRow[] }).templates);
    const rr = await fetch(`/api/v1/cases/${id}/responses`, { cache: "no-store" }).then((x) => x.json()).catch(() => null);
    if (rr?.success) setResponses(rr.data.responses);
    const ee = await fetch(`/api/v1/cases/${id}/evidence`, { cache: "no-store" }).then((x) => x.json()).catch(() => null);
    if (ee?.success) setEvidence(ee.data.evidence);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!kase) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}><Spinner label="Loading case…" /></div>
    </div>
  );

  const refresh = async () => { await load(); onChanged(); };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-3 sm:p-6" onClick={onClose}>
      <div className="mx-auto max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-su-border bg-su-canvas/50 px-5 py-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-su-blue">{kase.caseNumber}</span>
                <StatusBadge status={kase.status} />
                <PriorityBadge priority={kase.priority} />
                <SourceBadge source={kase.sourceSystem} />
              </div>
              <h2 className="mt-1.5 text-lg font-bold leading-snug text-su-navy">{kase.subject}</h2>
              <p className="mt-0.5 text-xs text-su-muted">
                {kase.institution?.name} ({kase.institution?.code})
                {kase.institution?.permanentId && (
                  <span className="ml-1.5 font-mono font-semibold text-su-blue">· PID: {kase.institution.permanentId}</span>
                )}
                {kase.region && (
                  <span> · {kase.region}</span>
                )}
                {" "}· {CATEGORY_LABELS[kase.category] ?? kase.category} · <BureauChip bureau={kase.bureau} /> · Filed {fmtDate(kase.createdAt)}
              </p>
            </div>
            <button onClick={onClose} className="rounded-lg border border-su-border bg-white p-2 text-su-muted hover:text-su-navy" aria-label="Close case detail"><X className="h-4 w-4" /></button>
          </div>

          {kase.overlapFlag && (
            <div className="mx-5 mt-3 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 text-su-amber mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-su-navy">Potential Overlapping Cases – Coordination Required</div>
                <p className="mt-0.5 text-su-text/80">
                  This case involves an institution with active proceedings across multiple AICTE Bureaus. Coordination status: <span className="font-semibold text-su-amber">{kase.coordinationStatus || "COORDINATION_REQUIRED"}</span>.
                </p>
              </div>
            </div>
          )}

          {notice && <div className="mx-5 mt-3 rounded-lg bg-su-green-soft px-3 py-2 text-xs font-medium text-su-teal">{notice}</div>}
          {actionError && <div className="mx-5 mt-3 rounded-lg bg-su-red-soft px-3 py-2 text-xs font-medium text-su-red">{actionError}</div>}

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-su-border px-4 pt-2">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition ${tab === t ? "border-su-blue text-su-blue" : "border-transparent text-su-muted hover:text-su-navy"}`}>
                {t}{t === "Related" && sugs.filter((s) => s.state === "PENDING").length > 0 && <span className="ml-1 rounded-full bg-su-saffron px-1.5 py-px text-[10px] text-white">{sugs.filter((s) => s.state === "PENDING").length}</span>}
              </button>
            ))}
          </div>

          <div className="grid gap-0 lg:grid-cols-[1fr_300px]">
            {/* Main tab content */}
            <div className="min-h-[420px] p-5">
              {tab === "Overview" && <OverviewTab kase={kase} user={user} />}
              {tab === "Timeline" && (events === null ? <Spinner /> : <Timeline events={events} />)}
              {tab === "Evidence" && <EvidenceTab kase={kase} user={user} evidence={evidence} onReload={refresh} />}
              {tab === "Responses" && <ResponsesTab kase={kase} user={user} responses={responses} templates={templates} onReload={refresh} busy={busy} setBusy={setBusy} setNotice={setNotice} setActionError={setActionError} />}
              {tab === "Related" && <RelatedTab kase={kase} user={user} sugs={sugs} onReload={refresh} setActionError={setActionError} />}
              {tab === "Audit" && <AuditTab kase={kase} user={user} />}
            </div>

            {/* Side action panel */}
            <aside className="border-t border-su-border bg-su-canvas/40 p-5 lg:border-l lg:border-t-0">
              <ActionPanel kase={kase} user={user} isOfficer={isOfficer} isReviewer={isReviewer} isCollege={isCollege} isStudent={isStudent} isAdmin={isAdmin}
                busy={busy} setBusy={setBusy} setNotice={setNotice} setActionError={setActionError} onReload={refresh} />
            </aside>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────── Tabs ───────────────────────────

function OverviewTab({ kase, user }: { kase: CaseRow; user: User }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-su-muted">Complaint</div>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-su-text">{kase.description || "—"}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-su-border p-3 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-su-muted">Status &amp; deadline</div>
          <div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge status={kase.status} /><SlaChip dueAt={kase.dueAt} breached={kase.slaBreached} /></div>
          {kase.escalated && <div className="mt-2 rounded bg-su-red-soft px-2 py-1 text-xs font-semibold text-su-red">Escalated to Zonal Reviewing Officer under AICTE Redressal Norms</div>}
        </div>
        <div className="rounded-lg border border-su-border p-3 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-su-muted">Next action</div>
          <div className="mt-1.5 font-medium text-su-text">{kase.nextActionLabel ?? "—"}</div>
          {kase.nextActionDueAt && <div className="mt-0.5 text-xs text-su-muted">Due {fmtDate(kase.nextActionDueAt)}</div>}
        </div>
        <div className="rounded-lg border border-su-border p-3 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-su-muted">Assignment</div>
          <div className="mt-1.5 font-medium text-su-text">{kase.assignedOfficer?.name ?? "Unassigned"}</div>
          <div className="mt-0.5 text-xs text-su-muted">{kase.bureau ? BUREAU_LABELS[kase.bureau] ?? kase.bureau : "Bureau not set"}</div>
        </div>
        <div className="rounded-lg border border-su-border p-3 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-su-muted">Source</div>
          <div className="mt-1.5 flex items-center gap-2"><SourceBadge source={kase.sourceSystem} /></div>
          {kase.sourceRecordId && <div className="mt-1 font-mono text-[11px] text-su-muted">source ID: {kase.sourceRecordId}</div>}
        </div>
        <div className="rounded-lg border border-su-border p-3 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-su-muted">Complainant Identity</div>
          <div className="mt-1.5 flex items-center gap-1.5 font-mono text-xs font-bold text-su-navy">
            <span className="text-su-amber">🔒</span> Complaint ID: {kase.caseNumber}
          </div>
          <div className="mt-0.5 text-[11px] text-su-muted italic">Whistleblower protection active (Identity hidden from officers)</div>
        </div>
      </div>
      {kase.ruleExplanation && <RuleSuggestionCard title="Why this routing fired" reason={kase.ruleExplanation} />}
      {kase.rating != null && (
        <div className="rounded-lg border border-su-border bg-su-green-soft/40 p-3 text-sm">
          <span className="font-semibold text-su-teal">Complainant feedback:</span> {"★".repeat(kase.rating)}{"☆".repeat(5 - kase.rating)} ({kase.rating}/5)
        </div>
      )}
    </div>
  );
}

function EvidenceTab({ kase, user, evidence, onReload }: {
  kase: CaseRow; user: User; evidence: EvidenceMeta[] | null; onReload: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [access, setAccess] = useState("CASE_PARTIES");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const roles = [user.primaryRole, ...user.roles];
  const canUpload = roles.includes("COMPLAINANT") || roles.includes("INSTITUTION_OFFICER") || ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER"].some((r) => roles.includes(r));

  const upload = async () => {
    if (!file) return;
    setBusy(true); setErr(null);
    const form = new FormData();
    form.append("file", file);
    form.append("accessLevel", access);
    const r = await apiUpload(`/api/v1/cases/${kase.id}/evidence`, form);
    setBusy(false);
    if (!r.success) { setErr(r.error?.message ?? "Upload failed."); return; }
    setFile(null);
    onReload();
  };

  return (
    <div className="space-y-4">
      {canUpload && (
        <div className="rounded-lg border border-dashed border-su-border bg-su-canvas/50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-su-text file:mr-3 file:rounded-lg file:border-0 file:bg-su-blue file:px-3 file:py-2 file:text-xs file:font-bold file:text-white" />
            <select value={access} onChange={(e) => setAccess(e.target.value)} className="rounded-lg border border-su-border px-2 py-1.5 text-xs">
              <option value="CASE_PARTIES">Visible to case parties</option>
              <option value="OFFICERS_ONLY">Officers only</option>
            </select>
            <button onClick={upload} disabled={!file || busy} className="flex items-center gap-1.5 rounded-lg bg-su-blue px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />} Upload
            </button>
          </div>
          <p className="mt-2 text-[11px] text-su-muted">PDF, PNG, JPEG, WEBP or TXT · max 10 MB. Files are stored privately (never in public web folders); content stays UNVERIFIED until a human verifies it.</p>
          {err && <FieldError msg={err} />}
        </div>
      )}
      {evidence === null ? <Spinner /> : evidence.length === 0 ? (
        <EmptyState icon={<Paperclip className="h-8 w-8" />} title="No evidence attached yet" hint="Supported documents appear here with their verification state." />
      ) : (
        <div className="space-y-2">
          {evidence.map((ev) => (
            <div key={ev.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-su-border p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-su-text">{ev.originalFileName}</div>
                <div className="text-[11px] text-su-muted">{fmtDateTime(ev.createdAt)} · {ev.uploaderName ?? "Unknown"} ({ROLE_LABELS[ev.uploaderRole ?? ""] ?? ev.uploaderRole}) · {Math.max(1, Math.round(ev.sizeBytes / 1024))} KB · {ev.accessLevel === "OFFICERS_ONLY" ? "Officers only" : "Case parties"}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ev.verificationState === "VERIFIED" ? "bg-su-green-soft text-su-teal" : "bg-su-amber-soft text-su-amber"}`}>{ev.verificationState}</span>
                <a href={`/api/v1/evidence/${ev.id}`} className="flex items-center gap-1 rounded-lg border border-su-border px-2.5 py-1.5 text-xs font-semibold text-su-blue hover:bg-su-blue-soft"><Download className="h-3.5 w-3.5" /> Download</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResponsesTab({ kase, user, responses, templates, onReload, busy, setBusy, setNotice, setActionError }: {
  kase: CaseRow; user: User; responses: CaseResponseRow[] | null; templates: ReplyTemplateRow[];
  onReload: () => void; busy: string | null; setBusy: (s: string | null) => void; setNotice: (s: string | null) => void; setActionError: (s: string | null) => void;
}) {
  const [message, setMessage] = useState("");
  const roles = [user.primaryRole, ...user.roles];
  const isCollege = roles.includes("INSTITUTION_OFFICER");
  const isStudent = kase.complainantId === user.id;
  const matching = templates.filter((t) => !t.category || t.category === kase.category);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("respond");
    setActionError(null); setNotice(null);
    const r = await api(`/api/v1/cases/${kase.id}/responses`, { json: { message } });
    setBusy(null);
    if (!r.success) { setActionError(r.error?.message ?? "Could not submit."); return; }
    setMessage("");
    setNotice(isCollege ? "Response submitted. The case is NOT auto-resolved — an officer decides the next step." : "Submitted to the case timeline.");
    onReload();
  };

  return (
    <div className="space-y-4">
      {(isCollege || isStudent) && (
        <form onSubmit={send} className="rounded-lg border border-su-border p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-su-navy">{isCollege ? "Submit institution response" : "Add information"}</div>
          {isCollege && matching.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {matching.map((t) => (
                <button key={t.id} type="button" onClick={() => setMessage(t.body)}
                  className="rounded-full border border-[#EAD3A2] bg-su-saffron-soft px-2.5 py-1 text-[11px] font-semibold text-su-saffron hover:bg-[#F5E3C3]">
                  ⚡ Use format: {t.title}
                </button>
              ))}
            </div>
          )}
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={4000}
            placeholder={isCollege ? "Describe the action taken and attach supporting evidence in the Evidence tab…" : "Add the requested information or clarifications…"}
            className="mt-2 w-full rounded-lg border border-su-border px-3 py-2.5 text-sm outline-none focus:border-su-blue focus:ring-2 focus:ring-su-blue/20" />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-su-muted">{message.length}/4000 characters</span>
            <button disabled={(message.trim().length < 10) || busy === "respond"} className="flex items-center gap-1.5 rounded-lg bg-su-blue px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              {busy === "respond" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Submit
            </button>
          </div>
        </form>
      )}
      {responses === null ? <Spinner /> : responses.length === 0 ? (
        <EmptyState icon={<span className="text-2xl">📨</span>} title="No responses yet" />
      ) : (
        <div className="space-y-3">
          {responses.map((r) => (
            <div key={r.id} className={`rounded-lg border p-3.5 ${r.authorRole === "INSTITUTION_OFFICER" ? "border-[#BFE0D2] bg-su-green-soft/40" : r.authorRole === "COMPLAINANT" ? "border-su-border bg-white" : "border-[#C7DAE6] bg-su-blue-soft/40"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-su-navy">{r.authorRole === "INSTITUTION_OFFICER" ? "Institution response" : r.authorRole === "COMPLAINANT" ? `Complainant · 🔒 Complaint ID: ${kase.caseNumber}` : `Officer note${r.authorName ? ` · ${r.authorName}` : ""}`}</span>
                <span className="text-su-muted">{fmtDateTime(r.createdAt)}</span>
              </div>
              {r.templateUsed && <div className="mt-1 inline-block rounded bg-su-saffron-soft px-1.5 py-0.5 text-[10px] font-bold text-su-saffron">Format: {r.templateUsed}</div>}
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-su-text">{r.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RelatedTab({ kase, user, sugs, onReload, setActionError }: {
  kase: CaseRow; user: User; sugs: Suggestion[]; onReload: () => void; setActionError: (s: string | null) => void;
}) {
  const [reason, setReason] = useState("");
  const roles = [user.primaryRole, ...user.roles];
  const canReview = ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER"].some((r) => roles.includes(r));

  const review = async (sid: string, decision: "CONFIRMED" | "REJECTED") => {
    setActionError(null);
    const r = await api(`/api/v1/duplicate-suggestions/${sid}`, { json: { decision, reason } });
    if (!r.success) { setActionError(r.error?.message ?? "Review failed."); return; }
    setReason("");
    onReload();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-su-border bg-su-canvas/50 p-3 text-xs leading-relaxed text-su-muted">
        <b className="text-su-navy">How duplicate handling works:</b> the engine only <i>suggests</i> possible duplicates (same institution + token similarity). An officer must confirm — nothing is auto-merged, and both cases always keep their own Case IDs and timelines.
      </div>
      {kase.relatedCaseIds.length > 0 && (
        <div className="rounded-lg border border-[#BFE0D2] bg-su-green-soft/40 p-3 text-sm">
          <span className="flex items-center gap-1.5 font-semibold text-su-teal"><Link2 className="h-4 w-4" /> Confirmed related cases</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">{kase.relatedCaseIds.map((rid) => <span key={rid} className="rounded bg-white px-2 py-1 font-mono text-xs text-su-blue">{rid}</span>)}</div>
        </div>
      )}
      {sugs.length === 0 ? (
        <EmptyState icon={<Link2 className="h-8 w-8" />} title="No duplicate candidates" hint="The similarity scan found no candidate pairs for this case." />
      ) : (
        sugs.map((s) => (
          <div key={s.id} className="rounded-lg border border-su-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-bold text-su-navy">{s.primaryCaseNumber} ↔ {s.candidateCaseNumber}</div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-su-blue-soft px-2 py-0.5 text-xs font-bold text-su-blue">similarity {s.score.toFixed(2)}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.state === "PENDING" ? "bg-su-amber-soft text-su-amber" : s.state === "CONFIRMED" ? "bg-su-green-soft text-su-teal" : "bg-slate-100 text-slate-500"}`}>{s.state}</span>
              </div>
            </div>
            <div className="mt-1 text-xs text-su-muted">{s.candidateSubject}</div>
            <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-su-muted">
              {s.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
            {s.state === "PENDING" && canReview && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Review reason (recorded for audit)…"
                  className="min-w-[200px] flex-1 rounded-lg border border-su-border px-3 py-2 text-xs outline-none focus:border-su-blue" />
                <button onClick={() => review(s.id, "CONFIRMED")} disabled={reason.trim().length < 5} className="flex items-center gap-1 rounded-lg bg-su-teal px-3 py-2 text-xs font-bold text-white disabled:opacity-40"><Check className="h-3.5 w-3.5" /> Confirm link</button>
                <button onClick={() => review(s.id, "REJECTED")} disabled={reason.trim().length < 5} className="flex items-center gap-1 rounded-lg border border-su-red/40 bg-white px-3 py-2 text-xs font-bold text-su-red disabled:opacity-40"><XCircle className="h-3.5 w-3.5" /> Reject</button>
              </div>
            )}
            {s.state !== "PENDING" && <div className="mt-2 text-xs text-su-muted">Reviewed by {s.reviewedByName ?? "—"} · {s.reviewReason}</div>}
          </div>
        ))
      )}
    </div>
  );
}

function AuditTab({ kase, user }: { kase: CaseRow; user: User }) {
  const roles = [user.primaryRole, ...user.roles];
  if (!["AUDITOR", "REVIEWING_OFFICER", "PLATFORM_ADMIN"].some((r) => roles.includes(r))) {
    return <EmptyState icon={<span className="text-2xl">🔒</span>} title="Audit view is permission-gated" hint="Available to Auditor, Reviewing Officer and Platform Admin roles." />;
  }
  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs leading-relaxed text-su-muted">Every significant action on this case also wrote an append-only audit event with a SHA-256 hash link. Open <b>Audit &amp; Integrity</b> in the sidebar to verify the chain. Case ID for lookups: <code className="rounded bg-su-canvas px-1 font-mono">{kase.id}</code></p>
      <div className="rounded-lg border border-su-border p-3 text-xs text-su-muted">
        Recorded actions on this case include: complaint filed, assignment, status transitions, responses, evidence, rating, deadline checks — each attributed to an actor with a timestamp.
      </div>
    </div>
  );
}

// ─────────────────────────── Side action panel ───────────────────────────

function ActionPanel({ kase, user, isOfficer, isReviewer, isCollege, isStudent, isAdmin, busy, setBusy, setNotice, setActionError, onReload }: {
  kase: CaseRow; user: User; isOfficer: boolean; isReviewer: boolean; isCollege: boolean; isStudent: boolean; isAdmin: boolean;
  busy: string | null; setBusy: (s: string | null) => void; setNotice: (s: string | null) => void; setActionError: (s: string | null) => void; onReload: () => void;
}) {
  const [note, setNote] = useState("");
  const [transition, setTransition] = useState("");
  const [reason, setReason] = useState("");
  const [nextAction, setNextAction] = useState(kase.nextActionLabel ?? "");
  const [showAssign, setShowAssign] = useState(false);

  const roles = [user.primaryRole, ...user.roles];
  const rule = TRANSITIONS[kase.status];
  const allowed = (rule?.to ?? []).filter((to) => rule?.roles.some((r) => roles.includes(r)) || (isStudent && kase.status === "RESOLVED" && to === "REOPENED"));
  const needsReason = (to: string) => TRANSITIONS[kase.status]?.requireReason && !(isStudent && to === "REOPENED");

  const doStatus = async () => {
    if (!transition) return;
    setBusy("status"); setActionError(null); setNotice(null);
    const r = await api<{ case: CaseRow }>(`/api/v1/cases/${kase.id}`, { method: "PATCH", json: { status: transition, reason } });
    setBusy(null);
    if (!r.success) { setActionError(r.error?.message ?? "Transition rejected by the server."); return; }
    setNotice(`Status updated to ${STATUS_LABELS[transition] ?? transition}. Timeline and audit updated.`);
    setTransition(""); setReason("");
    onReload();
  };

  const doNote = async () => {
    setBusy("note"); setActionError(null); setNotice(null);
    const r = await api(`/api/v1/cases/${kase.id}/events`, { json: { summary: note, visibility: isOfficer ? "INTERNAL" : "PUBLIC" } });
    setBusy(null);
    if (!r.success) { setActionError(r.error?.message ?? "Could not add note."); return; }
    setNote("");
    setNotice("Note added to the case timeline.");
    onReload();
  };

  const doNextAction = async () => {
    setBusy("next"); setActionError(null); setNotice(null);
    const r = await api<{ case: CaseRow }>(`/api/v1/cases/${kase.id}`, { method: "PATCH", json: { nextActionLabel: nextAction } });
    setBusy(null);
    if (!r.success) { setActionError(r.error?.message ?? "Could not set next action."); return; }
    setNotice("Next action recorded.");
    onReload();
  };

  const rate = async (stars: number) => {
    setBusy("rate"); setActionError(null);
    const r = await api(`/api/v1/cases/${kase.id}/rate`, { json: { rating: stars } });
    setBusy(null);
    if (!r.success) { setActionError(r.error?.message ?? "Rating failed."); return; }
    setNotice("Thank you. Your feedback has been recorded in the AICTE Institutional Performance Index.");
    onReload();
  };

  return (
    <div className="space-y-4 text-sm">
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-su-muted">Owner</div>
        <div className="mt-1 font-semibold text-su-navy">{kase.assignedOfficer?.name ?? "Unassigned"}</div>
        <div className="text-xs text-su-muted">{kase.bureau ? BUREAU_LABELS[kase.bureau] : "No bureau yet"}</div>
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-su-muted">Deadline</div>
        <div className="mt-1"><SlaChip dueAt={kase.dueAt} breached={kase.slaBreached} /></div>
        <div className="mt-0.5 text-[11px] text-su-muted">Statutory Redressal Window (AICTE Grievance Norms 2026).</div>
      </div>

      {(isOfficer || isAdmin) && (
        <div className="rounded-lg border border-su-border bg-white p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wide text-su-navy">Officer actions</div>
            {(isOfficer || isAdmin) && <button onClick={() => setShowAssign(!showAssign)} className="rounded bg-su-blue-soft px-2 py-1 text-[11px] font-bold text-su-blue">Assign / reassign</button>}
          </div>
          {showAssign && <AssignDialog kase={kase} onDone={() => { setShowAssign(false); onReload(); }} setActionError={setActionError} />}

          {allowed.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-su-muted">Status transition (server-validated)</div>
              <select value={transition} onChange={(e) => setTransition(e.target.value)} className="w-full rounded-lg border border-su-border px-2.5 py-2 text-xs">
                <option value="">Choose next status…</option>
                {allowed.map((to) => <option key={to} value={to}>{STATUS_LABELS[to] ?? to}</option>)}
              </select>
              {(transition && (needsReason(transition) || TRANSITIONS[kase.status]?.requireReason)) && (
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required, recorded on timeline)"
                  className="w-full rounded-lg border border-su-border px-2.5 py-2 text-xs" />
              )}
              <button onClick={doStatus} disabled={!transition || busy === "status"} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-su-blue px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                {busy === "status" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flag className="h-3.5 w-3.5" />} Apply transition
              </button>
              <p className="text-[10px] leading-relaxed text-su-muted">Allowed from {STATUS_LABELS[kase.status]}: {rule?.to.map((t) => STATUS_LABELS[t]).join(", ") || "none"}. Invalid jumps are rejected by the API.</p>
            </div>
          )}

          <div className="mt-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-su-muted">Next action</div>
            <input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="e.g. Verify bank statement"
              className="mt-1 w-full rounded-lg border border-su-border px-2.5 py-2 text-xs" />
            <button onClick={doNextAction} disabled={busy === "next"} className="mt-1.5 w-full rounded-lg border border-su-blue/40 bg-white px-3 py-2 text-xs font-bold text-su-blue disabled:opacity-50">Save next action</button>
          </div>
        </div>
      )}

      {(isCollege || isStudent || isOfficer || isAdmin) && (
        <div className="rounded-lg border border-su-border bg-white p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-su-navy">{isStudent ? "Add information" : isCollege ? "Respond via Responses tab" : "Internal note"}</div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={800} placeholder={isOfficer ? "Internal note (visible to officers only)…" : "Message to the case record…"}
            className="mt-1 w-full rounded-lg border border-su-border px-2.5 py-2 text-xs" />
          <button onClick={doNote} disabled={note.trim().length < 4 || busy === "note"} className="mt-1.5 w-full rounded-lg border border-su-blue/40 bg-white px-3 py-2 text-xs font-bold text-su-blue disabled:opacity-50">
            {busy === "note" ? "Adding…" : "Add to timeline"}
          </button>
        </div>
      )}

      {isStudent && kase.status === "RESOLVED" && kase.rating == null && (
        <div className="rounded-lg border border-su-border bg-white p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-su-navy">Rate this resolution</div>
          <div className="mt-1.5 flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => rate(s)} disabled={busy === "rate"} className="text-xl text-su-saffron transition hover:scale-110 disabled:opacity-40" aria-label={`${s} stars`}>
                <Star className="h-6 w-6 fill-current" />
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-su-muted">Updates the AICTE National Institutional Accountability Index.</p>
        </div>
      )}

      {isStudent && kase.status === "RESOLVED" && allowed.includes("REOPENED") && (
        <div className="rounded-lg border border-[#F0C5C0] bg-su-red-soft/50 p-3 text-xs text-su-text">
          Not satisfied? You may <b>reopen</b> this case — the previous closure stays in history.
        </div>
      )}
    </div>
  );
}

function AssignDialog({ kase, onDone, setActionError }: { kase: CaseRow; onDone: () => void; setActionError: (s: string | null) => void }) {
  const [officers, setOfficers] = useState<{ id: string; name: string; bureau: string | null }[]>([]);
  const [officerId, setOfficerId] = useState("");
  const [bureau, setBureau] = useState(kase.bureau ?? "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ officers: { id: string; name: string; primaryRole: string; bureau: string | null }[] }>("/api/v1/officers")
      .then((r) => setOfficers(r.success ? r.officers.filter((u) => ["BUREAU_OFFICER", "REVIEWING_OFFICER", "INTAKE_OFFICER"].includes(u.primaryRole)).map((u) => ({ id: u.id, name: `${u.name} (${u.bureau ? BUREAU_LABELS[u.bureau] ?? u.bureau : "Staff"})`, bureau: u.bureau })) : []));
  }, []);

  const assign = async () => {
    setBusy(true); setActionError(null);
    const r = await api(`/api/v1/cases/${kase.id}/assign`, { json: { toOfficerId: officerId || undefined, toBureau: (!officerId && bureau) || undefined, reason } });
    setBusy(false);
    if (!r.success) { setActionError(r.error?.message ?? "Assignment failed."); return; }
    onDone();
  };

  return (
    <div className="mt-3 space-y-2 rounded-lg bg-su-canvas p-3">
      <select value={officerId} onChange={(e) => setOfficerId(e.target.value)} className="w-full rounded-lg border border-su-border px-2.5 py-2 text-xs">
        <option value="">Assign to officer…</option>
        {officers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
      {!officerId && (
        <select value={bureau} onChange={(e) => setBureau(e.target.value)} className="w-full rounded-lg border border-su-border px-2.5 py-2 text-xs">
          <option value="">Route to bureau…</option>
          {Object.entries(BUREAU_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      )}
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Assignment reason (required)" className="w-full rounded-lg border border-su-border px-2.5 py-2 text-xs" />
      <button onClick={assign} disabled={busy || (!officerId && !bureau) || reason.trim().length < 4} className="w-full rounded-lg bg-su-blue px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
        {busy ? "Assigning…" : "Confirm assignment"}
      </button>
    </div>
  );
}
