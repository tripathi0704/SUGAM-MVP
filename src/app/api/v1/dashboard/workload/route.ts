import { db } from "@/lib/db";
import { ok, requireSession, isNextResponse } from "@/lib/apih";
import { caseScopeFilter } from "@/lib/cases";
import { OPEN_STATUSES, BUREAUS } from "@/lib/constants";
import { ensureSeed } from "@/lib/seed";

// Workload: bureau × status matrix + ageing (§8.4 officer overview)
export async function GET() {
  await ensureSeed();
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const scope = caseScopeFilter(user);
  const open = await db.case.findMany({ where: { AND: [scope, { status: { in: OPEN_STATUSES } }] } });

  const statuses = ["RECEIVED", "NEEDS_TRIAGE", "ASSIGNED", "IN_REVIEW", "WAITING_FOR_INFORMATION", "ACTION_REQUIRED", "PENDING_REVIEW", "REOPENED"];
  const matrix = BUREAUS.map((b) => ({
    bureau: b,
    total: open.filter((c) => c.bureau === b).length,
    byStatus: Object.fromEntries(statuses.map((s) => [s, open.filter((c) => c.bureau === b && c.status === s).length])),
  }));
  const unassigned = open.filter((c) => !c.bureau).length;
  const now = Date.now();
  const ageing = [
    { bucket: "0-3 days", count: open.filter((c) => (now - new Date(c.createdAt).getTime()) / 86400000 <= 3).length },
    { bucket: "4-7 days", count: open.filter((c) => { const d = (now - new Date(c.createdAt).getTime()) / 86400000; return d > 3 && d <= 7; }).length },
    { bucket: "8-15 days", count: open.filter((c) => { const d = (now - new Date(c.createdAt).getTime()) / 86400000; return d > 7 && d <= 15; }).length },
    { bucket: "16-30 days", count: open.filter((c) => { const d = (now - new Date(c.createdAt).getTime()) / 86400000; return d > 15 && d <= 30; }).length },
    { bucket: "30+ days", count: open.filter((c) => (now - new Date(c.createdAt).getTime()) / 86400000 > 30).length },
  ];
  return ok({ matrix, unassigned, ageing, openCount: open.length });
}
