import { db } from "@/lib/db";
import { ok, requireSession, isNextResponse } from "@/lib/apih";
import { ensureSeed } from "@/lib/seed";

// POST /api/v1/notifications/read — mark all (or selected) as read
export async function POST(req: Request) {
  await ensureSeed();
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const body = await req.json().catch(() => ({}));
  const ids: string[] | undefined = body?.ids;
  await db.notification.updateMany({
    where: { recipientId: user.id, readAt: null, ...(ids?.length ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });
  const unread = await db.notification.count({ where: { recipientId: user.id, readAt: null } });
  return ok({ unread });
}
