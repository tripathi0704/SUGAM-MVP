import { db } from "@/lib/db";
import { ok, err, requireSession, isNextResponse, parsePaging } from "@/lib/apih";
import { getCaseForUser } from "@/lib/cases";
import { appendAudit } from "@/lib/audit";
import { ensureSeed } from "@/lib/seed";

// GET /api/v1/cases/:id/events — visibility-filtered timeline (§5.3)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const kase = await getCaseForUser(user, id);
  if (!kase) return err("Case not found or not authorized.", 404);
  const { sp } = parsePaging(_req.url, 100);
  const roles = [user.primaryRole, ...(JSON.parse(user.rolesJson) as string[])];
  const isStaff = ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER", "AUDITOR", "PLATFORM_ADMIN"].some((r) => roles.includes(r));
  // Complainants and institution officers see the PUBLIC timeline only (§1.2 privacy)
  const events = await db.caseEvent.findMany({
    where: { caseId: id, ...(isStaff ? {} : { visibility: "PUBLIC" }) },
    orderBy: { createdAt: "desc" },
    take: Math.min(200, parseInt(sp.get("pageSize") ?? "100", 10) || 100),
    include: { actor: { select: { name: true, primaryRole: true } } },
  });
  const isOwn = kase.complainantId === user.id;
  const sanitizedEvents = events.map((e) => {
    const isComplainantEvent = e.actor?.primaryRole === "COMPLAINANT" || e.eventType === "FILED" || e.eventType === "RATED";
    if (isComplainantEvent && !isOwn) {
      return {
        ...e,
        actorName: `Complaint ID: ${kase.caseNumber}`,
        actor: e.actor ? { ...e.actor, name: `Complaint ID: ${kase.caseNumber}` } : null,
      };
    }
    return e;
  });
  return ok({ events: sanitizedEvents });
}

// POST /api/v1/cases/:id/events — permitted note/action event
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const kase = await getCaseForUser(user, id);
  if (!kase) return err("Case not found or not authorized.", 404);
  const body = await req.json().catch(() => null);
  const summary = String(body?.summary ?? "").trim();
  if (summary.length < 4 || summary.length > 800) return err("Note must be 4-800 characters.", 422, { fieldErrors: { summary: "Required (4-800 chars)." } });
  const roles = [user.primaryRole, ...(JSON.parse(user.rolesJson) as string[])];
  const isOfficer = ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER", "PLATFORM_ADMIN"].some((r) => roles.includes(r));
  const visibility = isOfficer && body?.visibility === "PUBLIC" ? "PUBLIC" : isOfficer ? "INTERNAL" : "PUBLIC";
  const event = await db.caseEvent.create({
    data: { caseId: id, eventType: isOfficer ? "NOTE_ADDED" : "NOTE_ADDED", summary: `${roles.includes("COMPLAINANT") ? "Complainant added information: " : "Note: "}${summary}`, visibility, actorId: user.id, actorName: user.name },
  });
  await db.case.update({ where: { id }, data: { updatedAt: new Date() } });
  await appendAudit("CASE_NOTE_ADDED", { actorId: user.id, actorEmail: user.email, targetType: "CASE", targetId: id, summary: `Note on ${kase.caseNumber}: ${summary.slice(0, 80)}` });
  return ok({ event }, 201);
}
