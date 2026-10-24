import { db } from "@/lib/db";
import { ok, err, requireRole, isNextResponse } from "@/lib/apih";
import { appendAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { ensureSeed } from "@/lib/seed";

// GET /api/v1/admin/reports — internal accountability reports (role-aware)
export async function GET() {
  await ensureSeed();
  const user = await requireRole(["REVIEWING_OFFICER", "PLATFORM_ADMIN", "INSTITUTION_OFFICER", "INTAKE_OFFICER"]);
  if (isNextResponse(user)) return user as never;
  const roles = [user.primaryRole, ...(JSON.parse(user.rolesJson) as string[])];
  const where = roles.includes("INSTITUTION_OFFICER") ? { institutionId: user.institutionId ?? "none" } : {};
  const reports = await db.internalReport.findMany({
    where, orderBy: { createdAt: "desc" }, take: 50,
    include: { institution: { select: { code: true, name: true } } },
  });
  return ok({ reports });
}

// PATCH /api/v1/admin/reports — institution acknowledges a report
export async function PATCH(req: Request) {
  const user = await requireRole(["INSTITUTION_OFFICER"]);
  if (isNextResponse(user)) return user as never;
  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "");
  if (body?.action !== "ACKNOWLEDGE" || !id) return err("Send {id, action:'ACKNOWLEDGE'}.", 422);
  const report = await db.internalReport.findUnique({ where: { id } });
  if (!report) return err("Report not found.", 404);
  if (report.institutionId !== user.institutionId) return err("This report belongs to another institution.", 403);
  await db.internalReport.update({ where: { id }, data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date() } });
  await appendAudit("REPORT_ACKNOWLEDGED", { actorId: user.id, actorEmail: user.email, targetType: "INSTITUTION", targetId: report.institutionId, summary: `Institution acknowledged report: ${report.subject}` });
  return ok({ acknowledged: true });
}

// POST /api/v1/admin/reports — officer sends internal report to an institution
export async function POST(req: Request) {
  const user = await requireRole(["REVIEWING_OFFICER", "PLATFORM_ADMIN"]);
  if (isNextResponse(user)) return user as never;
  const body = await req.json().catch(() => null);
  const institutionId = String(body?.institutionId ?? "");
  const subject = String(body?.subject ?? "").trim();
  const message = String(body?.message ?? "").trim();
  const caseId = body?.caseId ? String(body.caseId) : null;
  const fieldErrors: Record<string, string> = {};
  if (!institutionId) fieldErrors.institutionId = "Choose the institution.";
  if (subject.length < 6) fieldErrors.subject = "Subject must be at least 6 characters.";
  if (message.length < 20) fieldErrors.message = "Explain the accountability concern (min 20 characters).";
  if (Object.keys(fieldErrors).length) return err("Validation failed.", 422, { fieldErrors });
  const inst = await db.institution.findUnique({ where: { id: institutionId } });
  if (!inst) return err("Institution not found.", 404);
  const report = await db.internalReport.create({
    data: { institutionId, officerId: user.id, officerName: user.name, caseId, caseNumber: caseId ? (await db.case.findUnique({ where: { id: caseId } }))?.caseNumber ?? null : null, subject, message },
  });
  await appendAudit("REPORT_SENT", { actorId: user.id, actorEmail: user.email, targetType: "INSTITUTION", targetId: institutionId, summary: `Internal report sent to ${inst.name}: ${subject}` });
  const nodal = await db.user.findFirst({ where: { institutionId, primaryRole: "INSTITUTION_OFFICER", isActive: true } });
  if (nodal) await notify(nodal.id, { type: "REPORT_SENT", title: `Internal report received: ${subject}`, message: "Open your Institution Workspace → Notices & Reports to acknowledge." });
  return ok({ report }, 201);
}
