// S.U.G.A.M. automation engine — explainable, human-in-the-loop (§4 Pipelines).
// Every suggestion returns {value, confidence?, reason} so officers see WHY a rule fired.
// Nothing here auto-rejects, auto-merges, or legally closes a complaint.

export interface RuleSuggestion<T = string> {
  value: T;
  confidence: number; // 0-1 estimate against demo rules only
  reason: string; // explainable automation (§1.3)
}

// ── Pipeline A: intake category/bureau suggestion (demo rule map, configurable) ──
const CATEGORY_RULES: { category: string; bureau: string; terms: string[] }[] = [
  { category: "CAPITATION_FEE", bureau: "REGULATION_BUREAU", terms: ["capitation", "donation", "excess fee", "donation fee", "bribe", "illegal fee", "overcharging"] },
  { category: "UNAUTHORIZED_COURSE", bureau: "REGULATION_BUREAU", terms: ["unapproved", "unauthorized", "unapproved course", "intake expansion", "illegal branch", "without aicte approval"] },
  { category: "FACULTY_NORMS", bureau: "REGULATION_BUREAU", terms: ["faculty norms", "salary non-payment", "salary delayed", "pf not deposited", "qualification norms", "cadre ratio"] },
  { category: "FEE_REFUND", bureau: "REGULATION_BUREAU", terms: ["fee refund", "refund delayed", "caution deposit", "retention of original certificates", "certificates not returned", "refund policy"] },
  { category: "STUDENT_GRIEVANCE", bureau: "PGRC", terms: ["harassment", "mental harassment", "victimization", "crying", "discrimination", "internal committee", "grievance", "student welfare"] },
  { category: "RAGGING", bureau: "ANTI_RAGGING_CELL", terms: ["ragging", "ragged", "harassment", "assault", "threat", "threatening", "bully", "bullying", "violence", "abuse"] },
  { category: "SCHOLARSHIP", bureau: "SCHOLARSHIP_CELL", terms: ["scholarship", "stipend", "nsp", "freeship", "grant disbursal", "disbursement"] },
  { category: "FACULTY_SALARY", bureau: "FACULTY_CELL", terms: ["salary", "payroll", "wages", "remuneration", "pf", "provident fund", "appraisal"] },
  { category: "APPROVAL_DOC", bureau: "APPROVAL_BUREAU", terms: ["approval", "affiliation", "eoa", "extension of approval", "certificate", "bonafide", "migration", "document verification", "aicte approval"] },
  { category: "HOSTEL", bureau: "PGRC", terms: ["hostel", "mess", "canteen", "warden", "accommodation", "sanitation", "washroom", "water"] },
  { category: "EXAM_CELL", bureau: "EXAM_CELL", terms: ["exam", "examination", "result", "revaluation", "marks", "transcript", "grade card", "answer sheet"] },
  { category: "INFRASTRUCTURE", bureau: "PGRC", terms: ["classroom", "lab", "laboratory", "library", "building", "lift", "electric", "wifi", "internet", "equipment"] },
];

export function suggestCategory(text: string): RuleSuggestion | null {
  const t = ` ${text.toLowerCase()} `;
  let best: { rule: (typeof CATEGORY_RULES)[number]; hits: string[] } | null = null;
  for (const rule of CATEGORY_RULES) {
    const hits = rule.terms.filter((term) => t.includes(term));
    if (hits.length > 0 && (!best || hits.length > best.hits.length)) best = { rule, hits };
  }
  if (!best) return null;
  return {
    value: best.rule.category,
    confidence: Math.min(0.95, 0.55 + best.hits.length * 0.15),
    reason: `Matched terms [${best.hits.slice(0, 4).map((h) => `"${h}"`).join(", ")}] → ${best.rule.category} routed to ${best.rule.bureau.replace(/_/g, " ")}. Officer can override.`,
  };
}

// ── Urgency detection (demo keywords → CRITICAL priority + shorter SLA window) ──
export const URGENT_TERMS = ["ragging", "ragged", "harassment", "assault", "suicide", "self-harm", "threat to life", "sexual", "violence", "emergency", "medical emergency", "safety"];

export function detectUrgency(text: string): RuleSuggestion<"CRITICAL" | "NORMAL"> | null {
  const t = text.toLowerCase();
  const hits = URGENT_TERMS.filter((term) => t.includes(term));
  if (hits.length === 0) return null;
  return {
    value: "CRITICAL",
    confidence: Math.min(0.95, 0.7 + hits.length * 0.1),
    reason: `Urgency keywords detected: [${hits.slice(0, 4).join(", ")}]. Demo policy sets CRITICAL priority with a shortened SLA window. A human reviews every flag — no auto-escalation to authorities.`,
  };
}

// ── SLA due date (demo policy config, never a statutory claim) ──
export function computeDueAt(priority: string, policy: { slaDaysByPriority: Record<string, number> }, from = new Date()): Date {
  const days = policy.slaDaysByPriority[priority] ?? 15;
  return new Date(from.getTime() + days * 86400000);
}

// ── Pipeline D: duplicate candidate scoring (same-institution + token Jaccard) ──
const STOP = new Set("the a an and or of to in for on at is are was were be been i we my our me you your they it its with from this that not no received regarding kindly please sir madam hello team college institute university would should could have has had do does did will".split(" "));

export function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  return inter / (a.size + b.size - inter);
}

export const DUPLICATE_THRESHOLD = 0.32;

export function duplicateReasons(score: number, sameCategory: boolean, commonTokens: string[]): string[] {
  const reasons: string[] = [`Normalized token similarity ${score.toFixed(2)} ≥ threshold ${DUPLICATE_THRESHOLD} (algorithm jaccard-v1)`];
  if (sameCategory) reasons.push("Same complaint category");
  reasons.push(`Shared distinctive terms: [${commonTokens.slice(0, 6).join(", ") || "—"}]`);
  return reasons;
}

export function commonTokens(a: Set<string>, b: Set<string>): string[] {
  const out: string[] = [];
  for (const x of a) if (b.has(x)) out.push(x);
  return out.sort();
}

// ── Institution accountability score (demo metric, 0-100, formula disclosed) ──
// speed 40% + SLA compliance 35% + complainant feedback 25% — as shown in the UI.
export function institutionScore(input: {
  resolvedCases: { resolutionDays: number | null; slaBreached: boolean; rating: number | null }[];
  openCases: { overdue: boolean }[];
}): { score: number | null; band: "GREEN" | "AMBER" | "RED"; breakdown: { speed: number; sla: number; feedback: number }; note: string } {
  const { resolvedCases } = input;
  if (resolvedCases.length === 0) {
    return { score: null, band: "AMBER", breakdown: { speed: 0, sla: 0, feedback: 0 }, note: "No resolved cases yet — score appears once cases are resolved (demo metric)." };
  }
  const avgDays = resolvedCases.reduce((s, c) => s + (c.resolutionDays ?? 10), 0) / resolvedCases.length;
  const speed = Math.max(0, Math.min(100, Math.round(100 - (avgDays - 2) * 8)));
  const onTime = resolvedCases.filter((c) => !c.slaBreached).length / resolvedCases.length;
  const sla = Math.round(onTime * 100);
  const rated = resolvedCases.filter((c) => c.rating != null);
  const feedback = rated.length === 0 ? 60 : Math.round((rated.reduce((s, c) => s + (c.rating ?? 3), 0) / rated.length) * 20);
  const score = Math.round(speed * 0.4 + sla * 0.35 + feedback * 0.25);
  const band = score >= 70 ? "GREEN" : score >= 50 ? "AMBER" : "RED";
  return {
    score, band,
    breakdown: { speed, sla, feedback },
    note: "Demo accountability metric: resolution speed 40% + SLA compliance 35% + complainant feedback 25%. Not an official AICTE grading.",
  };
}

// ── Pipeline C: Cross-Bureau Overlap Detection (SIH PS 26264 Core Innovation) ──
// Detects when multiple AICTE Bureaus (e.g. Regulation Bureau & PGRC) are handling
// cases concerning the same institution simultaneously, preventing duplicate actions.
export interface OverlapResult {
  institutionId: string;
  institutionCode: string;
  institutionName: string;
  permanentId?: string | null;
  region?: string | null;
  state?: string | null;
  cases: {
    id: string;
    caseNumber: string;
    subject: string;
    bureau: string;
    status: string;
    priority: string;
    assignedOfficerName?: string | null;
    createdAt: string;
  }[];
  bureaus: string[];
  hasRegulationBureau: boolean;
  hasPGRC: boolean;
  alertMessage: string;
  recommendation: string;
}

export function findCrossBureauOverlaps(cases: any[]): OverlapResult[] {
  const activeStatuses = [
    "RECEIVED", "NEEDS_TRIAGE", "ASSIGNED", "UNDER_PROCESS", "ACTION_INITIATED",
    "IN_REVIEW", "COORDINATION_REQUIRED", "WAITING_FOR_INFORMATION", "ACTION_REQUIRED", "PENDING_REVIEW", "REOPENED",
  ];
  const active = cases.filter((c) => activeStatuses.includes(c.status) && c.bureau && c.institutionId);

  const byInst: Record<string, any[]> = {};
  for (const c of active) {
    if (!byInst[c.institutionId]) byInst[c.institutionId] = [];
    byInst[c.institutionId].push(c);
  }

  const overlaps: OverlapResult[] = [];
  for (const [instId, instCases] of Object.entries(byInst)) {
    const bureaus = Array.from(new Set(instCases.map((c) => c.bureau as string)));
    if (bureaus.length >= 2) {
      const inst = instCases[0].institution;
      const hasRB = bureaus.includes("REGULATION_BUREAU");
      const hasPGRC = bureaus.includes("PGRC");

      let alertMessage = "Potential Overlapping Cases – Coordination Required";
      let recommendation = `Active cases concurrently open across ${bureaus.length} AICTE Bureaus. Inter-bureau coordination required to prevent duplicate inquiries.`;

      if (hasRB && hasPGRC) {
        recommendation = "Cross-Bureau Collision: Regulation Bureau (RB) and Public Grievance Redressal Cell (PGRC) are both investigating this institution. Coordinate actions to issue a unified communication.";
      }

      overlaps.push({
        institutionId: instId,
        institutionCode: inst?.code ?? "AICTE-INST",
        institutionName: inst?.name ?? "Institution",
        permanentId: inst?.permanentId ?? null,
        region: inst?.region ?? null,
        state: inst?.state ?? null,
        cases: instCases.map((c) => ({
          id: c.id,
          caseNumber: c.caseNumber,
          subject: c.subject,
          bureau: c.bureau,
          status: c.status,
          priority: c.priority,
          assignedOfficerName: c.assignedOfficer?.name ?? null,
          createdAt: typeof c.createdAt === "string" ? c.createdAt : c.createdAt.toISOString(),
        })),
        bureaus,
        hasRegulationBureau: hasRB,
        hasPGRC,
        alertMessage,
        recommendation,
      });
    }
  }

  return overlaps;
}

