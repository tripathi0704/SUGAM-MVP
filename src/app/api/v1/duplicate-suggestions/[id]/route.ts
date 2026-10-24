import { db } from "@/lib/db";
import { ok, err, requireRole, isNextResponse } from "@/lib/apih";
import { appendAudit } from "@/lib/audit";
import { ensureSeed } from "@/lib/seed";

// POST /api/v1/duplicate-suggestions/:id — officer review (CONFIRM links, REJECT with reason).
// NEVER destructive: confirming only records a relation; both cases keep their IDs.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const user = await requireRole(["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER"]);
  if (isNextResponse(user)) return user as never;
  const sug = await db.duplicateSuggestion.findUnique({ where: { id }, include: { primaryCase: true, candidateCase: true } });
  if (!sug) return err("Suggestion not found.", 404);
  if (sug.state !== "PENDING") return err(`This suggestion was already reviewed (${sug.state}).`, 400);
  const body = await req.json().catch(() => null);
  const decision = String(body?.decision ?? "");
  const reason = String(body?.reason ?? "").trim();
  if (!["CONFIRMED", "REJECTED"].includes(decision)) return err("Decision must be CONFIRMED or REJECTED.", 422);
  if (reason.length < 5) return err("A review reason (min 5 characters) is recorded for audit.", 422, { fieldErrors: { reason: "Reason required." } });

  await db.duplicateSuggestion.update({
    where: { id },
    data: { state: decision, reviewedById: user.id, reviewedByName: user.name, reviewedAt: new Date(), reviewReason: reason },
  });
  if (decision === "CONFIRMED") {
    // Link without deleting anything: candidate case carries relatedCaseIds + masterIncidentId
    const related = JSON.parse(sug.primaryCase.relatedCaseIdsJson) as string[];
    const newRelated = Array.from(new Set([...related, sug.candidateCaseId]));
    await db.case.update({
      where: { id: sug.primaryCaseId },
      data: { relatedCaseIdsJson: JSON.stringify(newRelated), masterIncidentId: sug.primaryCase.masterIncidentId ?? sug.primaryCaseId },
    });
    await db.case.update({
      where: { id: sug.candidateCaseId },
      data: { relatedCaseIdsJson: JSON.stringify(Array.from(new Set([...(JSON.parse(sug.candidateCase.relatedCaseIdsJson) as string[]), sug.primaryCaseId]))), masterIncidentId: sug.primaryCase.masterIncidentId ?? sug.primaryCaseId },
    });
    await db.caseEvent.create({ data: { caseId: sug.primaryCaseId, eventType: "LINKED", summary: `Officer confirmed relation with ${sug.candidateCase.caseNumber}. Both cases remain independent with their own Case IDs and timelines. Reason: ${reason}`, visibility: "INTERNAL", actorId: user.id, actorName: user.name } });
    await db.caseEvent.create({ data: { caseId: sug.candidateCaseId, eventType: "LINKED", summary: `Officer confirmed relation with ${sug.primaryCase.caseNumber}. Processing continues unless an officer explicitly decides otherwise. Reason: ${reason}`, visibility: "INTERNAL", actorId: user.id, actorName: user.name } });
  } else {
    await db.caseEvent.create({ data: { caseId: sug.candidateCaseId, eventType: "DUPLICATE_FLAGGED", summary: `Duplicate suggestion vs ${sug.primaryCase.caseNumber} REJECTED by officer — case continues independently. Reason: ${reason}`, visibility: "INTERNAL", actorId: user.id, actorName: user.name } });
  }
  await appendAudit(decision === "CONFIRMED" ? "DUPLICATES_CONFIRMED" : "DUPLICATES_REJECTED", {
    actorId: user.id, actorEmail: user.email, targetType: "CASE", targetId: sug.primaryCaseId,
    summary: `Duplicate suggestion ${sug.primaryCase.caseNumber} ↔ ${sug.candidateCase.caseNumber} ${decision.toLowerCase()} — ${reason}`,
  });
  return ok({ state: decision });
}
