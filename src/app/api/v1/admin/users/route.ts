import { db } from "@/lib/db";
import { ok, err, requireRole, isNextResponse } from "@/lib/apih";
import { hashPassword, audit } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

// GET /api/v1/admin/users — demo user management (PLATFORM_ADMIN)
export async function GET() {
  await ensureSeed();
  const user = await requireRole(["PLATFORM_ADMIN"]);
  if (isNextResponse(user)) return user as never;
  const users = await db.user.findMany({
    orderBy: [{ primaryRole: "asc" }, { name: "asc" }],
    include: { institution: { select: { code: true, name: true } } },
  });
  return ok({
    users: users.map((u) => ({
      id: u.id, name: u.name, email: u.email, primaryRole: u.primaryRole, bureau: u.bureau,
      institution: u.institution, isActive: u.isActive, createdAt: u.createdAt,
    })),
  });
}

// POST /api/v1/admin/users — add demo user (least-privilege, role from allowlist)
export async function POST(req: Request) {
  const admin = await requireRole(["PLATFORM_ADMIN"]);
  if (isNextResponse(admin)) return admin as never;
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const role = String(body?.primaryRole ?? "");
  const bureau = body?.bureau ? String(body.bureau) : null;
  const institutionId = body?.institutionId ? String(body.institutionId) : null;
  const password = String(body?.password ?? "");
  const fieldErrors: Record<string, string> = {};
  if (name.length < 3) fieldErrors.name = "Name must be at least 3 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "Enter a valid email.";
  const ALLOWED = ["COMPLAINANT", "INSTITUTION_OFFICER", "INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER", "AUDITOR", "PLATFORM_ADMIN"];
  if (!ALLOWED.includes(role)) fieldErrors.primaryRole = "Pick a valid role.";
  if (password.length < 8) fieldErrors.password = "Password must be at least 8 characters.";
  if (Object.keys(fieldErrors).length) return err("Validation failed.", 422, { fieldErrors });
  const dupe = await db.user.findUnique({ where: { email } });
  if (dupe) return err("A user with this email already exists.", 409, { fieldErrors: { email: "Already registered." } });
  const u = await db.user.create({
    data: { name, email, passwordHash: hashPassword(password), primaryRole: role, rolesJson: JSON.stringify([role]), bureau, institutionId },
  });
  await audit("USER_ADDED", { actorId: admin.id, actorEmail: admin.email, targetType: "USER", targetId: u.id, summary: `Demo user ${email} added with role ${role}` });
  return ok({ user: { id: u.id, email: u.email, primaryRole: u.primaryRole } }, 201);
}
