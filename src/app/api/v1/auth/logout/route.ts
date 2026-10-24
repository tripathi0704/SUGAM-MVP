import { NextResponse } from "next/server";
import { clearAuthCookie, getSessionUser } from "@/lib/auth";
import { appendAudit } from "@/lib/audit";

export async function POST() {
  const user = await getSessionUser().catch(() => null);
  if (user) await appendAudit("LOGOUT", { actorId: user.id, actorEmail: user.email, summary: "Signed out" });
  const res = NextResponse.json({ success: true, data: {} });
  clearAuthCookie(res);
  return res;
}
