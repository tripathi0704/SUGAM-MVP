import { db } from "@/lib/db";
import { ok, requireSession, isNextResponse } from "@/lib/apih";
import { ensureSeed } from "@/lib/seed";

// GET /api/v1/notifications — in-app notification center
export async function GET(req: Request) {
  await ensureSeed();
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const sp = new URL(req.url).searchParams;
  const unreadOnly = sp.get("unread") === "1";
  const notifications = await db.notification.findMany({
    where: { recipientId: user.id, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { case: { select: { caseNumber: true } } },
  });
  const unread = await db.notification.count({ where: { recipientId: user.id, readAt: null } });
  return ok({ notifications, unread });
}
