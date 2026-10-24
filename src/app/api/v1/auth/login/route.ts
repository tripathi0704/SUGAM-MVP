import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setAuthCookie, signToken, publicUser } from "@/lib/auth";
import { ok, err, rateLimit, newRequestId } from "@/lib/apih";
import { ensureSeed } from "@/lib/seed";
import { appendAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  await ensureSeed();
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`login:${ip}`, 30, 60_000)) {
    return err("Too many sign-in attempts. Please wait a minute and try again.", 429);
  }
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!email || !password) return err("Email and password are required.", 422);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err("Enter a valid email address.", 422);

  const requestId = newRequestId();
  const user = await db.user.findUnique({ where: { email }, include: { institution: { select: { id: true, code: true, name: true } } } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    await appendAudit("LOGIN_FAILED", { actorEmail: email, summary: "Sign-in failed: invalid credentials", requestId });
    return err("Invalid email or password.", 401);
  }
  if (!user.isActive) {
    await appendAudit("LOGIN_BLOCKED", { actorEmail: email, summary: "Sign-in blocked: account deactivated", requestId });
    return err("This account has been deactivated. Contact the platform admin.", 403);
  }
  const token = signToken({ uid: user.id, role: user.primaryRole });
  const res = ok({ user: publicUser(user), requestId }) as NextResponse;
  setAuthCookie(res, token);
  await appendAudit("LOGIN", { actorId: user.id, actorEmail: user.email, summary: `Signed in as ${user.primaryRole}`, requestId });
  return res;
}
