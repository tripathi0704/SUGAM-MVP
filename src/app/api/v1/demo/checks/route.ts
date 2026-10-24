import { db } from "@/lib/db";
import { ok, err, requireRole, isNextResponse } from "@/lib/apih";
import { runDeadlineChecks } from "@/lib/notify";
import { ensureSeed } from "@/lib/seed";

// GET /api/v1/demo/checks — read current demo policy configuration (display only)
export async function GET() {
  await ensureSeed();
  const user = await requireRole(["PLATFORM_ADMIN", "REVIEWING_OFFICER", "INTAKE_OFFICER", "BUREAU_OFFICER", "AUDITOR"]);
  if (isNextResponse(user)) return user as never;
  const policyRow = await db.policyConfig.findUnique({ where: { key: "sla_policy" } });
  const routingRow = await db.policyConfig.findUnique({ where: { key: "routing_map" } });
  return ok({
    policy: policyRow ? JSON.parse(policyRow.valueJson) : null,
    routingMap: routingRow ? JSON.parse(routingRow.valueJson) : null,
  });
}

// POST /api/v1/demo/checks — admin-only "Run demo checks" trigger (Pipeline E)
export async function POST() {
  await ensureSeed();
  const user = await requireRole(["PLATFORM_ADMIN", "REVIEWING_OFFICER"]);
  if (isNextResponse(user)) return user as never;
  const result = await runDeadlineChecks("MANUAL_DEMO");
  return ok({ ...result, note: "Deadline evaluation ran across open cases. Due-soon and overdue alerts are deduplicated per policy window; overdue cases generate escalation notifications to the reviewing officer." });
}
