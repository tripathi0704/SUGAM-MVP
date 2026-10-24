import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/v1/health — liveness + database connectivity (no secrets in logs)
export async function GET() {
  let database = "unknown";
  try {
    await db.case.count();
    database = "connected";
  } catch {
    database = "unavailable";
  }
  return NextResponse.json({
    success: true,
    data: { service: "S.U.G.A.M. API", version: "2.0", status: "ok", database, time: new Date().toISOString() },
  });
}
