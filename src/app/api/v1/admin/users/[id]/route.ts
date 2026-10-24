import { db } from "@/lib/db";
import { ok, err, requireRole, isNextResponse } from "@/lib/apih";
import { audit } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

// PATCH /api/v1/admin/users/:id — activate/deactivate demo user
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const admin = await requireRole(["PLATFORM_ADMIN"]);
  if (isNextResponse(admin)) return admin as never;
  if (id === admin.id) return err("You cannot deactivate your own admin account.", 400);
  const body = await req.json().catch(() => null);
  const isActive = !!body?.isActive;
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return err("User not found.", 404);
  await db.user.update({ where: { id }, data: { isActive } });
  await audit("USER_STATE_CHANGED", { actorId: admin.id, actorEmail: admin.email, targetType: "USER", targetId: id, summary: `${target.email} ${isActive ? "activated" : "deactivated"}` });
  return ok({ isActive });
}
