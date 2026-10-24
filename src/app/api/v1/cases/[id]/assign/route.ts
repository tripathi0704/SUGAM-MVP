import { db } from "@/lib/db";
import { ok, err, requireRole, isNextResponse } from "@/lib/apih";
import { getCaseForUser, projectCase } from "@/lib/cases";
import { appendAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { ensureSeed } from "@/lib/seed";

// POST /api/v1/cases/:id/assign — assign/reassign bureau or officer (Pipeline B)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const user = await requireRole(["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER"]);
  if (isNextResponse(user)) return user as never;
  const kase = await getCaseForUser(user, id);
  if (!kase) return err("Case not found or not authorized.", 404);

  const body = await req.json().catch(() => null);
  const toOfficerId = String(body?.toOfficerId ?? "").trim() || null;
  const toBureau = String(body?.toBureau ?? "").trim() || null;
  const reason = String(body?.reason ?? "").trim();
  if (!toOfficerId && !toBureau) return err("Choose an officer or a bureau to assign.", 422, { fieldErrors: { toOfficerId: "Required." } });
  if (!reason || reason.length < 4) return err("An assignment reason (min 4 characters) is recorded on the timeline.", 422, { fieldErrors: { reason: "Reason required." } });

  let officer: any = null;
  if (toOfficerId) {
    officer = await db.user.findUnique({ where: { id: toOfficerId } });
    if (!officer || !officer.isActive || !["BUREAU_OFFICER", "REVIEWING_OFFICER", "INTAKE_OFFICER"].includes(officer.primaryRole)) {
      return err("Selected user is not an active officer.", 422, { fieldErrors: { toOfficerId: "Invalid officer." } });
    }
  }
  const prev = await db.assignment.findFirst({ where: { caseId: kase.id, active: true } });
  if (prev) await db.assignment.update({ where: { id: prev.id }, data: { active: false } });
  await db.assignment.create({
    data: { caseId: kase.id, fromBureau: prev?.toBureau ?? null, toBureau: toBureau ?? officer?.bureau ?? null, fromOfficerId: prev?.toOfficerId ?? null, toOfficerId, assignedBy: user.id, reason, active: true },
  });
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (toOfficerId) updates.assignedOfficerId = toOfficerId;
  if (toBureau) updates.bureau = toBureau;
  // Assigning a RECEIVED/NEEDS_TRIAGE case advances it to ASSIGNED (workflow §6:
  // moving to ASSIGNED requires an assignment — and an assignment completes triage).
  let statusAdvanced = false;
  if (["RECEIVED", "NEEDS_TRIAGE"].includes(kase.status)) {
    updates.status = "ASSIGNED";
    statusAdvanced = true;
  }
  await db.case.update({ where: { id: kase.id }, data: updates as never });
  await db.caseEvent.create({
    data: {
      caseId: kase.id, eventType: "ASSIGNED", actorId: user.id, actorName: user.name,
      summary: `${toOfficerId ? "Assigned to " + officer!.name : "Routed to bureau " + (toBureau ?? "").replace(/_/g, " ")}${prev ? ` (reassigned from ${prev.toBureau?.replace(/_/g, " ") ?? "previous owner"})` : ""}. Reason: ${reason}${statusAdvanced ? " Status advanced to ASSIGNED." : ""}`,
      visibility: "INTERNAL",
    },
  });
  await appendAudit("CASE_ASSIGNED", { actorId: user.id, actorEmail: user.email, targetType: "CASE", targetId: kase.id, summary: `Case ${kase.caseNumber} assigned: ${officer?.name ?? toBureau} — ${reason}` });
  if (officer) await notify(officer.id, { caseId: kase.id, type: "ASSIGNED", title: `Case assigned to you: ${kase.caseNumber}`, message: `${kase.subject} — assigned by ${user.name}. Reason: ${reason}` });

  const fresh = await db.case.findUnique({ where: { id: kase.id }, include: { institution: { select: { id: true, code: true, name: true } }, complainant: { select: { id: true, name: true } } } });
  return ok({ case: projectCase(fresh!, user) });
}
