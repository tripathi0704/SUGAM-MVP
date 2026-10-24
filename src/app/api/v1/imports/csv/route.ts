import { db } from "@/lib/db";
import { ok, err, requireRole, isNextResponse, rateLimit } from "@/lib/apih";
import { appendAudit } from "@/lib/audit";
import { getPolicy } from "@/lib/notify";
import { suggestCategory, detectUrgency, computeDueAt } from "@/lib/automation";
import { CATEGORIES } from "@/lib/constants";
import { ensureSeed } from "@/lib/seed";

// POST /api/v1/imports/csv — Pipeline G: SIMULATED external source import (§4.7).
// Clearly labeled DEMO_CPGRAMS. Source-ID idempotency: re-imports create no duplicates.
export async function POST(req: Request) {
  await ensureSeed();
  const user = await requireRole(["INTAKE_OFFICER", "PLATFORM_ADMIN"]);
  if (isNextResponse(user)) return user as never;
  if (!rateLimit(`import:${user.id}`, 10, 60_000)) return err("Too many import runs. Wait a minute.", 429);
  const body = await req.json().catch(() => null);
  const csv = String(body?.csv ?? "").trim();
  const sourceSystem = String(body?.sourceSystem ?? "DEMO_CPGRAMS");
  const dryRun = !!body?.dryRun;
  if (!csv) return err("Paste CSV rows to import.", 422, { fieldErrors: { csv: "Required." } });
  if (sourceSystem !== "DEMO_CPGRAMS") return err("Only the SIMULATED DEMO_CPGRAMS source is enabled in the demo.", 422);

  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const policy = await getPolicy();
  const routingMapRow = await db.policyConfig.findUnique({ where: { key: "routing_map" } });
  const routeMap = routingMapRow ? JSON.parse(routingMapRow.valueJson) : {};
  const rejected: { row: number; reason: string; data?: string }[] = [];
  const institutions = await db.institution.findMany({ select: { id: true, code: true, name: true } });
  const preview: { sourceRecordId: string; institution: string; subject: string; category: string; priority: string; status: string }[] = [];
  let imported = 0, duplicateSkipped = 0;

  const startedAt = new Date();
  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const [sourceRecordId, instCode, subject, description, categoryRaw] = cols;
    const rowNum = i + 1;
    if (!sourceRecordId || !instCode) { rejected.push({ row: rowNum, reason: "sourceRecordId and institutionCode are required columns", data: lines[i].slice(0, 60) }); continue; }
    if (!subject || subject.length < 8) { rejected.push({ row: rowNum, reason: "Subject missing or too short (min 8 chars)", data: (subject ?? "").slice(0, 40) }); continue; }
    const inst = institutions.find((x) => x.code.toUpperCase() === instCode.toUpperCase());
    if (!inst) { rejected.push({ row: rowNum, reason: `Institution code ${instCode} not found in registry`, data: subject.slice(0, 40) }); continue; }
    const dupe = await db.case.findFirst({ where: { sourceSystem, sourceRecordId } });
    if (dupe) { duplicateSkipped += 1; rejected.push({ row: rowNum, reason: `Idempotency: source record already imported as ${dupe.caseNumber} — skipped (no duplicate case created)`, data: subject.slice(0, 40) }); continue; }
    const text = `${subject} ${description ?? ""}`;
    const catSug = suggestCategory(text);
    const urg = detectUrgency(text);
    const category = categoryRaw && CATEGORIES.includes(categoryRaw as never) ? categoryRaw : catSug?.value ?? "OTHER";
    const priority = urg?.value ?? "NORMAL";
    const dueAt = computeDueAt(priority, { slaDaysByPriority: policy.slaDaysByPriority });
    if (dryRun) {
      preview.push({ sourceRecordId, institution: inst.name, subject: subject.slice(0, 60), category, priority, status: "Would create" });
      continue;
    }
    const counter = await db.counter.upsert({ where: { key: "case_number" }, create: { key: "case_number", value: 1 }, update: { value: { increment: 1 } } });
    const caseNumber = `SUGAM-2026-${String(counter.value).padStart(4, "0")}`;
    const kase = await db.case.create({
      data: {
        caseNumber, sourceSystem, sourceRecordId, institutionId: inst.id, complainantId: null,
        category, categorySource: "IMPORT_NORMALIZED", ruleExplanation: catSug ? `Import normalization: ${catSug.reason}` : null,
        bureau: routeMap[category] ?? "PGRC", subject, description: description ?? subject,
        status: "RECEIVED", priority, slaPolicyVersion: policy.version, dueAt,
        events: {
          create: { eventType: "IMPORTED", summary: `Record imported from ${sourceSystem} (source ID ${sourceRecordId}). Institution matched by registry code ${inst.code}. Import row ${rowNum}.`, visibility: "INTERNAL", actorId: user.id, actorName: user.name },
        },
      },
    });
    imported += 1;
    await appendAudit("IMPORT_ROW_CREATED", { actorId: user.id, targetType: "CASE", targetId: kase.id, summary: `${sourceSystem} import: ${caseNumber} from source ${sourceRecordId}` });
  }

  const status = rejected.length === 0 ? "SUCCESS" : imported > 0 ? "PARTIAL" : "FAILED";
  const run = await db.integrationSyncRun.create({
    data: { sourceSystem, trigger: "MANUAL", status, totalRows: lines.length, importedRows: imported, duplicateSkipped, rejectedRowsJson: JSON.stringify(rejected), startedAt, finishedAt: new Date() },
  });
  await appendAudit("IMPORT_RUN", { actorId: user.id, actorEmail: user.email, summary: `${sourceSystem} ${dryRun ? "preview" : "import"} run: ${lines.length} rows, ${imported} imported, ${duplicateSkipped} duplicate-skipped, ${rejected.length} rejected` });
  return ok({ runId: run.id, status, totalRows: lines.length, importedRows: imported, duplicateSkipped, rejected, preview, disclaimer: "This is a SIMULATED source. No live government system is connected. Production requires official permission, documented API schema, credentials and security review." });
}
