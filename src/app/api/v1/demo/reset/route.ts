import { db } from "@/lib/db";
import { ok, err, requireRole, isNextResponse, rateLimit } from "@/lib/apih";
import { appendAudit } from "@/lib/audit";
import { ensureSeed, resetSeedSingleton } from "@/lib/seed";
import fs from "fs";

// POST /api/v1/demo/reset — reset synthetic demo data (demo environment only)
export async function POST() {
  const user = await requireRole(["PLATFORM_ADMIN"]);
  if (isNextResponse(user)) return user as never;
  if (process.env.DEMO_MODE === "false") return err("Demo reset is disabled outside demo environments.", 403);
  if (!rateLimit(`reset:${user.id}`, 3, 60_000)) return err("Too many resets. Wait a minute.", 429);
  const oldSeq = await db.auditEvent.count();
  await db.notification.deleteMany({});
  await db.duplicateSuggestion.deleteMany({});
  await db.evidenceFile.deleteMany({});
  await db.caseResponse.deleteMany({});
  await db.assignment.deleteMany({});
  await db.caseEvent.deleteMany({});
  await db.internalReport.deleteMany({});
  await db.case.deleteMany({});
  await db.integrationSyncRun.deleteMany({});
  await db.replyTemplate.deleteMany({});
  await db.policyConfig.deleteMany({});
  await db.counter.deleteMany({});
  await db.user.deleteMany({});
  await db.institution.deleteMany({});
  // fresh chain (audit is append-only by design; demo reset recreates a clean dataset)
  await db.auditEvent.deleteMany({});
  try { fs.rmSync(process.env.UPLOAD_STORAGE_DIR || "private-uploads", { recursive: true, force: true }); } catch { /* noop */ }
  resetSeedSingleton();
  await ensureSeed();
  await appendAudit("DEMO_RESET", { actorId: user.id, actorEmail: user.email, summary: `Demo dataset reset (previous chain had ${oldSeq} events). Fresh synthetic dataset created.` });
  return ok({ reset: true });
}
