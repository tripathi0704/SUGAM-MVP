// Pipeline E — due-date monitoring & in-app notifications.
// Evaluated on case save + via the admin-only "Run demo checks" trigger.
// Thresholds come from demo policy config — never statutory deadlines.
import { db } from "@/lib/db";
import { appendAudit } from "@/lib/audit";

export async function getPolicy(): Promise<{ slaDaysByPriority: Record<string, number>; dueSoonDays: number; version: string }> {
  const row = await db.policyConfig.findUnique({ where: { key: "sla_policy" } });
  if (row) return JSON.parse(row.valueJson);
  const fallback = {
    version: "DEMO-POLICY-v1",
    slaDaysByPriority: { CRITICAL: 1, HIGH: 3, NORMAL: 15, LOW: 20 },
    dueSoonDays: 3,
  };
  return fallback;
}

export async function notify(recipientId: string, data: {
  caseId?: string; type: string; title: string; message: string;
}) {
  await db.notification.create({ data: { recipientId, caseId: data.caseId ?? null, type: data.type, title: data.title, message: data.message } });
}

// Evaluate one case's deadline state: creates DUE_SOON / OVERDUE notifications
// (deduped by type+case+recipient per run), flips slaBreached, and escalates
// overdue cases by notifying the reviewing officer with an escalation event.
export async function evaluateCaseDeadlines(caseId: string, opts?: { trigger?: string }): Promise<{ dueSoon: boolean; overdue: boolean; escalated: boolean }> {
  const kase = await db.case.findUnique({
    where: { id: caseId },
    include: { institution: true, complainant: true, assignments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!kase || !kase.dueAt) return { dueSoon: false, overdue: false, escalated: false };
  const policy = await getPolicy();
  const open = !["RESOLVED", "CLOSED"].includes(kase.status);
  const now = Date.now();
  const due = new Date(kase.dueAt).getTime();
  const daysLeft = (due - now) / 86400000;
  const dueSoon = open && daysLeft > 0 && daysLeft <= (policy.dueSoonDays ?? 3);
  const overdue = open && daysLeft <= 0;

  if (!dueSoon && !overdue) return { dueSoon: false, overdue: false, escalated: false };

  const openStatuses = ["RECEIVED", "NEEDS_TRIAGE", "ASSIGNED", "IN_REVIEW", "WAITING_FOR_INFORMATION", "ACTION_REQUIRED", "PENDING_REVIEW", "REOPENED"];
  if (!openStatuses.includes(kase.status)) return { dueSoon, overdue, escalated: false };

  const recipients = new Set<string>();
  if (kase.assignedOfficerId) recipients.add(kase.assignedOfficerId);
  const reviewer = await db.user.findFirst({ where: { primaryRole: "REVIEWING_OFFICER", isActive: true }, select: { id: true } });
  if (reviewer) recipients.add(reviewer.id);
  const nodal = await db.user.findFirst({ where: { institutionId: kase.institutionId, primaryRole: "INSTITUTION_OFFICER", isActive: true }, select: { id: true } });
  if (nodal) recipients.add(nodal.id);

  let escalated = false;
  for (const rid of recipients) {
    const dupe = await db.notification.findFirst({
      where: { recipientId: rid, caseId: kase.id, type: overdue ? "OVERDUE" : "DUE_SOON", createdAt: { gte: new Date(now - 20 * 3600000) } },
    });
    if (dupe) continue;
    await notify(rid, {
      caseId: kase.id,
      type: overdue ? "OVERDUE" : "DUE_SOON",
      title: overdue ? `Case ${kase.caseNumber} is OVERDUE` : `Case ${kase.caseNumber} due soon`,
      message: overdue
        ? `${kase.institution.name} · ${kase.subject} — demo SLA deadline passed. Next action required.`
        : `${kase.institution.name} · ${kase.subject} — demo SLA deadline in ${Math.ceil(daysLeft)} day(s).`,
    });
  }

  if (overdue && !kase.slaBreached) {
    await db.case.update({ where: { id: kase.id }, data: { slaBreached: true } });
    await db.caseEvent.create({
      data: { caseId: kase.id, eventType: "SLA_CHECK", summary: `Demo policy check: SLA deadline passed (${new Date(kase.dueAt).toISOString().slice(0, 10)}). Case marked overdue; escalation notification sent to reviewing officer.`, visibility: "INTERNAL", metadataJson: JSON.stringify({ trigger: opts?.trigger ?? "CASE_SAVE", policyVersion: policy.version }) },
    });
    await appendAudit("SLA_BREACHED", { targetType: "CASE", targetId: kase.id, summary: `Case ${kase.caseNumber} marked overdue by demo SLA policy check`, metadata: { policyVersion: policy.version } });
  }

  if (overdue && !kase.escalated && reviewer) {
    escalated = true;
    await db.case.update({ where: { id: kase.id }, data: { escalated: true } });
    await db.caseEvent.create({
      data: { caseId: kase.id, eventType: "ESCALATED", summary: "Overdue case escalated to Reviewing Officer per demo escalation policy.", visibility: "INTERNAL" },
    });
    await notify(reviewer.id, {
      caseId: kase.id, type: "ESCALATION",
      title: `Escalation: ${kase.caseNumber} overdue`,
      message: `${kase.institution.name} · ${kase.subject} crossed its demo SLA deadline without resolution. Review authorized next actions.`,
    });
  }
  return { dueSoon, overdue, escalated };
}

// Run across all open cases (admin "Run demo checks" trigger)
export async function runDeadlineChecks(trigger = "MANUAL_DEMO"): Promise<{ checked: number; dueSoon: number; overdue: number; escalated: number }> {
  const openStatuses = ["RECEIVED", "NEEDS_TRIAGE", "ASSIGNED", "IN_REVIEW", "WAITING_FOR_INFORMATION", "ACTION_REQUIRED", "PENDING_REVIEW", "REOPENED"];
  const cases = await db.case.findMany({ where: { status: { in: openStatuses }, dueAt: { not: null } }, select: { id: true } });
  let dueSoon = 0, overdue = 0, escalated = 0;
  for (const c of cases) {
    const r = await evaluateCaseDeadlines(c.id, { trigger });
    if (r.dueSoon) dueSoon += 1;
    if (r.overdue) overdue += 1;
    if (r.escalated) escalated += 1;
  }
  await appendAudit("DEMO_CHECKS_RUN", { summary: `Demo deadline checks run across ${cases.length} open cases (trigger: ${trigger})`, metadata: { dueSoon, overdue, escalated } });
  return { checked: cases.length, dueSoon, overdue, escalated };
}
