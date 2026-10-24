import { db } from "@/lib/db";
import { ok, requireRole, isNextResponse } from "@/lib/apih";
import { ensureSeed } from "@/lib/seed";

// GET /api/v1/imports/runs — sync-run history with rejected-row reports
export async function GET() {
  await ensureSeed();
  const user = await requireRole(["INTAKE_OFFICER", "PLATFORM_ADMIN"]);
  if (isNextResponse(user)) return user as never;
  const runs = await db.integrationSyncRun.findMany({ orderBy: { startedAt: "desc" }, take: 20 });
  return ok({
    runs: runs.map((r) => ({ ...r, rejectedRows: JSON.parse(r.rejectedRowsJson) })),
  });
}
