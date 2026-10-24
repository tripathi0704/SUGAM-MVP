"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Send, FileText, CheckCircle2, Clock, Info, Phone, User as UserIcon } from "lucide-react";
import { api, fmtDate, slaLeft, CATEGORY_LABELS, STATUS_LABELS } from "@/lib/client";
import { Card, EmptyState, KpiCard, PageHead, PriorityBadge, SectionTitle, SlaChip, StatusBadge, FieldError, Spinner, DemoBanner } from "@/components/sugam/ui-bits";
import type { CaseRow, InstitutionRow, User } from "@/lib/types";

export function StudentHome({ user, onOpenCase, refreshKey }: {
  user: User; onOpenCase: (id: string) => void; refreshKey: number;
}) {
  const [cases, setCases] = useState<CaseRow[] | null>(null);

  useEffect(() => {
    api<{ cases: CaseRow[] }>("/api/v1/cases?pageSize=25").then((r) => setCases(r.success ? r.cases : []));
  }, [refreshKey]);

  const open = (cases ?? []).filter((c) => !["RESOLVED", "CLOSED"].includes(c.status));
  return (
    <div>
      <PageHead title={`Welcome, ${user.name.split(" ")[0]}`} subtitle="File a complaint, track its progress, and add information when requested.">
        <button onClick={() => (window.dispatchEvent(new CustomEvent("sugam:view", { detail: "submit" })))}
          className="flex items-center gap-2 rounded-lg bg-su-blue px-4 py-2 text-sm font-bold text-white hover:bg-[#1E4E69]">
          <Send className="h-4 w-4" /> File a complaint
        </button>
      </PageHead>
      <DemoBanner />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard title="My cases" value={cases?.length ?? "…"} icon={<FileText className="h-4 w-4" />} tone="navy" />
        <KpiCard title="In progress" value={cases ? open.length : "…"} icon={<Clock className="h-4 w-4" />} tone="amber" />
        <KpiCard title="Resolved" value={cases ? cases.filter((c) => ["RESOLVED", "CLOSED"].includes(c.status)).length : "…"} icon={<CheckCircle2 className="h-4 w-4" />} tone="teal" />
        <KpiCard title="Overdue attention" value={cases ? open.filter((c) => c.slaBreached).length : "…"} icon={<Clock className="h-4 w-4" />} tone="red" subtitle="Escalated to reviewing officer" />
      </div>

      <div className="mt-6">
        <SectionTitle hint="Only your cases are visible to you. Internal officer notes stay confidential.">My complaints</SectionTitle>
        {cases === null ? <Spinner /> : cases.length === 0 ? (
          <EmptyState icon={<FileText className="h-10 w-10" />} title="No complaints yet" hint="File your first complaint — automatic routing and a Case ID are generated instantly." />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-su-border text-left text-xs uppercase tracking-wide text-su-muted">
                    <th className="px-4 py-3">Case ID</th><th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Institution</th><th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Deadline</th><th className="px-4 py-3">Filed</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr key={c.id} onClick={() => onOpenCase(c.id)} className="cursor-pointer border-b border-su-border/60 last:border-0 hover:bg-su-blue-soft/50">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-su-blue">{c.caseNumber}</td>
                      <td className="max-w-[280px] px-4 py-3"><div className="truncate font-medium text-su-text">{c.subject}</div><PriorityBadge priority={c.priority} /></td>
                      <td className="px-4 py-3 text-xs text-su-muted">{c.institution?.name}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3"><SlaChip dueAt={c.dueAt} breached={c.slaBreached} /></td>
                      <td className="px-4 py-3 text-xs text-su-muted">{fmtDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Submit complaint with LIVE automation preview (explainable, §1.3) ──
export function SubmitComplaint({ user, onFiled }: { user: User; onFiled: (id: string) => void }) {
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([]);
  const [institutionId, setInstitutionId] = useState("");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    api<{ institutions: InstitutionRow[] }>("/api/v1/institutions?pageSize=50").then((r) => setInstitutions(r.success ? r.institutions : []));
  }, []);

  // Live preview of the demo rule engine (client-side mirror of lib/automation for UX only)
  const preview = useMemo(() => {
    const text = `${subject} ${description}`.toLowerCase();
    const rules: { cat: string; terms: string[] }[] = [
      { cat: "RAGGING", terms: ["ragging", "harassment", "assault", "threat", "bullying", "abuse", "sexual"] },
      { cat: "FEE_REFUND", terms: ["refund", "excess fee", "fee reversal", "security deposit"] },
      { cat: "SCHOLARSHIP", terms: ["scholarship", "stipend", "disbursement"] },
      { cat: "FACULTY_SALARY", terms: ["salary", "payroll", "provident fund"] },
      { cat: "APPROVAL_DOC", terms: ["approval", "bonafide", "certificate", "affiliation"] },
      { cat: "HOSTEL", terms: ["hostel", "mess", "warden", "sanitation", "water"] },
      { cat: "EXAM_CELL", terms: ["exam", "result", "revaluation", "marks", "transcript"] },
      { cat: "INFRASTRUCTURE", terms: ["classroom", "lab", "library", "wifi", "electric"] },
    ];
    let best: { cat: string; hits: string[] } | null = null;
    for (const r of rules) { const hits = r.terms.filter((t) => text.includes(t)); if (hits.length && (!best || hits.length > best.hits.length)) best = { cat: r.cat, hits }; }
    const urgent = ["ragging", "harassment", "assault", "suicide", "threat to life", "sexual", "violence", "emergency", "safety"].filter((t) => text.includes(t));
    return { category: best?.cat ?? "OTHER", reason: best ? `Matched statutory category rules: ${best.hits.slice(0, 3).map((h) => `"${h}"`).join(", ")}` : "No keyword rule matched — will be triaged as Other.", urgent, urgentNote: urgent.length ? `Urgency keywords detected (${urgent.slice(0, 3).join(", ")}). S.U.G.A.M. policy flags CRITICAL priority with accelerated SLA window — an authorized officer reviews every flag.` : null };
  }, [subject, description]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErrors({}); setServerError(null);
    const r = await api<{ case: CaseRow }>("/api/v1/cases", { json: { institutionId, category: category || undefined, subject, description } });
    setBusy(false);
    if (!r.success || !r.case) {
      setServerError(r.error?.message ?? "Could not file the complaint.");
      setErrors(r.error?.fieldErrors ?? {});
      return;
    }
    onFiled(r.case.id);
  };

  const slaDays = preview.urgent.length ? 1 : 15;
  return (
    <div>
      <PageHead title="Submit a complaint" subtitle="Your complaint gets an official Case ID, automatic routing under AICTE Regulations, and a statutory disposal window. Authorized statutory officers decide the outcome." />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card className="p-5">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-su-muted">Institution</label>
              <select value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-su-border bg-white px-3 py-2.5 text-sm outline-none focus:border-su-blue focus:ring-2 focus:ring-su-blue/20">
                <option value="">Select the institution…</option>
                {institutions.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
              </select>
              <FieldError msg={errors.institutionId} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-su-muted">Category (optional — automation suggests one)</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-su-border bg-white px-3 py-2.5 text-sm outline-none focus:border-su-blue focus:ring-2 focus:ring-su-blue/20">
                <option value="">Let S.U.G.A.M. suggest a category</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-su-muted">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} placeholder="One line summary (8-150 characters)"
                className="mt-1 w-full rounded-lg border border-su-border px-3 py-2.5 text-sm outline-none focus:border-su-blue focus:ring-2 focus:ring-su-blue/20" />
              <FieldError msg={errors.subject} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-su-muted">What happened?</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} maxLength={4000}
                placeholder="Describe the issue with dates and amounts where relevant (min 20 characters). Do not include passwords or sensitive identity numbers."
                className="mt-1 w-full rounded-lg border border-su-border px-3 py-2.5 text-sm outline-none focus:border-su-blue focus:ring-2 focus:ring-su-blue/20" />
              <FieldError msg={errors.description} />
            </div>
            <label className="flex items-start gap-2 rounded-lg bg-su-canvas p-3 text-xs leading-relaxed text-su-muted">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              <span>I confirm that the facts submitted are true to the best of my knowledge. Details are securely processed under Digital Personal Data Protection (DPDP) Act 2023. My identity is strictly protected and visible only to authorized statutory officers.</span>
            </label>
            <button type="submit" disabled={busy || !consent}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-su-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1E4E69] disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {busy ? "Filing…" : "File complaint"}
            </button>
            {serverError && <div className="rounded-lg bg-su-red-soft px-3 py-2 text-xs font-medium text-su-red">{serverError}</div>}
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-su-saffron">✦ Statutory Triage Preview</div>
            <p className="mt-1 text-[11px] text-su-muted">Runs as you type — the final decision is always an authorized officer&apos;s.</p>
            <div className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-start gap-2"><span className="mt-0.5">🎯</span><div><div className="font-semibold text-su-navy">Category</div><div className="text-xs text-su-muted">{CATEGORY_LABELS[preview.category]} — {preview.reason}</div></div></div>
              <div className="flex items-start gap-2"><span className="mt-0.5">{preview.urgent.length ? "🚨" : "🕘"}</span><div><div className="font-semibold text-su-navy">Priority &amp; SLA</div><div className="text-xs text-su-muted">{preview.urgentNote ?? "Standard Redressal: NORMAL priority, 15-day statutory window under AICTE Grievance Norms."}</div></div></div>
              <div className="flex items-start gap-2"><span className="mt-0.5">🧾</span><div><div className="font-semibold text-su-navy">On submit</div><div className="text-xs text-su-muted">Case ID generated (SUGAM-2026-####), timeline + audit events recorded, duplicate-candidate scan runs at the same institution.</div></div></div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-su-muted"><Info className="h-3.5 w-3.5" /> After filing</div>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-su-muted">
              <li>Track live status and deadlines in <b>My Complaints</b>.</li>
              <li>Attach evidence (PDF/JPG/PNG, ≤10 MB) from the case page.</li>
              <li>Add requested information anytime — the officer is notified.</li>
              <li>Rate the resolution after it is marked RESOLVED.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Profile editing with strict validation ──
export function ProfileView({ user, onUpdated }: { user: User; onUpdated: (u: User) => void }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErrors({}); setSaved(false);
    const r = await api<{ user: User }>("/api/v1/auth/profile", { method: "PATCH", json: { name, phone } });
    setBusy(false);
    if (!r.success || !r.user) { setErrors(r.error?.fieldErrors ?? { name: r.error?.message ?? "Update failed." }); return; }
    onUpdated(r.user);
    setSaved(true);
  };

  return (
    <div>
      <PageHead title="My profile" subtitle="Edit your details. Inputs are validated on the client and re-validated on the server." />
      <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="p-5">
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-su-muted">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-su-border px-3 py-2.5 text-sm outline-none focus:border-su-blue focus:ring-2 focus:ring-su-blue/20" />
              <FieldError msg={errors.name} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-su-muted">Phone</label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-su-muted" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" className="w-full rounded-lg border border-su-border py-2.5 pl-9 pr-3 text-sm outline-none focus:border-su-blue focus:ring-2 focus:ring-su-blue/20" />
              </div>
              <FieldError msg={errors.phone} />
              <p className="mt-1 text-[11px] text-su-muted">10-13 digits, optional +country code. Used only for case updates.</p>
            </div>
            <div className="rounded-lg bg-su-canvas p-3 text-xs text-su-muted">
              <div className="flex items-center gap-2"><UserIcon className="h-3.5 w-3.5" /> <b>{user.email}</b> · {STATUS_LABELS[user.primaryRole] ?? user.primaryRole}</div>
              {user.rollNo && <div className="mt-1">Roll/Staff ID: {user.rollNo}</div>}
              <div className="mt-1">Official registry record: Contact your AICTE Central Administrator to request changes to registered email or designated role.</div>
            </div>
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-su-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1E4E69] disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save changes
            </button>
            {saved && <div className="rounded-lg bg-su-green-soft px-3 py-2 text-xs font-medium text-su-teal">Profile updated.</div>}
          </form>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-bold text-su-navy">What you can do on S.U.G.A.M.</div>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-su-muted">
            <li>File complaints against any registered institution and receive a Case ID instantly.</li>
            <li>Track status with statutory 30-day deadlines and see the reason behind every routing decision.</li>
            <li>Add evidence and follow-up information; officers are notified in-app.</li>
            <li>See resolutions rated by you feed the institution accountability score (formula publicly disclosed).</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
