import { db } from "@/lib/db";
import { ok, err, requireSession, isNextResponse } from "@/lib/apih";
import { canActOnCase } from "@/lib/cases";
import { appendAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { ensureSeed } from "@/lib/seed";

// GET /api/v1/cases/:id/responses — authorized response thread
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const kase = await db.case.findUnique({ where: { id } });
  if (!kase) return err("Case not found.", 404);
  if (!canActOnCase(user, kase)) return err("Not authorized.", 403);
  const responses = await db.caseResponse.findMany({
    where: { caseId: id },
    orderBy: { createdAt: "desc" },
  });
  const isOwn = kase.complainantId === user.id;
  return ok({
    responses: responses.map((r) => ({
      id: r.id, caseId: r.caseId,
      authorName: r.authorRole === "COMPLAINANT" && !isOwn ? `Complaint ID: ${kase.caseNumber}` : r.authorName,
      authorRole: r.authorRole,
      message: r.message, requested: r.requested, templateUsed: r.templateUsed,
      evidenceIds: JSON.parse(r.evidenceIdsJson) as string[], createdAt: r.createdAt,
    })),
  });
}

// POST /api/v1/cases/:id/responses — Pipeline C multi-role handoff.
// College submits authorized response; complainant adds info; officer records notes.
// A response NEVER auto-resolves or closes a case.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const kase = await db.case.findUnique({ where: { id } });
  if (!kase) return err("Case not found.", 404);
  if (!canActOnCase(user, kase)) return err("Not authorized.", 403);
  const body = await req.json().catch(() => null);
  const message = String(body?.message ?? "").trim();
  const templateUsed = body?.templateUsed ? String(body.templateUsed) : null;
  if (message.length < 10 || message.length > 4000) return err("Response must be 10-4000 characters.", 422, { fieldErrors: { message: "Required (10-4000 chars)." } });

  const roles = [user.primaryRole, ...(JSON.parse(user.rolesJson) as string[])];
  let authorRole = "OFFICER";
  if (roles.includes("INSTITUTION_OFFICER")) authorRole = "INSTITUTION_OFFICER";
  else if (roles.includes("COMPLAINANT")) authorRole = "COMPLAINANT";

  const response = await db.caseResponse.create({
    data: { caseId: id, authorId: user.id, authorName: authorRole === "INSTITUTION_OFFICER" ? "Nodal Officer (identity on file)" : user.name, authorRole, message, requested: authorRole === "INSTITUTION_OFFICER", templateUsed },
  });
  await db.caseEvent.create({
    data: {
      caseId: id, eventType: "RESPONSE_ADDED", visibility: "PUBLIC", actorId: user.id, actorName: user.name,
      summary: authorRole === "INSTITUTION_OFFICER"
        ? `Institution submitted an authorized response${templateUsed ? ` using pre-defined format "${templateUsed}"` : ""}. Officer review required — the case is NOT auto-resolved.`
        : authorRole === "COMPLAINANT"
          ? "Complainant submitted additional information for review."
          : "Officer note recorded on the case.",
    },
  });
  await db.case.update({ where: { id }, data: { updatedAt: new Date() } });
  await appendAudit("RESPONSE_ADDED", { actorId: user.id, actorEmail: user.email, targetType: "CASE", targetId: id, summary: `${authorRole} response on ${kase.caseNumber}: ${message.slice(0, 80)}` });

  if (authorRole === "INSTITUTION_OFFICER") {
    const recipients = new Set<string>();
    if (kase.assignedOfficerId) recipients.add(kase.assignedOfficerId);
    if (kase.complainantId) recipients.add(kase.complainantId);
    for (const r of recipients) {
      await notify(r, { caseId: id, type: "RESPONSE_ADDED", title: `Institution responded on ${kase.caseNumber}`, message: `${kase.subject} — the institution submitted a response${templateUsed ? ` (format: ${templateUsed})` : ""}. Officer decision pending.` });
    }
  } else if (authorRole === "COMPLAINANT") {
    if (kase.assignedOfficerId) await notify(kase.assignedOfficerId, { caseId: id, type: "RESPONSE_ADDED", title: `Complainant added info on ${kase.caseNumber}`, message: kase.subject });
  } else if (kase.complainantId) {
    await notify(kase.complainantId, { caseId: id, type: "STATUS_UPDATED", title: `Officer note on ${kase.caseNumber}`, message: "The assigned officer recorded an update on your case." });
  }
  return ok({ response }, 201);
}
