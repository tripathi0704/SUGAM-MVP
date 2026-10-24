// S.U.G.A.M. 2.0 — shared domain constants (§1.2 roles, §6 status model, §8.2 labels)
// SIH 2026 · PS 26264 · AICTE Complaint Monitoring & Tracking

export const ROLES = [
  "COMPLAINANT",
  "INSTITUTION_OFFICER",
  "INTAKE_OFFICER",
  "BUREAU_OFFICER",
  "REVIEWING_OFFICER",
  "AUDITOR",
  "PLATFORM_ADMIN",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  COMPLAINANT: "Student / Faculty",
  INSTITUTION_OFFICER: "College Nodal Officer",
  INTAKE_OFFICER: "Intake / Registry Officer",
  BUREAU_OFFICER: "Bureau Officer",
  REVIEWING_OFFICER: "Reviewing Officer",
  AUDITOR: "Auditor",
  PLATFORM_ADMIN: "Platform Admin",
};

export const STATUSES = [
  "RECEIVED", "NEEDS_TRIAGE", "ASSIGNED", "UNDER_PROCESS", "ACTION_INITIATED",
  "IN_REVIEW", "COORDINATION_REQUIRED", "WAITING_FOR_INFORMATION",
  "ACTION_REQUIRED", "PENDING_REVIEW", "RESOLVED", "TRANSFERRED", "CLOSED", "REOPENED",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Received",
  NEEDS_TRIAGE: "Needs Triage",
  ASSIGNED: "Assigned",
  UNDER_PROCESS: "Under Process",
  ACTION_INITIATED: "Action Initiated",
  IN_REVIEW: "In Review",
  COORDINATION_REQUIRED: "Coordination Required",
  WAITING_FOR_INFORMATION: "Waiting for Info",
  ACTION_REQUIRED: "Action Required",
  PENDING_REVIEW: "Pending Review",
  RESOLVED: "Disposed / Resolved",
  TRANSFERRED: "Transferred",
  CLOSED: "Closed",
  REOPENED: "Reopened",
};

// Statuses counted as "open / pending" for KPIs
export const OPEN_STATUSES = [
  "RECEIVED", "NEEDS_TRIAGE", "ASSIGNED", "UNDER_PROCESS", "ACTION_INITIATED",
  "IN_REVIEW", "COORDINATION_REQUIRED", "WAITING_FOR_INFORMATION", "ACTION_REQUIRED", "PENDING_REVIEW", "REOPENED",
];

// §6 — permitted transitions. API enforces: wrong transitions → 400 with explanation.
export const TRANSITIONS: Record<string, { to: string[]; roles: Role[]; requireReason?: boolean }> = {
  RECEIVED: {
    to: ["NEEDS_TRIAGE", "UNDER_PROCESS", "ACTION_INITIATED"],
    roles: ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER"],
  },
  NEEDS_TRIAGE: {
    to: ["ASSIGNED", "UNDER_PROCESS", "ACTION_INITIATED", "TRANSFERRED"],
    roles: ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER"],
  },
  ASSIGNED: {
    to: ["IN_REVIEW", "UNDER_PROCESS", "ACTION_INITIATED", "COORDINATION_REQUIRED", "TRANSFERRED", "NEEDS_TRIAGE"],
    roles: ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER"],
  },
  UNDER_PROCESS: {
    to: ["IN_REVIEW", "COORDINATION_REQUIRED", "WAITING_FOR_INFORMATION", "ACTION_REQUIRED", "RESOLVED", "TRANSFERRED"],
    roles: ["BUREAU_OFFICER", "REVIEWING_OFFICER"],
  },
  ACTION_INITIATED: {
    to: ["IN_REVIEW", "COORDINATION_REQUIRED", "WAITING_FOR_INFORMATION", "ACTION_REQUIRED", "RESOLVED", "TRANSFERRED"],
    roles: ["BUREAU_OFFICER", "REVIEWING_OFFICER"],
  },
  IN_REVIEW: {
    to: ["WAITING_FOR_INFORMATION", "ACTION_REQUIRED", "COORDINATION_REQUIRED", "PENDING_REVIEW", "RESOLVED", "TRANSFERRED"],
    roles: ["BUREAU_OFFICER", "REVIEWING_OFFICER"],
    requireReason: true,
  },
  COORDINATION_REQUIRED: {
    to: ["IN_REVIEW", "ACTION_INITIATED", "UNDER_PROCESS", "RESOLVED", "TRANSFERRED"],
    roles: ["BUREAU_OFFICER", "REVIEWING_OFFICER"],
    requireReason: true,
  },
  WAITING_FOR_INFORMATION: {
    to: ["IN_REVIEW", "UNDER_PROCESS", "ACTION_REQUIRED"],
    roles: ["BUREAU_OFFICER", "REVIEWING_OFFICER"],
    requireReason: true,
  },
  ACTION_REQUIRED: {
    to: ["PENDING_REVIEW", "IN_REVIEW", "RESOLVED"],
    roles: ["BUREAU_OFFICER", "REVIEWING_OFFICER"],
    requireReason: true,
  },
  PENDING_REVIEW: {
    to: ["RESOLVED", "IN_REVIEW"],
    roles: ["BUREAU_OFFICER", "REVIEWING_OFFICER"],
    requireReason: true,
  },
  TRANSFERRED: {
    to: ["ASSIGNED", "UNDER_PROCESS", "IN_REVIEW"],
    roles: ["INTAKE_OFFICER", "REVIEWING_OFFICER"],
    requireReason: true,
  },
  RESOLVED: {
    to: ["CLOSED", "REOPENED"],
    roles: ["REVIEWING_OFFICER"],
    requireReason: true,
  },
  CLOSED: {
    to: ["REOPENED"],
    roles: ["REVIEWING_OFFICER"],
    requireReason: true,
  },
  REOPENED: {
    to: ["NEEDS_TRIAGE", "IN_REVIEW", "UNDER_PROCESS"],
    roles: ["INTAKE_OFFICER", "BUREAU_OFFICER", "REVIEWING_OFFICER"],
  },
};

export const PRIORITIES = ["LOW", "NORMAL", "HIGH", "CRITICAL"] as const;

export const CATEGORIES = [
  "FEE_REFUND", "CAPITATION_FEE", "UNAUTHORIZED_COURSE", "FACULTY_NORMS",
  "STUDENT_GRIEVANCE", "SCHOLARSHIP", "RAGGING", "APPROVAL_DOC",
  "HOSTEL", "EXAM_CELL", "INFRASTRUCTURE", "OTHER",
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  FEE_REFUND: "Fee Refund & Excess Fee",
  CAPITATION_FEE: "Capitation / Donation Fee Violation",
  UNAUTHORIZED_COURSE: "Unapproved Course / Intake Expansion",
  FACULTY_NORMS: "Faculty Norms & Salary Non-payment",
  STUDENT_GRIEVANCE: "Student Grievance & Harassment",
  SCHOLARSHIP: "Scholarship & Freeship Delay",
  RAGGING: "Anti-Ragging Violation",
  APPROVAL_DOC: "AICTE Approval & EoA Documents",
  HOSTEL: "Hostel & Living Conditions",
  EXAM_CELL: "Examination & Result Irregularities",
  INFRASTRUCTURE: "Campus Infrastructure Deficiencies",
  OTHER: "Other Grievances",
};

// AICTE Bureaus & Cells (PS 26264: Regulation Bureau & PGRC are primary)
export const BUREAUS = [
  "REGULATION_BUREAU", "PGRC", "APPROVAL_BUREAU", "POLICY_BUREAU",
  "ANTI_RAGGING_CELL", "FACULTY_CELL", "EXAM_CELL", "SCHOLARSHIP_CELL",
] as const;

export const BUREAU_LABELS: Record<string, string> = {
  REGULATION_BUREAU: "Regulation Bureau (RB)",
  PGRC: "Public Grievance Redressal Cell (PGRC)",
  APPROVAL_BUREAU: "Approval Bureau (AB)",
  POLICY_BUREAU: "Policy & Academic Planning Bureau",
  ANTI_RAGGING_CELL: "Anti-Ragging Cell",
  FACULTY_CELL: "Faculty & Staff Grievance Cell",
  EXAM_CELL: "Examination Cell",
  SCHOLARSHIP_CELL: "Scholarship & Fee Cell",
};

// AICTE Regional Offices
export const AICTE_REGIONS = [
  "NORTHERN", "NORTH_WESTERN", "WESTERN", "EASTERN", "SOUTHERN", "SOUTH_WESTERN", "CENTRAL", "SOUTH_CENTRAL",
] as const;
export type AicteRegion = (typeof AICTE_REGIONS)[number];

export const REGION_LABELS: Record<string, string> = {
  NORTHERN: "Northern Region (Kanpur)",
  NORTH_WESTERN: "North-Western Region (Chandigarh)",
  WESTERN: "Western Region (Mumbai)",
  EASTERN: "Eastern Region (Kolkata)",
  SOUTHERN: "Southern Region (Chennai)",
  SOUTH_WESTERN: "South-Western Region (Bengaluru)",
  CENTRAL: "Central Region (Bhopal)",
  SOUTH_CENTRAL: "South-Central Region (Hyderabad)",
};

export const SOURCES = ["DEMO_PORTAL", "DEMO_CPGRAMS"] as const;
export const SOURCE_LABELS: Record<string, string> = {
  DEMO_PORTAL: "S.U.G.A.M. Portal",
  DEMO_CPGRAMS: "SIMULATED CPGRAMS Import",
};

// Demo policy (policyConfigs). NOT statutory deadlines — always shown as demo config.
export const DEMO_POLICY = {
  version: "DEMO-POLICY-v1",
  slaDaysByPriority: { CRITICAL: 1, HIGH: 3, NORMAL: 15, LOW: 20 } as Record<string, number>,
  dueSoonDays: 3,
};
