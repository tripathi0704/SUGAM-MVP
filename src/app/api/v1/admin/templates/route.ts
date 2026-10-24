import { db } from "@/lib/db";
import { ok, err, requireRole, isNextResponse } from "@/lib/apih";
import { audit } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

// GET /api/v1/admin/templates — pre-defined response formats (college automation aid)
export async function GET() {
  await ensureSeed();
  const user = await requireSession0();
  const templates = await db.replyTemplate.findMany({ orderBy: { title: "asc" } });
  return ok({ templates });
}
async function requireSession0() {
  const r = await requireRole(["INSTITUTION_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER", "INTAKE_OFFICER", "PLATFORM_ADMIN"]);
  if (isNextResponse(r)) return r as never;
  return r;
}

// POST /api/v1/admin/templates — admin adds a pre-defined format
export async function POST(req: Request) {
  const admin = await requireRole(["PLATFORM_ADMIN"]);
  if (isNextResponse(admin)) return admin as never;
  const body = await req.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const category = body?.category ? String(body.category) : null;
  const text = String(body?.body ?? "").trim();
  const fieldErrors: Record<string, string> = {};
  if (title.length < 4) fieldErrors.title = "Title must be at least 4 characters.";
  if (text.length < 30) fieldErrors.body = "Template body must be at least 30 characters.";
  if (Object.keys(fieldErrors).length) return err("Validation failed.", 422, { fieldErrors });
  const t = await db.replyTemplate.create({ data: { title, category, body: text } });
  await audit("TEMPLATE_ADDED", { actorId: admin.id, actorEmail: admin.email, summary: `Pre-defined format "${title}" added` });
  return ok({ template: t }, 201);
}
