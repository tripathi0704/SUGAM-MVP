import { db } from "@/lib/db";
import { publicUser, audit } from "@/lib/auth";
import { ok, err, requireSession, isNextResponse } from "@/lib/apih";

export async function PATCH(req: Request) {
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const phone = String(body?.phone ?? "").trim();

  // Strict validation (profile editing with proper validation)
  const errors: Record<string, string> = {};
  if (name.length < 3 || name.length > 80) errors.name = "Name must be 3-80 characters.";
  if (phone && !/^\+?[0-9]{10,13}$/.test(phone.replace(/[\s-]/g, ""))) {
    errors.phone = "Phone must be 10-13 digits (optional +country code).";
  }
  if (Object.keys(errors).length) return err("Validation failed.", 422, { fieldErrors: errors });

  const updated = await db.user.update({
    where: { id: user.id },
    data: { name, phone: phone || null },
    include: { institution: { select: { id: true, code: true, name: true } } },
  });
  await audit("PROFILE_UPDATED", { actorId: user.id, actorEmail: user.email, summary: "Profile details updated" });
  return ok({ user: publicUser(updated) });
}
