import { db } from "@/lib/db";
import { ok, err, requireSession, isNextResponse } from "@/lib/apih";
import { canActOnCase } from "@/lib/cases";
import { appendAudit } from "@/lib/audit";
import { ensureSeed } from "@/lib/seed";

// POST /api/v1/cases/:id/rate — complainant feedback after resolution (score input)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const kase = await db.case.findUnique({ where: { id } });
  if (!kase) return err("Case not found.", 404);
  if (kase.complainantId !== user.id) return err("Only the complainant can rate this case.", 403);
  if (!["RESOLVED"].includes(kase.status)) return err("Feedback can be submitted once the case is RESOLVED.", 400);
  const body = await req.json().catch(() => null);
  const rating = parseInt(String(body?.rating ?? ""), 10);
  if (!rating || rating < 1 || rating > 5) return err("Rating must be between 1 and 5.", 422, { fieldErrors: { rating: "1-5 required." } });
  const comment = String(body?.comment ?? "").trim().slice(0, 500) || null;
  await db.case.update({ where: { id }, data: { rating, ratingComment: comment } });
  await db.caseEvent.create({ data: { caseId: id, eventType: "RATED", summary: `Complainant rated the resolution ${rating}/5.`, visibility: "PUBLIC", actorId: user.id, actorName: user.name } });
  await appendAudit("CASE_RATED", { actorId: user.id, targetType: "CASE", targetId: id, summary: `Case ${kase.caseNumber} rated ${rating}/5` });
  return ok({ rating });
}
