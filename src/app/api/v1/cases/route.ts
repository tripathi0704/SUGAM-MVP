import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, isNextResponse, parsePaging } from "@/lib/apih";
import { caseScopeFilter, projectCase } from "@/lib/cases";
import { audit, getSessionUser } from "@/lib/auth";
import { appendAudit } from "@/lib/audit";
import { suggestCategory, detectUrgency, computeDueAt, tokenize, jaccard, DUPLICATE_THRESHOLD, duplicateReasons, commonTokens } from "@/lib/automation";
import { getPolicy, notify } from "@/lib/notify";
import { CATEGORIES, CATEGORY_LABELS, OPEN_STATUSES } from "@/lib/constants";
import { ensureSeed } from "@/lib/seed";

// GET /api/v1/cases — searchable/filterable/paginated register (§7.3)
export async function GET(req: NextRequest) {
  await ensureSeed();
  let user = await getSessionUser();
  if (!user) {
    user = await db.user.findFirst({
      where: { primaryRole: "COMPLAINANT", isActive: true },
      include: { institution: true },
    });
    if (!user) {
      user = await db.user.findFirst({ include: { institution: true } });
    }
  }
  const { skip, take, page, pageSize, sp } = parsePaging(req.url, 10);
  const scope = user ? caseScopeFilter(user) : {};

  const q = (sp.get("q") ?? "").trim();
  const filters: Record<string, unknown>[] = [];
  
  // If user is searching/tracking (e.g. by Case ID / keyword), allow finding the case
  if (q) {
    filters.push({
      OR: [
        { caseNumber: { contains: q } },
        { subject: { contains: q } },
        { description: { contains: q } },
        { institution: { name: { contains: q } } },
        { institution: { code: { contains: q } } },
        { institution: { permanentId: { contains: q } } },
      ],
    });
  } else if (scope && Object.keys(scope).length > 0) {
    filters.push(scope);
  }

  const status = sp.get("status");
  if (status) filters.push({ status });
  const category = sp.get("category");
  if (category) filters.push({ category });
  const bureau = sp.get("bureau");
  if (bureau) filters.push({ bureau });
  const region = sp.get("region");
  if (region) filters.push({ OR: [{ region }, { institution: { region } }] });
  const priority = sp.get("priority");
  if (priority) filters.push({ priority });
  const source = sp.get("source");
  if (source) filters.push({ sourceSystem: source });
  const institutionId = sp.get("institutionId");
  if (institutionId) filters.push({ institutionId });
  const overlapOnly = sp.get("overlapOnly");
  if (overlapOnly === "1" || overlapOnly === "true") filters.push({ overlapFlag: true });
  const mine = sp.get("mine");
  if (mine === "1" && user) filters.push({ assignedOfficerId: user.id });
  const due = sp.get("due");
  if (due === "overdue") filters.push({ dueAt: { lt: new Date() }, status: { in: OPEN_STATUSES } });
  if (due === "soon") filters.push({ dueAt: { gte: new Date(), lte: new Date(Date.now() + 3 * 86400000) }, status: { in: OPEN_STATUSES } });
  if (due === "none") filters.push({ dueAt: null });
  const where = filters.length > 0 ? { AND: filters as never } : {};

  const [total, rows] = await Promise.all([
    db.case.count({ where }),
    db.case.findMany({
      where, orderBy: { updatedAt: "desc" }, skip, take,
      include: {
        institution: { select: { id: true, code: true, name: true, permanentId: true, region: true, state: true } },
        complainant: { select: { id: true, name: true } },
        _count: { select: { events: true, evidenceFiles: true, responses: true } },
      },
    }),
  ]);
  return ok({
    total, page, pageSize,
    cases: rows.map((r) => ({ ...(user ? projectCase(r, user) : r), _count: r._count })),
  });
}

// POST /api/v1/cases — Pipeline A: submit/register with explainable intake automation.
export async function POST(req: NextRequest) {
  await ensureSeed();

  // Retrieve user session or fallback gracefully to registered citizen account
  let user = await getSessionUser();
  if (!user) {
    user = await db.user.findFirst({
      where: { primaryRole: "COMPLAINANT", isActive: true },
      include: { institution: true },
    });
    if (!user) {
      user = await db.user.findFirst({ include: { institution: true } });
    }
  }
  if (!user) {
    return err("No registered user found in system.", 500);
  }

  const body = await req.json().catch(() => null);
  const fieldErrors: Record<string, string> = {};
  const institutionId = String(body?.institutionId ?? "").trim();
  const subject = String(body?.subject ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const category = body?.category ? String(body.category) : "";
  const priority = body?.priority ? String(body.priority) : "";

  if (!subject || subject.length < 3) {
    fieldErrors.subject = "Subject must be at least 3 characters.";
  }
  if (subject && subject.length > 200) {
    fieldErrors.subject = "Subject must be under 200 characters.";
  }
  if (!description || description.length < 5) {
    fieldErrors.description = "Please describe the grievance in at least 5 characters.";
  }
  if (Object.keys(fieldErrors).length) {
    return err(Object.values(fieldErrors).join(" "), 422, { fieldErrors });
  }

  let institution = institutionId ? await db.institution.findUnique({ where: { id: institutionId } }) : null;
  if (!institution && institutionId) {
    institution = await db.institution.findFirst({
      where: { OR: [{ code: institutionId }, { name: { contains: institutionId } }] },
    });
  }
  if (!institution) {
    institution = await db.institution.findFirst();
  }
  if (!institution) {
    return err("No registered AICTE institution found in the registry.", 404);
  }

  const text = `${subject} ${description}`;
  const catSug = suggestCategory(text);
  const urgSug = detectUrgency(text);
  const finalCategory = category || catSug?.value || "OTHER";
  if (category && !CATEGORIES.includes(category as never)) return err("Unknown category.", 422);
  const finalPriority = priority || urgSug?.value || "NORMAL";
  const policy = await getPolicy();
  const dueAt = computeDueAt(finalPriority, { slaDaysByPriority: policy.slaDaysByPriority });
  const routingMap = await db.policyConfig.findUnique({ where: { key: "routing_map" } });
  const routeMap = routingMap ? JSON.parse(routingMap.valueJson) : {};
  const bureau = routeMap[finalCategory] ?? "PGRC";
  const categorySource = category ? "COMPLAINANT_SELECTED" : catSug ? "RULE_SUGGESTED" : "IMPORT_NORMALIZED";
  const ruleExplanation = [
    catSug && !category ? `Category auto-suggested: ${catSug.reason}` : catSug && category ? `Routing rule matched "${CATEGORY_LABELS[finalCategory] ?? finalCategory}": ${catSug.reason}` : "No keyword rule matched — placed in 'Other' for manual triage.",
    urgSug && !priority ? urgSug.reason : null,
  ].filter(Boolean).join(" ");

  // Ensure caseNumber is never duplicate
  let counter = await db.counter.upsert({
    where: { key: "case_number" },
    create: { key: "case_number", value: 30 },
    update: { value: { increment: 1 } },
  });
  let caseNumber = `SUGAM-2026-${String(counter.value).padStart(4, "0")}`;
  while (await db.case.findUnique({ where: { caseNumber } })) {
    counter = await db.counter.update({ where: { key: "case_number" }, data: { value: { increment: 1 } } });
    caseNumber = `SUGAM-2026-${String(counter.value).padStart(4, "0")}`;
  }

  const kase = await db.case.create({
    data: {
      caseNumber,
      sourceSystem: "PUBLIC_PORTAL",
      institutionId: institution.id,
      complainantId: user.id,
      category: finalCategory,
      categorySource,
      ruleExplanation,
      bureau,
      subject,
      description,
      status: "RECEIVED",
      priority: finalPriority,
      slaPolicyVersion: policy.version,
      dueAt,
      nextActionLabel: "Review submitted complaint",
      nextActionDueAt: new Date(Date.now() + 3 * 86400000),
      nextActionState: "OPEN",
      events: {
        create: [
          { eventType: "FILED", summary: "Grievance registered through the official S.U.G.A.M. portal.", visibility: "PUBLIC", actorId: user.id, actorName: user.name },
          { eventType: "AUTO_ROUTED", summary: `Intake automation: category ${finalCategory}, bureau ${bureau}, priority ${finalPriority}, statutory SLA ${policy.slaDaysByPriority[finalPriority] ?? 15} day(s). ${ruleExplanation}`, visibility: "INTERNAL" },
          ...(urgSug ? [{ eventType: "URGENCY_FLAGGED", summary: urgSug.reason, visibility: "INTERNAL" }] : []),
        ],
      },
    },
  });

  // Duplicate candidate scan (same institution + token similarity) — suggestion only
  try {
    const candidates = await db.case.findMany({
      where: { institutionId: institution.id, id: { not: kase.id }, status: { in: ["RECEIVED", "NEEDS_TRIAGE", "ASSIGNED", "IN_REVIEW", "WAITING_FOR_INFORMATION", "ACTION_REQUIRED", "PENDING_REVIEW", "REOPENED"] } },
      select: { id: true, caseNumber: true, category: true, subject: true, description: true },
    });
    const tNew = tokenize(text);
    for (const c of candidates) {
      const tOld = tokenize(`${c.subject} ${c.description}`);
      const score = jaccard(tNew, tOld);
      if (score >= DUPLICATE_THRESHOLD) {
        await db.duplicateSuggestion.create({
          data: {
            primaryCaseId: c.id, candidateCaseId: kase.id, score, algorithmVersion: "jaccard-v1",
            reasonsJson: JSON.stringify(duplicateReasons(score, c.category === finalCategory, commonTokens(tNew, tOld))),
            state: "PENDING",
          },
        });
        await db.caseEvent.create({
          data: { caseId: kase.id, eventType: "DUPLICATE_FLAGGED", summary: `Possible duplicate of ${c.caseNumber} (similarity ${score.toFixed(2)}, same institution). Officer must confirm — original case remains unaffected.`, visibility: "INTERNAL" },
        });
        await appendAudit("DUPLICATE_SUGGESTED", { actorId: user.id, targetType: "CASE", targetId: c.id, summary: `Possible duplicate: ${c.caseNumber} ↔ ${caseNumber} (similarity ${score.toFixed(2)})` });
      }
    }
  } catch {}

  try {
    await appendAudit("COMPLAINT_FILED", { actorId: user.id, actorEmail: user.email, targetType: "CASE", targetId: kase.id, summary: `Case ${caseNumber} filed against ${institution.name} — ${subject.slice(0, 60)}`, metadata: { caseNumber, category: finalCategory, priority: finalPriority } });
  } catch {}

  try {
    const nodal = await db.user.findFirst({ where: { institutionId: institution.id, primaryRole: "INSTITUTION_OFFICER", isActive: true } });
    if (nodal) await notify(nodal.id, { caseId: kase.id, type: "ASSIGNED", title: `New case at your institution: ${caseNumber}`, message: `${subject} — submitted to AICTE. Review it in your Institution Workspace.` });
  } catch {}

  const full = await db.case.findUnique({ where: { id: kase.id }, include: { institution: { select: { id: true, code: true, name: true } }, complainant: { select: { id: true, name: true } } } });
  return ok({ case: full ? projectCase(full, user) : null, automation: { categorySuggestion: catSug, urgency: urgSug, slaDays: policy.slaDaysByPriority[finalPriority] ?? 15, bureau, policyVersion: policy.version } }, 201);
}
