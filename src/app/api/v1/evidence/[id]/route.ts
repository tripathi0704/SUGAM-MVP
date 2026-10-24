import { db } from "@/lib/db";
import { ok, err, requireSession, isNextResponse } from "@/lib/apih";
import { canActOnCase } from "@/lib/cases";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const STORAGE = process.env.UPLOAD_STORAGE_DIR || path.join(process.cwd(), "private-uploads");

// GET /api/v1/evidence/:id — authorized private download (never a public static path)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  const meta = await db.evidenceFile.findUnique({ where: { id }, include: { case: true } });
  if (!meta) return err("Evidence not found.", 404);
  if (!canActOnCase(user, meta.case)) return err("Not authorized for this evidence.", 403);
  const roles = [user.primaryRole, ...(JSON.parse(user.rolesJson) as string[])];
  const isOfficer = ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER", "AUDITOR", "PLATFORM_ADMIN"].some((r) => roles.includes(r));
  if (meta.accessLevel === "OFFICERS_ONLY" && !isOfficer) return err("This evidence is restricted to officers.", 403);
  const filePath = path.join(STORAGE, meta.storageKey);
  if (!fs.existsSync(filePath)) return err("File missing from private storage.", 410);
  const buf = await fs.promises.readFile(filePath);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": meta.mimeType,
      "Content-Disposition": `attachment; filename="${meta.originalFileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
