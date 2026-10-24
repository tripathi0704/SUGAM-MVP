import { db } from "@/lib/db";
import { ok, requireRole, isNextResponse } from "@/lib/apih";
import { institutionScore } from "@/lib/automation";
import { ensureSeed } from "@/lib/seed";

// GET /api/v1/admin/scores — institution accountability ranking (demo metric, formula disclosed)
export async function GET() {
  await ensureSeed();
  const user = await requireRole(["REVIEWING_OFFICER", "PLATFORM_ADMIN", "AUDITOR"]);
  if (isNextResponse(user)) return user as never;
  const institutions = await db.institution.findMany({ include: { cases: true } });
  const OPEN = ["RECEIVED", "NEEDS_TRIAGE", "ASSIGNED", "IN_REVIEW", "WAITING_FOR_INFORMATION", "ACTION_REQUIRED", "PENDING_REVIEW", "REOPENED"];
  const rows = institutions.map((inst) => {
    const resolved = inst.cases.filter((c) => c.resolvedAt).map((c) => ({
      resolutionDays: Math.max(1, Math.round((new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime()) / 86400000)),
      slaBreached: c.slaBreached, rating: c.rating,
    }));
    const score = institutionScore({ resolvedCases: resolved, openCases: [] });
    const open = inst.cases.filter((c) => OPEN.includes(c.status));
    return {
      institutionId: inst.id, code: inst.code, name: inst.name, state: inst.state,
      totalCases: inst.cases.length, openCases: open.length,
      overdueCases: open.filter((c) => c.dueAt && new Date(c.dueAt).getTime() < Date.now()).length,
      resolvedCount: resolved.length, breaches: inst.cases.filter((c) => c.slaBreached).length,
      avgResolutionDays: resolved.length ? Math.round(resolved.reduce((s, c) => s + c.resolutionDays, 0) / resolved.length) : null,
      avgRating: (() => { const r = inst.cases.filter((c) => c.rating != null); return r.length ? Math.round((r.reduce((s, c) => s + (c.rating ?? 0), 0) / r.length) * 10) / 10 : null; })(),
      score: score.score, band: score.band, breakdown: score.breakdown,
    };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  return ok({
    institutions: rows,
    formula: "Demo accountability metric: resolution speed 40% + SLA compliance 35% + complainant feedback 25% (0-100). Bands: GREEN ≥70, AMBER 50-69, RED <50. Not an official AICTE grading.",
  });
}
