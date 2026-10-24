import { publicUser } from "@/lib/auth";
import { ok, err, requireSession, isNextResponse } from "@/lib/apih";
import { ensureSeed } from "@/lib/seed";
import { db } from "@/lib/db";

export async function GET() {
  await ensureSeed();
  const session = await requireSession();
  if (isNextResponse(session)) return session as never;
  const fresh = await db.user.findUnique({
    where: { id: session.id },
    include: { institution: { select: { id: true, code: true, name: true } } },
  });
  if (!fresh || !fresh.isActive) return err("Session no longer valid.", 401);
  const unread = await db.notification.count({ where: { recipientId: session.id, readAt: null } });
  return ok({ user: publicUser(fresh), unreadNotifications: unread });
}
