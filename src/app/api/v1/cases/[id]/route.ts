import { db } from "@/lib/db";
import { ok, err, requireSession, isNextResponse } from "@/lib/apih";
import { getCaseForUser, projectCase, canActOnCase } from "@/lib/cases";
import { TRANSITIONS, OPEN_STATUSES } from "@/lib/constants";
import { appendAudit } from "@/lib/audit";
import { evaluateCaseDeadlines } from "@/lib/notify";
import { ensureSeed } from "@/lib/seed";
import type { SessionUser } from "@/lib/apih";

// GET /api/v1/cases/:id — full authorized case detail (§8.5)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const kase = await db.case.findUnique({
    where: { id },
    include: {
      institution: { select: { id: true, code: true, name: true } },
      complainant: { select: { id: true, name: true, rollNo: true } },
      assignedOfficer: { select: { id: true, name: true } },
      _count: { select: { events: true, evidenceFiles: true, responses: true } },
    },
  });
  if (!kase) return err("Case not found.", 404);
  if (!canActOnCase(user, kase)) return err("You are not authorized to view this case.", 403);
  return ok({ case: { ...projectCase(kase, user), assignedOfficer: kase.assignedOfficer, _count: kase._count, rollNo: user.id === kase.complainantId ? kase.complainant?.rollNo ?? null : null } });
}

// PATCH /api/v1/cases/:id — permitted field updates + validated status transitions (§6).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const kase = await getCaseForUser(user, id);
  if (!kase) return err("Case not found or not authorized.", 404);
  const roles = [user.primaryRole, ...(JSON.parse(user.rolesJson) as string[]) as string[]];
  const staff = ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER"];
  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  const events: { eventType: string; summary: string; visibility?: string }[] = [];
  const errors: Record<string, string> = {};

  const isComplainantOwner = kase.complainantId === user.id && roles.includes("COMPLAINANT");

  // ── Status transition (state machine enforced server-side) ──
  if (body?.status && body.status !== kase.status) {
    const to = String(body.status);
    const reason = String(body?.reason ?? "").trim();
    const rule = TRANSITIONS[kase.status];
    const allowedByRole = rule?.roles.some((r) => roles.includes(r)) ?? false;
    const complainantReopen = isComplainantOwner && ["RESOLVED"].includes(kase.status) && to === "REOPENED";
    if (!allowedByRole && !complainantReopen) {
      return err(`Transition ${kase.status} → ${to} is not permitted for your role. Allowed from ${kase.status}: ${(rule?.to ?? []).join(", ") || "none"}.`, 403);
    }
    if (!rule?.to.includes(to) && !complainantReopen) {
      return err(`Transition ${kase.status} → ${to} is not allowed by the demo workflow. Allowed: ${(rule?.to ?? []).join(", ") || "none"}.`, 400);
    }
    if (rule?.requireReason && !complainantReopen && reason.length < 5) {
      return err("A reason (min 5 characters) is required for this transition — it is recorded on the case timeline.", 422, { fieldErrors: { reason: "Reason required." } });
    }
    data.status = to;
    if (to === "RESOLVED") data.resolvedAt = new Date();
    if (to === "CLOSED") data.closedAt = new Date();
    if (to === "REOPENED") { data.resolvedAt = null; data.closedAt = null; data.slaBreached = kase.slaBreached; }
    if (to === "ASSIGNED" && !kase.assignedOfficerId && !body?.assignedOfficerId) {
      errors.assignedOfficerId = "Choose an officer — moving to ASSIGNED requires an assignment.";
    }
    events.push({
      eventType: to === "REOPENED" ? "REOPENED" : "STATUS_CHANGED",
      summary: complainantReopen
        ? `Complainant reopened the case. Previous closure is preserved in the history below. ${reason ? `Reason: ${reason}` : ""}`
        : `Status changed ${kase.status} → ${to}${reason ? ` — ${reason}` : ""} (by ${user.primaryRole.replace(/_/g, " ")}).`,
      visibility: to === "REOPENED" ? "PUBLIC" : "INTERNAL",
    });
    await appendAudit("CASE_STATUS_CHANGED", { actorId: user.id, actorEmail: user.email, targetType: "CASE", targetId: kase.id, summary: `Case ${kase.caseNumber}: ${kase.status} → ${to}${reason ? ` — ${reason}` : ""}` });
  }

  // ── Field updates (staff only, within assigned/staff scope) ──
  if (staff.some((r) => roles.includes(r))) {
    if (body?.priority && ["LOW", "NORMAL", "HIGH", "CRITICAL"].includes(body.priority) && body.priority !== kase.priority) {
      data.priority = body.priority;
      events.push({ eventType: "STATUS_CHANGED", summary: `Priority set to ${body.priority} by ${user.name}. Demo SLA window re-evaluated on next save.` });
      await appendAudit("CASE_PRIORITY_CHANGED", { actorId: user.id, targetType: "CASE", targetId: kase.id, summary: `Case ${kase.caseNumber} priority → ${body.priority}` });
    }
    if (body?.bureau !== undefined && body.bureau !== kase.bureau) {
      data.bureau = body.bureau || null;
      events.push({ eventType: "STATUS_CHANGED", summary: `Bureau routing updated to ${body.bureau ? String(body.bureau).replace(/_/g, " ") : "unassigned"} by ${user.name}.` });
    }
    if (body?.category && body.category !== kase.category) {
      data.category = body.category;
      data.categorySource = "OFFICER_SELECTED";
      events.push({ eventType: "STATUS_CHANGED", summary: `Category overridden to ${body.category} by ${user.name} (rule suggestion was ${kase.category}).` });
      await appendAudit("CASE_CATEGORY_OVERRIDDEN", { actorId: user.id, targetType: "CASE", targetId: kase.id, summary: `Case ${kase.caseNumber} category ${kase.category} → ${body.category} (officer override)` });
    }
    if (body?.nextActionLabel !== undefined) {
      data.nextActionLabel = String(body.nextActionLabel).trim() || null;
      data.nextActionState = data.nextActionLabel ? "OPEN" : null;
      if (body?.nextActionDueAt) data.nextActionDueAt = new Date(body.nextActionDueAt);
      if (data.nextActionLabel) events.push({ eventType: "NEXT_ACTION_SET", summary: `Next action set: "${data.nextActionLabel}"${data.nextActionDueAt ? ` (due ${new Date(data.nextActionDueAt as Date).toISOString().slice(0, 10)})` : ""} by ${user.name}.` });
    }
  } else if (Object.keys(body ?? {}).some((k) => ["priority", "bureau", "category", "nextActionLabel"].includes(k))) {
    return err("Your role cannot modify case fields.", 403);
  }

  if (Object.keys(errors).length) return err("Validation failed.", 422, { fieldErrors: errors });
  if (Object.keys(data).length === 0) {
    if (events.length === 0) return err("Nothing to update.", 400);
  }
  if (Object.keys(data).length > 0) {
    await db.case.update({ where: { id: kase.id }, data: data as never });
  }
  for (const e of events) {
    await db.caseEvent.create({ data: { caseId: kase.id, eventType: e.eventType, summary: e.summary, visibility: e.visibility ?? "INTERNAL", actorId: user.id, actorName: user.name } });
  }
  await db.case.update({ where: { id: kase.id }, data: { updatedAt: new Date() } });

  // Pipeline E: re-evaluate deadline state after any save
  await evaluateCaseDeadlines(kase.id, { trigger: "CASE_SAVE" });

  const fresh = await db.case.findUnique({
    where: { id: kase.id },
    include: { institution: { select: { id: true, code: true, name: true } }, complainant: { select: { id: true, name: true } }, assignedOfficer: { select: { id: true, name: true } } },
  });
  return ok({ case: projectCase(fresh!, user as SessionUser) });
}
