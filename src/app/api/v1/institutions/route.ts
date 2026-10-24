import { db } from "@/lib/db";
import { ok, err, requireRole, isNextResponse, parsePaging } from "@/lib/apih";
import { audit } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

// GET /api/v1/institutions — searchable, paginated directory (§7.2)
export async function GET(req: Request) {
  await ensureSeed();
  const { skip, take, page, pageSize, sp } = parsePaging(req.url, 10);
  const q = (sp.get("q") ?? "").trim();
  const where = q ? {
    OR: [
      { name: { contains: q } },
      { code: { contains: q } },
      { permanentId: { contains: q } },
      { state: { contains: q } },
      { district: { contains: q } },
      { region: { contains: q } },
    ],
  } : {};
  const [total, rows] = await Promise.all([
    db.institution.count({ where }),
    db.institution.findMany({
      where, orderBy: { name: "asc" }, skip, take,
      include: { _count: { select: { cases: true } } },
    }),
  ]);
  const ids = rows.map((r) => r.id);
  const [openCounts, overdueCases, resolvedCounts] = await Promise.all([
    db.case.groupBy({ by: ["institutionId"], where: { institutionId: { in: ids }, status: { in: ["RECEIVED", "NEEDS_TRIAGE", "ASSIGNED", "IN_REVIEW", "WAITING_FOR_INFORMATION", "ACTION_REQUIRED", "PENDING_REVIEW", "REOPENED"] } }, _count: true }),
    db.case.findMany({ where: { institutionId: { in: ids }, status: { in: ["RECEIVED", "NEEDS_TRIAGE", "ASSIGNED", "IN_REVIEW", "WAITING_FOR_INFORMATION", "ACTION_REQUIRED", "PENDING_REVIEW", "REOPENED"] }, dueAt: { lt: new Date() } }, select: { institutionId: true } }),
    db.case.groupBy({ by: ["institutionId"], where: { institutionId: { in: ids }, status: { in: ["RESOLVED", "CLOSED"] } }, _count: true }),
  ]);
  return ok({
    total, page, pageSize,
    institutions: rows.map((r) => ({
      id: r.id, code: r.code, permanentId: r.permanentId, name: r.name, state: r.state, district: r.district,
      region: r.region, address: r.address, approvalStatus: r.approvalStatus,
      dataSource: r.dataSource, isSynthetic: r.isSynthetic,
      totalCases: r._count.cases,
      openCases: openCounts.find((o) => o.institutionId === r.id)?._count ?? 0,
      overdueCases: overdueCases.filter((c) => c.institutionId === r.id).length,
      resolvedCases: resolvedCounts.find((o) => o.institutionId === r.id)?._count ?? 0,
    })),
  });
}

// POST /api/v1/institutions — add institution (admin per § Phase 3 "can add institute")
export async function POST(req: Request) {
  const user = await requireRole(["PLATFORM_ADMIN"]);
  if (isNextResponse(user)) return user as never;
  const body = await req.json().catch(() => null);
  const code = String(body?.code ?? "").trim().toUpperCase();
  const name = String(body?.name ?? "").trim();
  const state = String(body?.state ?? "").trim();
  const district = String(body?.district ?? "").trim();
  const fieldErrors: Record<string, string> = {};
  if (!/^AICTE-\d{4}$/.test(code)) fieldErrors.code = "Code must match AICTE-#### (demo registry format).";
  if (name.length < 4) fieldErrors.name = "Institution name must be at least 4 characters.";
  if (Object.keys(fieldErrors).length) return err("Validation failed.", 422, { fieldErrors });
  const dupe = await db.institution.findUnique({ where: { code } });
  if (dupe) return err("An institution with this registry code already exists.", 409, { fieldErrors: { code: "Already registered." } });
  const inst = await db.institution.create({
    data: { code, name, state: state || null, district: district || null, dataSource: "OFFICER_ENTERED", isSynthetic: true },
  });
  await audit("INSTITUTION_ADDED", { actorId: user.id, actorEmail: user.email, targetType: "INSTITUTION", targetId: inst.id, summary: `Institution ${code} — ${name} added to the demo registry` });
  return ok({ institution: inst });
}
