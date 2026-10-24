import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireSession, isNextResponse, newRequestId } from "@/lib/apih";
import { canActOnCase } from "@/lib/cases";
import { appendAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { ensureSeed } from "@/lib/seed";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// GET /api/v1/cases/:id/evidence — authorized evidence metadata list
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const kase = await db.case.findUnique({ where: { id } });
  if (!kase) return err("Case not found.", 404);
  if (!canActOnCase(user, kase)) return err("Not authorized.", 403);
  const roles = [user.primaryRole, ...(JSON.parse(user.rolesJson) as string[])];
  const isOfficer = ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER", "AUDITOR", "PLATFORM_ADMIN"].some((r) => roles.includes(r));
  const evidence = await db.evidenceFile.findMany({
    where: { caseId: id, ...(isOfficer ? {} : { accessLevel: "CASE_PARTIES" }) },
    orderBy: { createdAt: "desc" },
  });
  return ok({
    evidence: evidence.map((e) => ({
      id: e.id, caseId: e.caseId, originalFileName: e.originalFileName, mimeType: e.mimeType,
      sizeBytes: e.sizeBytes, uploaderName: e.uploaderName, uploaderRole: e.uploaderRole,
      accessLevel: e.accessLevel, verificationState: e.verificationState, createdAt: e.createdAt,
    })),
  });
}

// POST /api/v1/cases/:id/evidence — multipart upload (Pipeline F).
// Files live in PRIVATE storage; only metadata goes to the database.
const STORAGE = process.env.UPLOAD_STORAGE_DIR || path.join(process.cwd(), "private-uploads");
const ALLOWED = ["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain"];
const MAX_BYTES = parseInt(process.env.UPLOAD_MAX_BYTES ?? "10485760", 10);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const kase = await db.case.findUnique({ where: { id } });
  if (!kase) return err("Case not found.", 404);
  if (!canActOnCase(user, kase)) return err("Not authorized.", 403);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const accessLevel = String(form?.get("accessLevel") ?? "CASE_PARTIES");
  if (!(file instanceof File)) return err("Attach a file to upload.", 422);
  if (!ALLOWED.includes(file.type)) return err(`Unsupported file type (${file.type || "unknown"}). Allowed: PDF, PNG, JPEG, WEBP, TXT. Production requires malware scanning.`, 422);
  if (file.size <= 0 || file.size > MAX_BYTES) return err(`File must be between 1 byte and ${Math.round(MAX_BYTES / 1048576)} MB.`, 422);
  if (!["CASE_PARTIES", "OFFICERS_ONLY"].includes(accessLevel)) return err("Invalid access level.", 422);

  await fs.promises.mkdir(STORAGE, { recursive: true });
  const storageKey = `${crypto.randomUUID()}${path.extname(file.name).slice(0, 10)}`;
  await fs.promises.writeFile(path.join(STORAGE, storageKey), Buffer.from(await file.arrayBuffer()));

  const meta = await db.evidenceFile.create({
    data: {
      caseId: id, storageKey, originalFileName: file.name.slice(0, 120), mimeType: file.type,
      sizeBytes: file.size, uploadedById: user.id, uploaderName: user.name, uploaderRole: user.primaryRole,
      accessLevel, verificationState: "UNVERIFIED",
    },
  });
  await db.caseEvent.create({
    data: {
      caseId: id, eventType: "EVIDENCE_ADDED", visibility: accessLevel === "OFFICERS_ONLY" ? "INTERNAL" : "PUBLIC",
      actorId: user.id, actorName: user.name,
      summary: `Evidence attached: "${file.name}" (${Math.max(1, Math.round(file.size / 1024))} KB, ${file.type}). Status UNVERIFIED — a human must verify the content before it is treated as proof.`,
    },
  });
  await db.case.update({ where: { id }, data: { updatedAt: new Date() } });
  await appendAudit("EVIDENCE_ADDED", { actorId: user.id, actorEmail: user.email, targetType: "CASE", targetId: id, requestId: newRequestId(), summary: `Evidence "${file.name}" attached to ${kase.caseNumber} (${accessLevel})` });
  if (kase.assignedOfficerId && kase.assignedOfficerId !== user.id) {
    await notify(kase.assignedOfficerId, { caseId: id, type: "RESPONSE_ADDED", title: `Evidence attached on ${kase.caseNumber}`, message: `${user.name} attached "${file.name}".` });
  }
  return ok({ evidence: { id: meta.id, originalFileName: meta.originalFileName, mimeType: meta.mimeType, sizeBytes: meta.sizeBytes, verificationState: meta.verificationState } }, 201);
}
