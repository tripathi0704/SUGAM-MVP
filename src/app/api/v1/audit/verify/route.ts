import { ok, requireRole, isNextResponse } from "@/lib/apih";
import { verifyChain } from "@/lib/audit";
import { appendAudit } from "@/lib/audit";
import { ensureSeed } from "@/lib/seed";

// GET /api/v1/audit/verify — bounded hash-chain integrity check (§9 Day 13).
// The UI says "hash-chain integrity check" — never "unhackable" or "blockchain".
export async function GET() {
  await ensureSeed();
  const user = await requireRole(["AUDITOR", "REVIEWING_OFFICER", "PLATFORM_ADMIN"]);
  if (isNextResponse(user)) return user as never;
  const result = await verifyChain();
  if (!result.valid) {
    await appendAudit("AUDIT_VERIFY_FAILED", { actorId: user.id, summary: `Integrity check FAILED at sequence ${result.brokenAtSequence}: ${result.reason}` });
  }
  return ok({
    ...result,
    method: "Recomputed SHA-256 over each event's canonical content and compared with the stored eventHash and its previousHash link.",
    disclaimer: "A hash chain deters silent tampering. It is not absolute tamper-proof storage — production requires restricted write access, checkpoints and independent verification.",
  });
}
