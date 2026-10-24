import { db } from "@/lib/db";
import { ok, err, requireSession, isNextResponse } from "@/lib/apih";
import { canActOnCase } from "@/lib/cases";
import { ensureSeed } from "@/lib/seed";

// GET /api/v1/cases/:id/duplicates — Pipeline D candidate suggestions (suggestion only)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const kase = await db.case.findUnique({ where: { id } });
  if (!kase) return err("Case not found.", 404);
  if (!canActOnCase(user, kase)) return err("Not authorized.", 403);
  const sugs = await db.duplicateSuggestion.findMany({
    where: { OR: [{ primaryCaseId: id }, { candidateCaseId: id }] },
    orderBy: { createdAt: "desc" },
    include: { primaryCase: { select: { caseNumber: true, subject: true } }, candidateCase: { select: { caseNumber: true, subject: true } } },
  });
  return ok({
    suggestions: sugs.map((s) => ({
      id: s.id, primaryCaseId: s.primaryCaseId, candidateCaseId: s.candidateCaseId,
      primaryCaseNumber: s.primaryCase.caseNumber, candidateCaseNumber: s.candidateCase.caseNumber,
      primarySubject: s.primaryCase.subject, candidateSubject: s.candidateCase.subject,
      score: s.score, algorithmVersion: s.algorithmVersion, reasons: JSON.parse(s.reasonsJson),
      state: s.state, reviewedByName: s.reviewedByName, reviewReason: s.reviewReason, createdAt: s.createdAt,
    })),
  });
}
