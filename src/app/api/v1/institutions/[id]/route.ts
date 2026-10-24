import { db } from "@/lib/db";
import { ok, err, requireSession, isNextResponse } from "@/lib/apih";
import { STAFF_ROLES } from "@/lib/apih";
import { ensureSeed } from "@/lib/seed";
import { institutionScore } from "@/lib/automation";

// GET /api/v1/institutions/:id — Institution 360° (§8.1, §9 Day 6):
// profile + independent associated case list + accountability score + reports.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const roles = [user.primaryRole, ...(JSON.parse(user.rolesJson) as string[])];
  const inst = await db.institution.findUnique({
    where: { id },
    include: {
      users: { where: { primaryRole: "INSTITUTION_OFFICER", isActive: true }, select: { name: true, email: true } },
      cases: {
        orderBy: { updatedAt: "desc" },
        include: { institution: { select: { id: true, code: true, name: true } }, complainant: { select: { id: true, name: true } } },
      },
      reports: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!inst) return err("Institution not found.", 404);
  // Institution officers may only view their own institution 360°
  if (roles.includes("INSTITUTION_OFFICER") && !roles.some((r) => STAFF_ROLES.includes(r as never)) && user.institutionId !== id) {
    return err("You are not authorized to view another institution's workspace.", 403);
  }
  const showIdentity = roles.some((r) => STAFF_ROLES.includes(r as never));
  const isStaff = showIdentity;
  const now = Date.now();
  const OPEN = ["RECEIVED", "NEEDS_TRIAGE", "ASSIGNED", "IN_REVIEW", "WAITING_FOR_INFORMATION", "ACTION_REQUIRED", "PENDING_REVIEW", "REOPENED"];
  const score = institutionScore({
    resolvedCases: inst.cases.filter((c) => c.resolvedAt).map((c) => ({
      resolutionDays: Math.max(1, Math.round((new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime()) / 86400000)),
      slaBreached: c.slaBreached,
      rating: c.rating,
    })),
    openCases: inst.cases.filter((c) => OPEN.includes(c.status)).map((c) => ({ overdue: !!(c.dueAt && new Date(c.dueAt).getTime() < now) })),
  });
  return ok({
    institution: {
      id: inst.id, code: inst.code, permanentId: inst.permanentId, name: inst.name,
      state: inst.state, district: inst.district, region: inst.region, address: inst.address,
      approvalStatus: inst.approvalStatus,
      dataSource: inst.dataSource, isSynthetic: inst.isSynthetic, identifiers: JSON.parse(inst.identifiersJson),
      nodalOfficers: inst.users,
    },
    totalCases: inst.cases.length,
    openCases: inst.cases.filter((c) => OPEN.includes(c.status)).length,
    overdueCases: inst.cases.filter((c) => OPEN.includes(c.status) && c.dueAt && new Date(c.dueAt).getTime() < now).length,
    resolvedCases: inst.cases.filter((c) => ["RESOLVED", "CLOSED"].includes(c.status)).length,
    score,
    reports: isStaff || roles.includes("INSTITUTION_OFFICER") ? inst.reports : [],
    cases: inst.cases.map((c) => ({
      id: c.id, caseNumber: c.caseNumber, subject: c.subject, category: c.category, status: c.status,
      priority: c.priority, bureau: c.bureau, dueAt: c.dueAt, slaBreached: c.slaBreached,
      escalated: c.escalated, sourceSystem: c.sourceSystem, createdAt: c.createdAt, updatedAt: c.updatedAt,
      rating: c.rating,
      overlapFlag: c.overlapFlag,
      coordinationStatus: c.coordinationStatus,
      region: c.region,
      complainant: isStaff && c.complainant ? { name: c.complainant.name } : c.complainant ? { name: "Identity protected (demo policy)" } : null,
    })),
  });
}
