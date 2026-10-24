// Server-side API helpers: response envelope, guards, pagination, rate limiting.
// Security invariant: hiding a button in the UI is not authorization — every
// protected route re-checks session + role + case scope here on the server.
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import type { Role } from "@/lib/constants";

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

let reqCounter = 0;
export function newRequestId(): string {
  reqCounter += 1;
  return `req_${Date.now().toString(36)}_${reqCounter.toString(36)}`;
}

export function ok<T extends object>(data: T, init?: number) {
  return NextResponse.json({ success: true, data }, { status: init ?? 200 });
}

export function err(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: { message, ...extra } }, { status });
}

export async function requireSession(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return err("Authentication required. Please sign in.", 401);
  return user;
}

export async function requireRole(roles: Role[]): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return err("Authentication required. Please sign in.", 401);
  const userRoles = JSON.parse(user.rolesJson) as string[];
  if (!roles.includes(user.primaryRole as Role) && !roles.some((r) => userRoles.includes(r))) {
    return err("Your role is not authorized for this action.", 403);
  }
  return user;
}

export function isNextResponse(x: unknown): x is NextResponse {
  return typeof NextResponse === "function" && x instanceof NextResponse;
}

// Simple in-memory rate limiter for sensitive endpoints (login, imports, demo reset)
const buckets = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

export function parsePaging(url: string, defSize = 10) {
  const sp = new URL(url).searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(sp.get("pageSize") ?? String(defSize), 10) || defSize));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize, sp };
}

// Staff roles: can see officer-side projections (complainant identity gated)
export const STAFF_ROLES: Role[] = ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER", "AUDITOR", "PLATFORM_ADMIN"];
export const CASE_ACTION_ROLES: Role[] = ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER"];
