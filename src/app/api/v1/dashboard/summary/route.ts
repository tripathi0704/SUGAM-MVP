import { db } from "@/lib/db";
import { ok, requireSession, isNextResponse } from "@/lib/apih";
import { caseScopeFilter } from "@/lib/cases";
import { OPEN_STATUSES } from "@/lib/constants";
import { ensureSeed } from "@/lib/seed";

const DUE_SOON_MS = 3 * 86400000;

export async function GET() {
  await ensureSeed();
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const scope = caseScopeFilter(user);
  const roles = [user.primaryRole, ...(JSON.parse(user.rolesJson) as string[])];

  const cases = await db.case.findMany({
    where: scope,
    include: { institution: { select: { id: true, code: true, name: true, permanentId: true, region: true, state: true } }, assignedOfficer: { select: { id: true, name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const now = Date.now();
  const open = cases.filter((c) => OPEN_STATUSES.includes(c.status));
  const dueSoon = open.filter((c) => c.dueAt && new Date(c.dueAt).getTime() - now > 0 && new Date(c.dueAt).getTime() - now <= DUE_SOON_MS);
  const overdue = open.filter((c) => c.dueAt && new Date(c.dueAt).getTime() <= now);

  const byStatus = Object.entries(
    cases.reduce<Record<string, number>>((acc, c) => { acc[c.status] = (acc[c.status] ?? 0) + 1; return acc; }, {}),
  ).map(([status, count]) => ({ status, count }));

  const byBureau = Object.entries(
    cases.filter((c) => c.bureau).reduce<Record<string, number>>((acc, c) => { acc[c.bureau!] = (acc[c.bureau!] ?? 0) + 1; return acc; }, {}),
  ).map(([bureau, count]) => ({ bureau, count }));

  const byRegion = Object.entries(
    cases.reduce<Record<string, number>>((acc, c) => {
      const reg = c.region || c.institution?.region || "WESTERN";
      acc[reg] = (acc[reg] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([region, count]) => ({ region, count }));

  const { findCrossBureauOverlaps } = await import("@/lib/automation");
  const overlaps = findCrossBureauOverlaps(cases);

  // Ageing buckets on open cases (days since received)
  const ageingDef = [["0-3 days", 0, 3], ["4-7 days", 4, 7], ["8-15 days", 8, 15], ["16-30 days", 16, 30], ["30+ days", 31, 99999]] as const;
  const ageing = ageingDef.map(([bucket, lo, hi]) => ({
    bucket,
    count: open.filter((c) => { const d = (now - new Date(c.createdAt).getTime()) / 86400000; return d >= lo && d <= hi; }).length,
  }));

  // Priority review queue: overdue first, then critical, then due soon
  const rank = (c: typeof cases[number]) => (overdue.includes(c) ? 0 : c.priority === "CRITICAL" ? 1 : dueSoon.includes(c) ? 2 : 3);
  const priorityQueue = [...open].sort((a, b) => rank(a) - rank(b) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8);

  const recentEventsRaw = await db.caseEvent.findMany({
    where: { case: scope, visibility: roles.includes("COMPLAINANT") || roles.includes("INSTITUTION_OFFICER") ? "PUBLIC" : undefined },
    orderBy: { createdAt: "desc" }, take: 12,
    include: { case: { select: { caseNumber: true } }, actor: { select: { name: true, primaryRole: true } } },
  });

  const base = {
    role: user.primaryRole,
    total: cases.length,
    open: open.length,
    dueSoon: dueSoon.length,
    overdue: overdue.length,
    critical: open.filter((c) => c.priority === "CRITICAL").length,
    unassigned: open.filter((c) => !c.assignedOfficerId).length,
    needsTriage: cases.filter((c) => c.status === "RECEIVED" || c.status === "NEEDS_TRIAGE").length,
    underProcess: cases.filter((c) => ["UNDER_PROCESS", "IN_REVIEW", "COORDINATION_REQUIRED"].includes(c.status)).length,
    actionInitiated: cases.filter((c) => c.status === "ACTION_INITIATED").length,
    transferred: cases.filter((c) => c.status === "TRANSFERRED").length,
    overlapsCount: overlaps.length,
    resolved: cases.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length,
    byStatus, byBureau, byRegion, ageing,
    recentEvents: recentEventsRaw.map((e) => {
      const isComplainant = e.actor?.primaryRole === "COMPLAINANT" || e.eventType === "FILED" || e.eventType === "RATED";
      return {
        id: e.id,
        eventType: e.eventType,
        summary: e.summary,
        createdAt: e.createdAt,
        actorName: isComplainant ? (e.case?.caseNumber ? `Complaint ID: ${e.case.caseNumber}` : "Complaint ID (Protected)") : e.actorName,
        caseNumber: e.case?.caseNumber ?? null,
      };
    }),
  };

  if (roles.includes("PLATFORM_ADMIN")) {
    return ok({
      ...base,
      priorityQueue: priorityQueue.map((c) => ({ id: c.id, caseNumber: c.caseNumber, subject: c.subject, status: c.status, priority: c.priority, institution: c.institution.name, dueAt: c.dueAt, slaBreached: c.slaBreached })),
      institutions: await db.institution.count(),
      users: await db.user.count(),
      duplicateCandidates: await db.duplicateSuggestion.count({ where: { state: "PENDING" } }),
    });
  }
  if (roles.includes("COMPLAINANT")) {
    const mine = cases.filter((c) => c.complainantId === user.id);
    return ok({
      ...base,
      student: {
        total: mine.length,
        open: mine.filter((c) => OPEN_STATUSES.includes(c.status)).length,
        resolved: mine.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length,
      },
      priorityQueue: [],
    });
  }
  if (roles.includes("INSTITUTION_OFFICER")) {
    const mine = cases; // scoped to institution already
    return ok({
      ...base,
      college: {
        assigned: open.length,
        dueSoon: dueSoon.length,
        overdue: overdue.length,
        responseRequests: await db.notification.count({ where: { recipientId: user.id, type: "RESPONSE_REQUESTED", readAt: null } }),
        resolved: mine.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length,
      },
      priorityQueue: [],
    });
  }
  // Officers
  const mineOpen = open.filter((c) => c.assignedOfficerId === user.id);
  return ok({
    ...base,
    mine: { assigned: mineOpen.length, dueSoon: mineOpen.filter((c) => c.dueAt && new Date(c.dueAt).getTime() - now > 0 && new Date(c.dueAt).getTime() - now <= DUE_SOON_MS).length, overdue: mineOpen.filter((c) => c.dueAt && new Date(c.dueAt).getTime() <= now).length },
    duplicateCandidates: await db.duplicateSuggestion.count({ where: { state: "PENDING" } }),
    priorityQueue: priorityQueue.map((c) => ({ id: c.id, caseNumber: c.caseNumber, subject: c.subject, status: c.status, priority: c.priority, institution: c.institution.name, dueAt: c.dueAt, slaBreached: c.slaBreached })),
  });
}
