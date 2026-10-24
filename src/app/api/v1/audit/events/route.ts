import { db } from "@/lib/db";
import { ok, requireRole, isNextResponse, parsePaging } from "@/lib/apih";
import { ensureSeed } from "@/lib/seed";

// GET /api/v1/audit/events — hash-linked audit trail (Auditor + officers)
export async function GET(req: Request) {
  await ensureSeed();
  const user = await requireRole(["AUDITOR", "REVIEWING_OFFICER", "PLATFORM_ADMIN"]);
  if (isNextResponse(user)) return user as never;
  const { skip, take, page, pageSize, sp } = parsePaging(req.url, 15);
  const q = (sp.get("q") ?? "").trim();
  const action = sp.get("action");
  const where = {
    ...(q ? { OR: [{ summary: { contains: q } }, { actorEmail: { contains: q } }, { targetId: { contains: q } }] } : {}),
    ...(action ? { action } : {}),
  };
  const [total, events, actions] = await Promise.all([
    db.auditEvent.count({ where }),
    db.auditEvent.findMany({ where, orderBy: { sequence: "desc" }, skip, take }),
    db.auditEvent.groupBy({ by: ["action"], _count: true }),
  ]);
  return ok({
    total, page, pageSize,
    events,
    actionCounts: actions.map((a) => ({ action: a.action, count: a._count })).sort((a, b) => b.count - a.count),
  });
}
