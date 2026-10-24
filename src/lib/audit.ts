// SHA-256 hash-linked audit chain (SUGAM 2.0 §5.3, §13).
// appendAudit() is the ONLY writer; verifyChain() recomputes hashes.
// Note: a hash chain deters tampering but is not absolute tamper-proof storage —
// production requires restricted write access, checkpoints and independent verification.
import crypto from "crypto";
import { db } from "@/lib/db";

function canonical(a: {
  sequence: number; action: string; actorId: string | null; actorEmail: string | null;
  targetType: string | null; targetId: string | null; summary: string; requestId: string | null;
  metadataJson: string; previousHash: string; createdAt: string;
}): string {
  return JSON.stringify({
    s: a.sequence, a: a.action, u: a.actorId, e: a.actorEmail, t: a.targetType,
    i: a.targetId, m: a.summary, r: a.requestId, x: a.metadataJson, p: a.previousHash, d: a.createdAt,
  });
}

export async function appendAudit(action: string, opts: {
  actorId?: string; actorEmail?: string; targetType?: string; targetId?: string;
  summary?: string; requestId?: string; metadata?: Record<string, unknown>;
}) {
  const last = await db.auditEvent.findFirst({ orderBy: { sequence: "desc" }, select: { sequence: true, eventHash: true } });
  const sequence = (last?.sequence ?? 0) + 1;
  const previousHash = last?.eventHash ?? "GENESIS";
  const createdAt = new Date();
  const metadataJson = JSON.stringify(opts.metadata ?? {});
  const eventHash = crypto
    .createHash("sha256")
    .update(canonical({
      sequence, action,
      actorId: opts.actorId ?? null, actorEmail: opts.actorEmail ?? null,
      targetType: opts.targetType ?? null, targetId: opts.targetId ?? null,
      summary: opts.summary ?? action, requestId: opts.requestId ?? null,
      metadataJson, previousHash, createdAt: createdAt.toISOString(),
    }))
    .digest("hex");
  return db.auditEvent.create({
    data: {
      sequence, action, actorId: opts.actorId ?? null, actorEmail: opts.actorEmail ?? null,
      targetType: opts.targetType ?? null, targetId: opts.targetId ?? null,
      summary: opts.summary ?? action, requestId: opts.requestId ?? null,
      metadataJson, previousHash, eventHash, createdAt,
    },
  });
}

export interface VerifyResult {
  valid: boolean; checked: number; brokenAtSequence: number | null; reason: string | null;
}

export async function verifyChain(): Promise<VerifyResult> {
  const events = await db.auditEvent.findMany({ orderBy: { sequence: "asc" } });
  let prevHash = "GENESIS";
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.sequence !== i + 1) {
      return { valid: false, checked: i, brokenAtSequence: e.sequence, reason: "Sequence gap detected — an event may have been removed." };
    }
    if (e.previousHash !== prevHash) {
      return { valid: false, checked: i, brokenAtSequence: e.sequence, reason: "Link mismatch: event does not reference the previous event's hash." };
    }
    const recomputed = crypto
      .createHash("sha256")
      .update(canonical({
        sequence: e.sequence, action: e.action, actorId: e.actorId, actorEmail: e.actorEmail,
        targetType: e.targetType, targetId: e.targetId, summary: e.summary, requestId: e.requestId,
        metadataJson: e.metadataJson, previousHash: e.previousHash, createdAt: e.createdAt.toISOString(),
      }))
      .digest("hex");
    if (recomputed !== e.eventHash) {
      return { valid: false, checked: i + 1, brokenAtSequence: e.sequence, reason: "Hash mismatch: event content was modified after it was recorded." };
    }
    prevHash = e.eventHash;
  }
  return { valid: true, checked: events.length, brokenAtSequence: null, reason: null };
}
