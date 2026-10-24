// S.U.G.A.M. demo seed — clearly SYNTHETIC data for the SIH demo (§2 P0, §9 Day 3).
// Idempotent: skips if the platform admin already exists.
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { appendAudit } from "@/lib/audit";
import { DEMO_POLICY } from "@/lib/constants";
import {
  suggestCategory, tokenize, jaccard,
  DUPLICATE_THRESHOLD, duplicateReasons, commonTokens,
} from "@/lib/automation";

const daysAgo = (d: number, h = 10) => new Date(Date.now() - d * 86400000 - (10 - h) * 3600000);
const daysAhead = (d: number, h = 10) => new Date(Date.now() + d * 86400000 - (10 - h) * 3600000);

let seedPromise: Promise<void> | null = null;
export function ensureSeed(): Promise<void> {
  if (!seedPromise) seedPromise = doSeed().catch((e) => { seedPromise = null; throw e; });
  return seedPromise;
}
export function resetSeedSingleton() {
  seedPromise = null;
}

async function nextCaseNumber(): Promise<string> {
  const c = await db.counter.upsert({ where: { key: "case_number" }, create: { key: "case_number", value: 1 }, update: { value: { increment: 1 } } });
  return `SUGAM-2026-${String(c.value).padStart(4, "0")}`;
}

async function doSeed() {
  const existing = await db.user.findFirst({ where: { primaryRole: "PLATFORM_ADMIN" } });
  if (existing) return;

  const pw = hashPassword("demo123");

  // ── Institutions (synthetic with AICTE Permanent IDs and Regions) ──
  const mkInst = (code: string, permanentId: string, name: string, state: string, district: string, region: string, address: string) =>
    db.institution.create({
      data: {
        code,
        permanentId,
        name,
        state,
        district,
        region,
        address,
        approvalStatus: "APPROVED",
        identifiersJson: JSON.stringify([`AISHE-${code.slice(6)}-DEMO`, `AICTE-PERM-${permanentId}`]),
        dataSource: "SEeded_DEMO",
        isSynthetic: true,
      },
    });

  const sunrise = await mkInst("AICTE-1042", "1-938210491", "Sunrise Institute of Technology", "Maharashtra", "Pune", "WESTERN", "Survey No. 42, Hinjewadi Phase 1, Pune, Maharashtra 411057");
  const riverdale = await mkInst("AICTE-2087", "1-482910382", "Riverdale University", "Karnataka", "Bengaluru", "SOUTH_WESTERN", "Electronic City Phase 2, Bengaluru, Karnataka 560100");
  const greenvalley = await mkInst("AICTE-3120", "1-773829104", "Green Valley Engineering College", "Tamil Nadu", "Coimbatore", "SOUTHERN", "Avinashi Road, Coimbatore, Tamil Nadu 641014");
  const lakshmi = await mkInst("AICTE-1550", "1-294819381", "Lakshmi Narayan Institute", "Madhya Pradesh", "Bhopal", "CENTRAL", "Raisen Road, Kalchuri Nagar, Bhopal, MP 462022");
  const coastal = await mkInst("AICTE-4211", "1-884910293", "Coastal Institute of Management", "Kerala", "Kochi", "SOUTHERN", "Kalamassery, Kochi, Kerala 682039");
  const northern = await mkInst("AICTE-5333", "1-551938271", "Northern Plains Polytechnic", "Uttar Pradesh", "Lucknow", "NORTHERN", "Sitapur Road, Mohibullapur, Lucknow, UP 226021");

  // ── Users (demo accounts, documented locally — never production defaults) ──
  const mkUser = (data: Record<string, string | null>) => db.user.create({ data: { ...data, passwordHash: pw } as never });
  const [aarav, meera, rohan, college, intake, bureauRB, bureauPGRC, bureauK, bureauB, bureauJ, reviewer, auditor, admin] = await Promise.all([
    mkUser({ name: "Aarav Sharma", email: "student@sugam.demo", primaryRole: "COMPLAINANT", rolesJson: '["COMPLAINANT"]', rollNo: "SUN-STU-2026-0117", designation: "B.Tech CSE, Semester 6" }),
    mkUser({ name: "Dr. Meera Iyer", email: "faculty@sugam.demo", primaryRole: "COMPLAINANT", rolesJson: '["COMPLAINANT"]', rollNo: "GV-FAC-0081", designation: "Assistant Professor, ECE" }),
    mkUser({ name: "Rohan Verma", email: "student2@sugam.demo", primaryRole: "COMPLAINANT", rolesJson: '["COMPLAINANT"]', rollNo: "SUN-STU-2026-0142", designation: "B.Tech Mech, Semester 4" }),
    mkUser({ name: "Prof. Anil Deshmukh", email: "college@sugam.demo", primaryRole: "INSTITUTION_OFFICER", rolesJson: '["INSTITUTION_OFFICER"]', designation: "Nodal Officer", institutionId: sunrise.id }),
    mkUser({ name: "Kavita Rao", email: "intake@sugam.demo", primaryRole: "INTAKE_OFFICER", rolesJson: '["INTAKE_OFFICER"]', designation: "Registry Officer", bureau: "PGRC" }),
    mkUser({ name: "Dr. V. K. Saxena", email: "rb@sugam.demo", primaryRole: "BUREAU_OFFICER", rolesJson: '["BUREAU_OFFICER"]', designation: "Director (Regulation Bureau)", bureau: "REGULATION_BUREAU" }),
    mkUser({ name: "Suresh Verma", email: "pgrc@sugam.demo", primaryRole: "BUREAU_OFFICER", rolesJson: '["BUREAU_OFFICER"]', designation: "Section Officer (PGRC)", bureau: "PGRC" }),
    mkUser({ name: "R. Krishnan", email: "bureau@sugam.demo", primaryRole: "BUREAU_OFFICER", rolesJson: '["BUREAU_OFFICER"]', designation: "Section Officer", bureau: "SCHOLARSHIP_CELL" }),
    mkUser({ name: "S. Bhatt", email: "bureau2@sugam.demo", primaryRole: "BUREAU_OFFICER", rolesJson: '["BUREAU_OFFICER"]', designation: "Section Officer", bureau: "ANTI_RAGGING_CELL" }),
    mkUser({ name: "D. Joshi", email: "bureau3@sugam.demo", primaryRole: "BUREAU_OFFICER", rolesJson: '["BUREAU_OFFICER"]', designation: "Section Officer", bureau: "FACULTY_CELL" }),
    mkUser({ name: "Dr. S. Nair", email: "reviewer@sugam.demo", primaryRole: "REVIEWING_OFFICER", rolesJson: '["REVIEWING_OFFICER"]', designation: "Joint Director (AICTE)" }),
    mkUser({ name: "P. Malhotra", email: "auditor@sugam.demo", primaryRole: "AUDITOR", rolesJson: '["AUDITOR"]', designation: "Internal Audit (AICTE)" }),
    mkUser({ name: "System Admin", email: "admin@sugam.demo", primaryRole: "PLATFORM_ADMIN", rolesJson: '["PLATFORM_ADMIN"]', designation: "Platform Administrator" }),
  ]);

  // ── Policy configs ──
  await db.policyConfig.create({ data: { key: "sla_policy", valueJson: JSON.stringify({ ...DEMO_POLICY, note: "Demo configuration for the prototype. Thresholds are NOT statutory deadlines." }) } });
  await db.policyConfig.create({ data: { key: "routing_map", valueJson: JSON.stringify({ FEE_REFUND: "SCHOLARSHIP_CELL", SCHOLARSHIP: "SCHOLARSHIP_CELL", RAGGING: "ANTI_RAGGING_CELL", FACULTY_SALARY: "FACULTY_CELL", APPROVAL_DOC: "APPROVAL_BUREAU", HOSTEL: "PGRC", EXAM_CELL: "EXAM_CELL", INFRASTRUCTURE: "PGRC", OTHER: "PGRC", note: "Demo routing map — explainable, officer-overridable." }) } });

  // ── Reply templates (pre-defined formats for the college portal) ──
  await db.replyTemplate.createMany({
    data: [
      { title: "Fee refund acknowledgment", category: "FEE_REFUND", body: "The accounts section has verified the duplicate/excess payment for the referenced case. A refund of the verified amount has been initiated via NEFT to the student's registered bank account and should reflect within 7 working days. UTR reference will be shared on the institutional portal." },
      { title: "Document request to complainant", category: null, body: "To proceed with the review of this case, kindly provide the following: (1) payment receipt / transaction ID, (2) admission or enrolment number, (3) any prior correspondence on the matter. The case will remain in 'Waiting for Information' until these are received." },
      { title: "Hostel inspection scheduled", category: "HOSTEL", body: "A facility inspection has been scheduled with the warden and maintenance committee. Findings and the corrective action plan will be recorded against this case within the institutional response window." },
      { title: "Salary grievance verification", category: "FACULTY_SALARY", body: "Payroll records for the stated period have been retrieved and are being verified with the finance office. A consolidated response with salary slips and disbursement dates will be submitted as supporting evidence." },
    ],
  });

  // ── Cases ──
  type CaseSeed = {
    inst: string; complainant?: string | null; category: string; categorySource?: string;
    subject: string; description: string; priority?: string; status: string;
    source?: string; sourceRecordId?: string | null; createdDaysAgo: number;
    dueInDays?: number | null; slaBreached?: boolean; escalated?: boolean;
    assignedOfficerId?: string | null; bureau?: string | null;
    region?: string | null; overlapFlag?: boolean; coordinationStatus?: string | null;
    nextActionLabel?: string; nextActionDueInDays?: number;
    resolvedDaysAfter?: number; rating?: number; ratingComment?: string;
    events: { t: string; s: string; when: number; by?: string; vis?: string }[];
  };

  const seeds: CaseSeed[] = [
    // ── SIH PS 26264 Flagship Scenario: Parallel active cases across RB and PGRC on Sunrise Institute ──
    {
      inst: sunrise.id, complainant: null, category: "CAPITATION_FEE", status: "ACTION_INITIATED", priority: "CRITICAL",
      bureau: "REGULATION_BUREAU", region: "WESTERN", assignedOfficerId: bureauRB.id,
      overlapFlag: true, coordinationStatus: "COORDINATION_REQUIRED",
      subject: "Direct Admission & Mandatory Capitation Fee of Rs 2.5 Lakhs (Regulation Bureau)",
      description: "AICTE Regulation Bureau initiated formal regulatory scrutiny following documentary evidence of compulsory capitation fees (Rs 2.5 Lakhs) collected during spot admissions in violation of AICTE Approval Process Handbook (APH) regulations.",
      createdDaysAgo: 4, dueInDays: 5,
      nextActionLabel: "Issue formal Show-Cause Notice under AICTE Regulation Section 10(k)", nextActionDueInDays: 2,
      events: [
        { t: "FILED", s: "Regulatory compliance case initiated by AICTE Regulation Bureau.", when: 4, by: "Dr. V. K. Saxena", vis: "INTERNAL" },
        { t: "AUTO_ROUTED", s: "Routed to Regulation Bureau (RB) — Capitation Fee & AICTE Norms violation.", when: 4 },
        { t: "ASSIGNED", s: "Assigned to Dr. V. K. Saxena (Director, Regulation Bureau).", when: 3, by: "Dr. S. Nair" },
        { t: "STATUS_CHANGED", s: "Status set to ACTION_INITIATED — regulatory inquiry initiated.", when: 2, by: "Dr. V. K. Saxena" },
        { t: "COORDINATION_INITIATED", s: "Potential Overlapping Case detected: parallel complaint under process in PGRC for same institution. Coordination required.", when: 1 },
      ],
    },
    {
      inst: sunrise.id, complainant: aarav.id, category: "STUDENT_GRIEVANCE", status: "UNDER_PROCESS", priority: "HIGH",
      bureau: "PGRC", region: "WESTERN", assignedOfficerId: bureauPGRC.id,
      overlapFlag: true, coordinationStatus: "COORDINATION_REQUIRED",
      subject: "Withholding of Original 12th Marksheet & Caution Deposit (PGRC Cell)",
      description: "Student lodged grievance on PGRC portal regarding college administration withholding Class 12th original marksheets and refusing refund of Rs 25,000 caution deposit after voluntary cancellation of admission.",
      createdDaysAgo: 3, dueInDays: 8,
      nextActionLabel: "Seek written explanation from College Principal regarding certificate retention", nextActionDueInDays: 3,
      events: [
        { t: "FILED", s: "Grievance received on AICTE Public Grievance Redressal Cell (PGRC).", when: 3, by: "Complainant (Protected)", vis: "PUBLIC" },
        { t: "AUTO_ROUTED", s: "Routed to Public Grievance Redressal Cell (PGRC).", when: 3 },
        { t: "ASSIGNED", s: "Assigned to Suresh Verma (PGRC).", when: 2, by: "Kavita Rao" },
        { t: "STATUS_CHANGED", s: "Status set to UNDER_PROCESS — institution clarification sought.", when: 2, by: "Suresh Verma" },
        { t: "COORDINATION_INITIATED", s: "Potential Overlapping Case detected: Regulation Bureau (RB) also has active regulatory case for this institution.", when: 1 },
      ],
    },
    {
      inst: sunrise.id, complainant: aarav.id, category: "FEE_REFUND", status: "RESOLVED",
      subject: "Semester 5 exam fee refunded twice-delayed", priority: "NORMAL",
      description: "The semester 5 examination fee of Rs 4,200 was deducted twice during online payment. The institution acknowledged the excess deduction of Rs 4,200 but the refund took more than six weeks despite repeated follow-ups at the accounts counter.",
      createdDaysAgo: 22, dueInDays: null, resolvedDaysAfter: 5, rating: 5, ratingComment: "Resolved after the portal case was filed. Thank you.",
      assignedOfficerId: bureauK.id, bureau: "SCHOLARSHIP_CELL",
      events: [
        { t: "FILED", s: "Complaint submitted through the S.U.G.A.M. portal with payment receipt attached.", when: 22, by: "Complainant (Protected)", vis: "PUBLIC" },
        { t: "AUTO_ROUTED", s: "Rule suggestion accepted: category FEE_REFUND → Scholarship & Fee Cell (matched terms: \"refund\", \"deducted\", \"fee\").", when: 22 },
        { t: "ASSIGNED", s: "Assigned to R. Krishnan (Scholarship & Fee Cell).", when: 20, by: "Kavita Rao" },
        { t: "STATUS_CHANGED", s: "Status set to IN_REVIEW — officer began verification of payment records.", when: 19, by: "R. Krishnan" },
        { t: "RESPONSE_ADDED", s: "Institution submitted response with NEFT UTR reference and refund confirmation (template: Fee refund acknowledgment).", when: 17, by: "Prof. Anil Deshmukh", vis: "PUBLIC" },
        { t: "STATUS_CHANGED", s: "Status set to PENDING_REVIEW — refund initiation verified against bank statement.", when: 17, by: "R. Krishnan" },
        { t: "STATUS_CHANGED", s: "Resolved and reviewed: refund of Rs 4,200 credited on schedule. Complainant feedback invited.", when: 17, by: "Dr. S. Nair" },
        { t: "RATED", s: "Complainant rated the resolution 5/5.", when: 16, by: "Complainant (Protected)", vis: "PUBLIC" },
      ],
    },
    {
      inst: sunrise.id, complainant: rohan.id, category: "FEE_REFUND", status: "RECEIVED",
      subject: "Duplicate semester 6 fee payment of Rs 18,500 not refunded",
      description: "I paid the semester 6 fee of Rs 18,500 twice on 12 July due to a payment gateway timeout. The duplicate deduction of Rs 18,500 is visible in my bank statement. Refund requested twice at the accounts office; no credit has been issued after 8 weeks.",
      createdDaysAgo: 2, priority: "NORMAL", dueInDays: 13,
      nextActionLabel: "Review submitted complaint", nextActionDueInDays: 3,
      events: [
        { t: "FILED", s: "Complaint submitted through the S.U.G.A.M. portal.", when: 2, by: "Complainant (Protected)", vis: "PUBLIC" },
        { t: "AUTO_ROUTED", s: "Rule suggestion available: category FEE_REFUND → Scholarship & Fee Cell (matched terms: \"refund\", \"fee\", \"payment\").", when: 2 },
        { t: "DUPLICATE_FLAGGED", s: "Possible duplicate candidate detected at the same institution — awaiting officer confirmation. Original case remains unaffected.", when: 2 },
      ],
    },
    {
      inst: sunrise.id, complainant: aarav.id, category: "FEE_REFUND", status: "RECEIVED",
      subject: "Fee refund pending for duplicate payment of Rs 18,500",
      description: "Semester 6 fee of Rs 18,500 was charged twice on 12 July due to a payment gateway timeout. The duplicate deduction of Rs 18,500 appears in my bank statement. Refund requested twice at the accounts office; no credit has been issued after 8 weeks.",
      createdDaysAgo: 1, priority: "NORMAL", dueInDays: 14,
      events: [
        { t: "FILED", s: "Complaint submitted through the S.U.G.A.M. portal.", when: 1, by: "Complainant (Protected)", vis: "PUBLIC" },
        { t: "AUTO_ROUTED", s: "Rule suggestion available: category FEE_REFUND → Scholarship & Fee Cell.", when: 1 },
      ],
    },
    {
      inst: sunrise.id, complainant: rohan.id, category: "RAGGING", status: "IN_REVIEW", priority: "CRITICAL",
      subject: "Senior students harassing first-year in hostel block C",
      description: "A group of senior students is repeatedly harassing and verbally abusing a first-year student in hostel block C at night. The victim is afraid to report officially. This needs urgent attention for student safety.",
      createdDaysAgo: 0, dueInDays: 1,
      assignedOfficerId: bureauB.id, bureau: "ANTI_RAGGING_CELL",
      nextActionLabel: "Contact warden and schedule protected interview", nextActionDueInDays: 1,
      events: [
        { t: "FILED", s: "Complaint submitted through the S.U.G.A.M. portal (complainant identity protected).", when: 0, by: "Complainant (Protected)", vis: "PUBLIC" },
        { t: "URGENCY_FLAGGED", s: "Urgency keywords detected [harassing, abusing, safety] → CRITICAL priority, demo SLA window shortened to 24 hours. Human review required before any escalation.", when: 0 },
        { t: "AUTO_ROUTED", s: "Routed to Anti-Ragging Cell.", when: 0 },
        { t: "ASSIGNED", s: "Assigned to S. Bhatt (Anti-Ragging Cell).", when: 0, by: "Kavita Rao" },
        { t: "STATUS_CHANGED", s: "Status set to IN_REVIEW. Warden informed through official channel; identity of reporter masked.", when: 0, by: "S. Bhatt" },
      ],
    },
    {
      inst: greenvalley.id, complainant: meera.id, category: "FACULTY_SALARY", status: "WAITING_FOR_INFORMATION",
      subject: "Salary for June not credited; PF deduction shown but not deposited",
      description: "My June salary has not been credited. The payslip shows a provident fund deduction, but the PF portal shows no deposit for June. Two reminders to the finance office have gone unanswered.",
      createdDaysAgo: 9, priority: "HIGH", dueInDays: -4, slaBreached: false,
      assignedOfficerId: bureauJ.id, bureau: "FACULTY_CELL",
      nextActionLabel: "Await payroll records from institution finance office", nextActionDueInDays: 2,
      events: [
        { t: "FILED", s: "Complaint submitted through the S.U.G.A.M. portal.", when: 9, by: "Complainant (Protected)", vis: "PUBLIC" },
        { t: "AUTO_ROUTED", s: "Routed to Faculty & Staff Cell (matched terms: \"salary\", \"pf\", \"provident fund\").", when: 9 },
        { t: "ASSIGNED", s: "Assigned to D. Joshi (Faculty & Staff Cell).", when: 8, by: "Kavita Rao" },
        { t: "STATUS_CHANGED", s: "Status set to WAITING_FOR_INFORMATION — payroll and PF deposit records requested from the institution.", when: 7, by: "D. Joshi" },
        { t: "RESPONSE_REQUESTED", s: "Officer requested a formal response with salary slips and PF challan from the institution nodal officer.", when: 7, by: "D. Joshi" },
      ],
    },
    {
      inst: sunrise.id, complainant: rohan.id, category: "SCHOLARSHIP", status: "ASSIGNED",
      subject: "State scholarship disbursement stuck for two semesters",
      description: "My state scholarship for the previous two semesters shows 'approved' on the state portal but the amount has not been disbursed to the institution or to me. The college scholarship cell says the ledger has not been updated.",
      createdDaysAgo: 12, priority: "NORMAL", dueInDays: 2,
      assignedOfficerId: bureauK.id, bureau: "SCHOLARSHIP_CELL",
      nextActionLabel: "Reconcile scholarship ledger with institution", nextActionDueInDays: 2,
      events: [
        { t: "FILED", s: "Complaint submitted through the S.U.G.A.M. portal.", when: 12, by: "Complainant (Protected)", vis: "PUBLIC" },
        { t: "AUTO_ROUTED", s: "Routed to Scholarship & Fee Cell (matched terms: \"scholarship\", \"disbursement\").", when: 12 },
        { t: "ASSIGNED", s: "Assigned to R. Krishnan (Scholarship & Fee Cell).", when: 11, by: "Kavita Rao" },
        { t: "STATUS_CHANGED", s: "Status set to ASSIGNED — ledger reconciliation initiated with the institution.", when: 11, by: "R. Krishnan" },
      ],
    },
    {
      inst: lakshmi.id, complainant: null, category: "APPROVAL_DOC", status: "NEEDS_TRIAGE",
      source: "DEMO_CPGRAMS", sourceRecordId: "CPG-2026-0451",
      subject: " bonafide certificate request pending beyond 30 days (imported record)",
      description: "Imported from the simulated external grievance source: a bonafide certificate requested for education-loan processing has been pending for over 30 days despite two written requests to the registrar office.",
      createdDaysAgo: 3, priority: "NORMAL", dueInDays: 12,
      events: [
        { t: "IMPORTED", s: "Record imported from SIMULATED CPGRAMS source (source ID CPG-2026-0451). Institution matched by registry code AICTE-1550.", when: 3, vis: "INTERNAL" },
        { t: "AUTO_ROUTED", s: "Rule suggestion available: category APPROVAL_DOC → Approval Bureau.", when: 3 },
      ],
    },
    {
      inst: coastal.id, complainant: null, category: "HOSTEL", status: "ACTION_REQUIRED",
      source: "DEMO_PORTAL",
      subject: "Hostel water shortage in blocks A/B for three weeks",
      description: "Hostel blocks A and B have had severe water shortages for three weeks. Students are carrying water from the ground floor. The warden has acknowledged but no repair has started.",
      createdDaysAgo: 20, priority: "HIGH", dueInDays: -5, slaBreached: true, escalated: true,
      assignedOfficerId: bureauK.id, bureau: "PGRC",
      nextActionLabel: "Issue compliance notice and set repair deadline", nextActionDueInDays: -1,
      events: [
        { t: "FILED", s: "Complaint submitted through the S.U.G.A.M. portal.", when: 20, by: "Portal record (imported complainant)", vis: "PUBLIC" },
        { t: "AUTO_ROUTED", s: "Routed to Grievance Redressal Cell (matched terms: \"hostel\", \"water\").", when: 20 },
        { t: "ASSIGNED", s: "Assigned to R. Krishnan (Grievance Redressal Cell).", when: 18, by: "Kavita Rao" },
        { t: "STATUS_CHANGED", s: "Status set to ACTION_REQUIRED — institution asked for a repair plan.", when: 16, by: "R. Krishnan" },
        { t: "SLA_CHECK", s: "Demo policy check: SLA deadline passed. Case marked overdue; escalation notification sent to reviewing officer.", when: 5 },
        { t: "ESCALATED", s: "Overdue case escalated to Reviewing Officer per demo escalation policy.", when: 5 },
      ],
    },
    {
      inst: riverdale.id, complainant: null, category: "EXAM_CELL", status: "PENDING_REVIEW",
      subject: "Revaluation result for Engineering Mathematics delayed",
      description: "Revaluation was applied and paid for on time. The revaluation result was due within 30 days per the prospectus but is still not published, blocking scholarship renewal.",
      createdDaysAgo: 26, priority: "NORMAL", dueInDays: 4,
      assignedOfficerId: bureauK.id, bureau: "EXAM_CELL",
      nextActionLabel: "Review institution response before final recommendation", nextActionDueInDays: 4,
      events: [
        { t: "FILED", s: "Complaint submitted through the S.U.G.A.M. portal.", when: 26, by: "Portal record", vis: "PUBLIC" },
        { t: "ASSIGNED", s: "Assigned to Examination Cell.", when: 24, by: "Kavita Rao" },
        { t: "RESPONSE_ADDED", s: "Institution submitted response: revaluation pending due to evaluator availability; revised date committed.", when: 6, by: "Registrar office", vis: "PUBLIC" },
        { t: "STATUS_CHANGED", s: "Status set to PENDING_REVIEW — committed date needs officer verification.", when: 5, by: "R. Krishnan" },
      ],
    },
    {
      inst: greenvalley.id, complainant: null, category: "FEE_REFUND", status: "IN_REVIEW",
      source: "DEMO_CPGRAMS", sourceRecordId: "CPG-2026-0477",
      subject: "Transport fee refund after bus-route withdrawal",
      description: "Imported from the simulated external grievance source: transport fee for the full semester was collected though the bus route was withdrawn within two weeks. A pro-rata refund was promised in writing but not processed.",
      createdDaysAgo: 8, priority: "NORMAL", dueInDays: 7,
      assignedOfficerId: bureauK.id, bureau: "SCHOLARSHIP_CELL",
      nextActionLabel: "Verify written refund commitment with institution", nextActionDueInDays: 7,
      events: [
        { t: "IMPORTED", s: "Record imported from SIMULATED CPGRAMS source (source ID CPG-2026-0477).", when: 8, vis: "INTERNAL" },
        { t: "ASSIGNED", s: "Assigned to R. Krishnan (Scholarship & Fee Cell).", when: 7, by: "Kavita Rao" },
        { t: "STATUS_CHANGED", s: "Status set to IN_REVIEW — written commitment shared by institution is under verification.", when: 6, by: "R. Krishnan" },
      ],
    },
    {
      inst: northern.id, complainant: null, category: "INFRASTRUCTURE", status: "RECEIVED",
      source: "DEMO_CPGRAMS", sourceRecordId: "CPG-2026-0480",
      subject: "Laboratory equipment non-functional since last audit",
      description: "Imported from the simulated external grievance source: primary computer lab has 14 non-functional systems since the last internal audit; practical sessions are being shared across batches.",
      createdDaysAgo: 1, priority: "LOW", dueInDays: 19,
      events: [
        { t: "IMPORTED", s: "Record imported from SIMULATED CPGRAMS source (source ID CPG-2026-0480).", when: 1, vis: "INTERNAL" },
        { t: "AUTO_ROUTED", s: "Rule suggestion available: category INFRASTRUCTURE → Grievance Redressal Cell.", when: 1 },
      ],
    },
    {
      inst: sunrise.id, complainant: aarav.id, category: "OTHER", status: "CLOSED",
      subject: "Bus pass counter timing conflicts with lab schedule",
      description: "The campus bus pass renewal counter closes at 14:00, overlapping with lab hours, forcing students to miss labs. Suggestion: shift counter timing to 16:30.",
      createdDaysAgo: 40, priority: "LOW", resolvedDaysAfter: 3, rating: 4, ratingComment: "Counter timing changed. Good.",
      dueInDays: null,
      events: [
        { t: "FILED", s: "Complaint submitted through the S.U.G.A.M. portal.", when: 40, by: "Complainant (Protected)", vis: "PUBLIC" },
        { t: "STATUS_CHANGED", s: "Status set to PENDING_REVIEW — suggestion forwarded to administration.", when: 37, by: "Kavita Rao" },
        { t: "STATUS_CHANGED", s: "Resolved: counter timing extended to 16:30 from the next week.", when: 37, by: "Dr. S. Nair" },
        { t: "RATED", s: "Complainant rated the resolution 4/5.", when: 36, by: "Complainant (Protected)", vis: "PUBLIC" },
        { t: "STATUS_CHANGED", s: "Closed after the review window with no reopening request.", when: 30, by: "Dr. S. Nair" },
      ],
    },
    {
      inst: coastal.id, complainant: null, category: "SCHOLARSHIP", status: "RESOLVED",
      subject: "Post-matric scholarship forwarded late to state portal",
      description: "Institution forwarded post-matric scholarship applications 5 weeks after the state deadline window opened, risking rejection for 40+ students.",
      createdDaysAgo: 30, priority: "HIGH", dueInDays: null, slaBreached: true, resolvedDaysAfter: 18, rating: 2, ratingComment: "Fixed only after repeated escalation.",
      assignedOfficerId: bureauK.id, bureau: "SCHOLARSHIP_CELL",
      events: [
        { t: "FILED", s: "Complaint submitted through the S.U.G.A.M. portal.", when: 30, by: "Portal record", vis: "PUBLIC" },
        { t: "ASSIGNED", s: "Assigned to Scholarship & Fee Cell.", when: 28, by: "Kavita Rao" },
        { t: "SLA_CHECK", s: "Demo policy check: SLA deadline passed during review. Case marked overdue.", when: 14 },
        { t: "STATUS_CHANGED", s: "Resolved: applications forwarded; state portal confirmed receipt for all listed students.", when: 12, by: "Dr. S. Nair" },
        { t: "RATED", s: "Complainant rated the resolution 2/5.", when: 11, by: "Portal record", vis: "PUBLIC" },
      ],
    },
    {
      inst: sunrise.id, complainant: meera.id, category: "APPROVAL_DOC", status: "RESOLVED",
      subject: "Faculty noc for external research collaboration delayed",
      description: "An NOC required for an externally funded research collaboration was pending with the registrar for 5 weeks, delaying the sanctioned project start.",
      createdDaysAgo: 35, priority: "NORMAL", dueInDays: null, slaBreached: true, resolvedDaysAfter: 21, rating: 4,
      assignedOfficerId: bureauJ.id, bureau: "APPROVAL_BUREAU",
      events: [
        { t: "FILED", s: "Complaint submitted through the S.U.G.A.M. portal.", when: 35, by: "Complainant (Protected)", vis: "PUBLIC" },
        { t: "ASSIGNED", s: "Assigned to Approval Bureau.", when: 33, by: "Kavita Rao" },
        { t: "SLA_CHECK", s: "Demo policy check: SLA deadline passed. Case marked overdue.", when: 18 },
        { t: "STATUS_CHANGED", s: "Resolved: NOC issued with registrar seal; project start confirmed.", when: 14, by: "Dr. S. Nair" },
        { t: "RATED", s: "Complainant rated the resolution 4/5.", when: 13, by: "Complainant (Protected)", vis: "PUBLIC" },
      ],
    },
    {
      inst: lakshmi.id, complainant: null, category: "EXAM_CELL", status: "REOPENED",
      subject: "Marks not migrated to university portal after revaluation",
      description: "After revaluation, the updated marks were not migrated to the university portal, so the degree audit shows a fail that was cleared two months ago.",
      createdDaysAgo: 28, priority: "HIGH", dueInDays: 3,
      assignedOfficerId: bureauK.id, bureau: "EXAM_CELL",
      nextActionLabel: "Verify migration record after reopening", nextActionDueInDays: 3,
      events: [
        { t: "FILED", s: "Complaint submitted through the S.U.G.A.M. portal.", when: 28, by: "Portal record", vis: "PUBLIC" },
        { t: "STATUS_CHANGED", s: "Resolved: institution confirmed correction request sent to the university.", when: 16, by: "Dr. S. Nair" },
        { t: "REOPENED", s: "Complainant reopened: portal still shows outdated marks. Previous closure preserved in history.", when: 4, by: "Portal record", vis: "PUBLIC" },
      ],
    },
    {
      inst: sunrise.id, complainant: aarav.id, category: "HOSTEL", status: "ASSIGNED",
      subject: "Hostel mess food safety inspection report not published",
      description: "The monthly mess food-safety inspection report has not been published for two months. Students only receive verbal assurances.",
      createdDaysAgo: 5, priority: "NORMAL", dueInDays: 1,
      assignedOfficerId: bureauK.id, bureau: "PGRC",
      nextActionLabel: "Request published inspection report from institution", nextActionDueInDays: 1,
      events: [
        { t: "FILED", s: "Complaint submitted through the S.U.G.A.M. portal.", when: 5, by: "Complainant (Protected)", vis: "PUBLIC" },
        { t: "AUTO_ROUTED", s: "Routed to Grievance Redressal Cell (matched terms: \"hostel\", \"mess\", \"food\").", when: 5 },
        { t: "ASSIGNED", s: "Assigned to R. Krishnan (Grievance Redressal Cell).", when: 4, by: "Kavita Rao" },
      ],
    },
  ];

  // institution map for seeds
  const created: { id: string; caseNumber: string; category: string; instId: string; subject: string; description: string; status: string; seed: CaseSeed }[] = [];

  for (const s of seeds) {
    const createdAt = daysAgo(s.createdDaysAgo);
    const dueAt = s.dueInDays === null ? null : s.dueInDays === undefined ? null : (s.dueInDays >= 0 ? daysAhead(s.dueInDays) : daysAgo(-s.dueInDays));
    const caseNumber = await nextCaseNumber();
    const resolvedAt = s.resolvedDaysAfter != null ? daysAgo(s.createdDaysAgo - s.resolvedDaysAfter) : null;
    const closedAt = s.status === "CLOSED" ? daysAgo(s.createdDaysAgo - (s.resolvedDaysAfter ?? 5) - 5) : null;
    const sug = suggestCategory(`${s.subject} ${s.description}`);
    const kase = await db.case.create({
      data: {
        caseNumber, sourceSystem: s.source ?? "DEMO_PORTAL", sourceRecordId: s.sourceRecordId ?? null,
        institutionId: s.inst, complainantId: s.complainant ?? null,
        category: s.category, categorySource: s.categorySource ?? (s.complainant ? "COMPLAINANT_SELECTED" : "IMPORT_NORMALIZED"),
        bureau: s.bureau ?? null,
        region: s.region ?? null,
        overlapFlag: !!s.overlapFlag,
        coordinationStatus: s.coordinationStatus ?? null,
        subject: s.subject.trim(), description: s.description,
        status: s.status, priority: s.priority ?? "NORMAL",
        assignedOfficerId: s.assignedOfficerId ?? null,
        slaPolicyVersion: DEMO_POLICY.version, dueAt, slaBreached: !!s.slaBreached, escalated: !!s.escalated,
        nextActionLabel: s.nextActionLabel ?? null,
        nextActionDueAt: s.nextActionDueInDays != null ? (s.nextActionDueInDays >= 0 ? daysAhead(s.nextActionDueInDays) : daysAgo(-s.nextActionDueInDays)) : null,
        nextActionState: s.nextActionLabel ? "OPEN" : null,
        resolvedAt, closedAt, rating: s.rating ?? null, ratingComment: s.ratingComment ?? null,
        createdAt, updatedAt: createdAt,
      },
    });
    for (const e of s.events) {
      const when = daysAgo(s.createdDaysAgo - e.when, 11);
      await db.caseEvent.create({
        data: { caseId: kase.id, eventType: e.t, summary: e.s, visibility: e.vis ?? "INTERNAL", actorName: e.by ?? "S.U.G.A.M. automation", createdAt: when > new Date() ? new Date() : when },
      });
    }
    await appendAudit("COMPLAINT_FILED", { targetType: "CASE", targetId: kase.id, summary: `Case ${caseNumber} registered (${s.source === "DEMO_CPGRAMS" ? "SIMULATED CPGRAMS import" : "DEMO_PORTAL"}) — ${s.subject.trim().slice(0, 60)}`, metadata: { caseNumber } });
    if (s.assignedOfficerId) {
      await db.assignment.create({ data: { caseId: kase.id, toBureau: s.bureau ?? null, toOfficerId: s.assignedOfficerId, assignedBy: intake.id, reason: "Demo seed assignment", active: true, createdAt: daysAgo(Math.max(0, s.createdDaysAgo - 2)) } });
      await appendAudit("CASE_ASSIGNED", { targetType: "CASE", targetId: kase.id, summary: `Case ${caseNumber} assigned to ${s.bureau ?? "officer"}`, metadata: { caseNumber } });
    }
    if (s.status === "RESOLVED" || s.status === "CLOSED") await appendAudit("CASE_RESOLVED", { targetType: "CASE", targetId: kase.id, summary: `Case ${caseNumber} resolved (synthetic demo dataset)`, metadata: { caseNumber } });
    created.push({ id: kase.id, caseNumber, category: s.category, instId: s.inst, subject: s.subject, description: s.description, status: s.status, seed: s });
  }

  // ── Pipeline D demo: duplicate candidate between the two Sunrise fee cases ──
  const dupA = created.find((c) => c.caseNumber.endsWith("0002"));
  const dupB = created.find((c) => c.caseNumber.endsWith("0003"));
  if (dupA && dupB) {
    const ta = tokenize(`${dupA.subject} ${dupA.description}`);
    const tb = tokenize(`${dupB.subject} ${dupB.description}`);
    const score = jaccard(ta, tb);
    if (score >= DUPLICATE_THRESHOLD) {
      await db.duplicateSuggestion.create({
        data: {
          primaryCaseId: dupA.id, candidateCaseId: dupB.id, score,
          algorithmVersion: "jaccard-v1",
          reasonsJson: JSON.stringify(duplicateReasons(score, dupA.category === dupB.category, commonTokens(ta, tb))),
          state: "PENDING",
        },
      });
      await appendAudit("DUPLICATE_SUGGESTED", { targetType: "CASE", targetId: dupA.id, summary: `Possible duplicate candidate for ${dupA.caseNumber}: ${dupB.caseNumber} (similarity ${score.toFixed(2)}, same institution). Officer confirmation required — nothing merged automatically.`, metadata: { score } });
    }
  }

  // ── Internal accountability report (Green Valley — response overdue) ──
  await db.internalReport.create({
    data: {
      institutionId: greenvalley.id, officerId: reviewer.id, officerName: "Dr. S. Nair",
      subject: "Response overdue on assigned case (demo dataset)",
      message: "The institution has not submitted payroll records for the assigned salary case within the demo response window. Please submit the supported response with documents through the Institution Workspace. Continued delays will reflect in the institution accountability score (demo metric).",
      status: "SENT", createdAt: daysAgo(2),
    },
  });
  await appendAudit("REPORT_SENT", { actorId: reviewer.id, actorEmail: reviewer.email, targetType: "INSTITUTION", targetId: greenvalley.id, summary: "Internal accountability report sent to Green Valley Engineering College (demo dataset)" });

  // ── Simulated CPGRAMS import run (P1 demo) ──
  await db.integrationSyncRun.create({
    data: {
      sourceSystem: "DEMO_CPGRAMS", trigger: "SCHEDULED_DEMO", status: "PARTIAL",
      totalRows: 8, importedRows: 5, duplicateSkipped: 1,
      rejectedRowsJson: JSON.stringify([
        { row: 6, reason: "Institution code AICTE-9999 not found in registry", data: "Hostel water supply irregular" },
        { row: 7, reason: "Subject missing or too short", data: "Exam" },
      ]),
      startedAt: daysAgo(3, 9), finishedAt: daysAgo(3, 9),
    },
  });
  await appendAudit("IMPORT_RUN", { summary: "SIMULATED CPGRAMS import run: 8 rows, 5 imported, 1 duplicate skipped, 2 rejected", metadata: { simulated: true } });

  // ── Notifications ──
  await db.notification.createMany({
    data: [
      { recipientId: bureauK.id, caseId: null, type: "OVERDUE", title: "Case overdue: Coastal Institute hostel water shortage", message: "A case assigned to you crossed its demo SLA deadline without resolution and was escalated to the Reviewing Officer." },
      { recipientId: reviewer.id, caseId: null, type: "ESCALATION", title: "Escalation: overdue case at Coastal Institute", message: "An overdue case requires your review under the demo escalation policy." },
      { recipientId: college.id, caseId: null, type: "RESPONSE_REQUESTED", title: "Response requested: salary records (Green Valley case)", message: "The assigned officer requested a formal response with salary slips and PF challan for a pending case at your institution." },
      { recipientId: college.id, caseId: null, type: "REPORT_SENT", title: "Internal report received", message: "A demo accountability report was sent to your institution by the Reviewing Officer. Acknowledge it in your workspace." },
    ],
  });

  await appendAudit("DEMO_SEEDED", { summary: "Synthetic demo dataset created (institutions, users, cases, policies, templates, simulated import run). All records are clearly labeled demo data." });
}
