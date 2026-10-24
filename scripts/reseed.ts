import { db } from "../src/lib/db";
import { ensureSeed, resetSeedSingleton } from "../src/lib/seed";
import fs from "fs";

async function run() {
  console.log("Clearing all old seed records...");
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
  await db.auditEvent.deleteMany({});
  try { fs.rmSync("private-uploads", { recursive: true, force: true }); } catch { /* noop */ }
  resetSeedSingleton();

  console.log("Running fresh ensureSeed()...");
  await ensureSeed();
  console.log("Done! Checking seeded institutions and cases:");

  const institutions = await db.institution.findMany({ select: { code: true, name: true, permanentId: true, region: true } });
  institutions.forEach(i => console.log(` - ${i.code} [PID: ${i.permanentId}] ${i.name} (${i.region})`));

  const cases = await db.case.findMany({ select: { caseNumber: true, subject: true, bureau: true, overlapFlag: true } });
  cases.forEach(c => console.log(` - ${c.caseNumber} [${c.bureau}] Overlap: ${c.overlapFlag} - ${c.subject}`));

  const users = await db.user.findMany({ select: { email: true, name: true, bureau: true, primaryRole: true } });
  users.forEach(u => console.log(` - ${u.email} (${u.name}, ${u.bureau})`));
}

run().catch(console.error).finally(() => db.$disconnect());
