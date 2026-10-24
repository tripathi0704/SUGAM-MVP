import { db } from "@/lib/db";
import { ok, err, requireSession, isNextResponse } from "@/lib/apih";
import { findCrossBureauOverlaps } from "@/lib/automation";
import { appendAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";

export async function GET() {
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;

  const cases = await db.case.findMany({
    include: {
      institution: { select: { id: true, code: true, name: true, permanentId: true, region: true, state: true } },
      assignedOfficer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const overlaps = findCrossBureauOverlaps(cases);
  return ok({ overlaps, totalOverlaps: overlaps.length });
}

export async function POST(req: Request) {
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;

  const body = await req.json().catch(() => null);
  const caseIds: string[] = body?.caseIds ?? [];
  const notes = String(body?.notes ?? "").trim();

  if (!Array.isArray(caseIds) || caseIds.length < 2) {
    return err("Select at least 2 overlapping cases to coordinate.", 422);
  }

  // Update status of all cases to COORDINATION_REQUIRED
  await db.case.updateMany({
    where: { id: { in: caseIds } },
    data: {
      overlapFlag: true,
      coordinationStatus: "COORDINATION_REQUIRED",
      status: "COORDINATION_REQUIRED",
      updatedAt: new Date(),
    },
  });

  for (const cid of caseIds) {
    await db.caseEvent.create({
      data: {
        caseId: cid,
        eventType: "COORDINATION_INITIATED",
        actorId: user.id,
        actorName: user.name,
        summary: `Inter-bureau coordination initiated by ${user.name}. Note: ${notes || "Cross-bureau overlap identified across Regulation Bureau & PGRC. Joint action underway."}`,
        visibility: "INTERNAL",
      },
    });
    await appendAudit("CASE_COORDINATED", {
      actorId: user.id,
      actorEmail: user.email,
      targetType: "CASE",
      targetId: cid,
      summary: `Cross-bureau coordination initiated for case ${cid}. Reason: ${notes}`,
    });
  }

  return ok({ message: "Inter-bureau coordination successfully established across selected cases." });
}
