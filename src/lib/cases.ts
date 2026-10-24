// Case scoping & projection — server-side authorization for case data (§3.3).
// Every case route funnels through here so role/institution rules stay in ONE place.
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/apih";
import type { Prisma } from "@prisma/client";
import { STAFF_ROLES } from "@/lib/apih";
import type { Role } from "@/lib/constants";

export function caseScopeFilter(user: SessionUser): Prisma.CaseWhereInput {
  const roles = [user.primaryRole, ...(JSON.parse(user.rolesJson) as string[])];
  if (roles.some((r) => STAFF_ROLES.includes(r as Role))) return {};
  if (user.primaryRole === "INSTITUTION_OFFICER" && user.institutionId) {
    return { institutionId: user.institutionId };
  }
  // Complainant: only own cases
  return { complainantId: user.id };
}

export async function getCaseForUser(user: SessionUser, caseId: string) {
  const kase = await db.case.findUnique({
    where: { id: caseId },
    include: {
      institution: { select: { id: true, code: true, name: true } },
      complainant: { select: { id: true, name: true, rollNo: true } },
    },
  });
  if (!kase) return null;
  if (!canActOnCase(user, kase)) return null;
  return kase;
}

export function canActOnCase(user: SessionUser, kase: { complainantId: string | null; institutionId: string; assignedOfficerId: string | null }): boolean {
  const roles = [user.primaryRole, ...(JSON.parse(user.rolesJson) as string[])];
  if (roles.some((r) => STAFF_ROLES.includes(r as Role))) return true;
  if (user.primaryRole === "INSTITUTION_OFFICER") return !!user.institutionId && kase.institutionId === user.institutionId;
  return kase.complainantId === user.id;
}

// Role-gated case projection: Complainant identity is protected (§1.2 & Whistleblower policy).
// Officers and institutions ONLY see Complaint ID; real identity is never exposed on officer dashboards.
export function projectCase(
  kase: any,
  user: SessionUser,
) {
  const isOwn = kase.complainantId === user.id;
  return {
    id: kase.id,
    caseNumber: kase.caseNumber,
    sourceSystem: kase.sourceSystem,
    sourceRecordId: isOwn ? kase.sourceRecordId : null,
    institutionId: kase.institutionId,
    institution: {
      id: kase.institution.id,
      code: kase.institution.code,
      name: kase.institution.name,
      permanentId: kase.institution.permanentId ?? null,
      region: kase.institution.region ?? null,
    },
    complainantId: isOwn ? kase.complainantId : null,
    complainant: isOwn && kase.complainant
      ? { id: kase.complainant.id, name: kase.complainant.name, masked: false }
      : { id: kase.caseNumber, name: `Complaint ID: ${kase.caseNumber}`, masked: true },
    category: kase.category,
    categorySource: kase.categorySource,
    bureau: kase.bureau,
    region: kase.region ?? kase.institution.region ?? null,
    subject: kase.subject,
    description: kase.description ?? "",
    status: kase.status,
    priority: kase.priority,
    assignedOfficerId: kase.assignedOfficerId,
    dueAt: kase.dueAt ? (typeof kase.dueAt === "string" ? kase.dueAt : kase.dueAt.toISOString()) : null,
    slaBreached: kase.slaBreached ?? false,
    escalated: kase.escalated ?? false,
    overlapFlag: kase.overlapFlag ?? false,
    coordinationStatus: kase.coordinationStatus ?? null,
    transferredFromBureau: kase.transferredFromBureau ?? null,
    transferReason: kase.transferReason ?? null,
    nextActionLabel: kase.nextActionLabel,
    nextActionDueAt: kase.nextActionDueAt ? (typeof kase.nextActionDueAt === "string" ? kase.nextActionDueAt : kase.nextActionDueAt.toISOString()) : null,
    nextActionState: kase.nextActionState,
    relatedCaseIds: typeof kase.relatedCaseIdsJson === "string" ? (JSON.parse(kase.relatedCaseIdsJson) as string[]) : (kase.relatedCaseIds ?? []),
    masterIncidentId: kase.masterIncidentId,
    resolvedAt: kase.resolvedAt ? (typeof kase.resolvedAt === "string" ? kase.resolvedAt : kase.resolvedAt.toISOString()) : null,
    rating: kase.rating,
    ruleExplanation: kase.ruleExplanation,
    createdAt: typeof kase.createdAt === "string" ? kase.createdAt : kase.createdAt.toISOString(),
    updatedAt: typeof kase.updatedAt === "string" ? kase.updatedAt : kase.updatedAt.toISOString(),
    lastActionAt: typeof kase.updatedAt === "string" ? kase.updatedAt : kase.updatedAt.toISOString(),
  };
}
