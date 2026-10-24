import crypto from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { db } from "@/lib/db";

const SECRET = process.env.AUTH_SECRET || "sugam-dev-secret-change-in-production";
const COOKIE = "sugam_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// ---- Password hashing (scrypt, no external deps) ----
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

// ---- Token (HMAC-signed, JWT-style) ----
function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function signToken(payload: { uid: string; role: string }): string {
  const body = { ...payload, exp: Date.now() + MAX_AGE * 1000 };
  const data = b64url(JSON.stringify(body));
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token: string): { uid: string; role: string } | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const body = JSON.parse(Buffer.from(data, "base64url").toString());
    if (!body.exp || body.exp < Date.now()) return null;
    return { uid: body.uid, role: body.role };
  } catch {
    return null;
  }
}

export async function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAuthCookie(res: NextResponse) {
  res.cookies.set(COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

// ---- Session user ----
export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await db.user.findUnique({ where: { id: payload.uid }, include: { institution: true } });
  if (!user || !user.isActive) return null;
  return user;
}

export function publicUser(u: {
  id: string; name: string; email: string; primaryRole: string; rolesJson: string; phone: string | null;
  rollNo: string | null; designation: string | null; bureau: string | null;
  institutionId: string | null; institution?: { id: string; code: string; name: string } | null;
}) {
  return {
    id: u.id, name: u.name, email: u.email, primaryRole: u.primaryRole,
    roles: JSON.parse(u.rolesJson) as string[], phone: u.phone,
    rollNo: u.rollNo, designation: u.designation, bureau: u.bureau,
    institutionId: u.institutionId,
    institution: u.institution ? { id: u.institution.id, code: u.institution.code, name: u.institution.name } : null,
  };
}

export async function audit(action: string, opts: { actorId?: string; actorEmail?: string; targetType?: string; targetId?: string; summary?: string; metadata?: Record<string, unknown> }) {
  const { appendAudit } = await import("@/lib/audit");
  await appendAudit(action, opts);
}
