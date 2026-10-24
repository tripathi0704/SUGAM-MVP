import { db } from "@/lib/db";
import { ok, requireRole, isNextResponse } from "@/lib/apih";
import { ensureSeed } from "@/lib/seed";

// GET /api/v1/officers — minimal active-officer list for assignment dialogs.
// Officers may see colleague names + bureau; no emails or case data here.
export async function GET() {
  await ensureSeed();
  const user = await requireRole(["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER", "PLATFORM_ADMIN"]);
  if (isNextResponse(user)) return user as never;
  const officers = await db.user.findMany({
    where: { isActive: true, primaryRole: { in: ["BUREAU_OFFICER", "REVIEWING_OFFICER", "INTAKE_OFFICER"] } },
    select: { id: true, name: true, primaryRole: true, bureau: true },
    orderBy: [{ bureau: "asc" }, { name: "asc" }],
  });
  return ok({ officers });
}
