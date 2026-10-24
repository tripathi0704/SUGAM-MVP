// Shared frontend types for S.U.G.A.M. 2.0
export interface User {
  id: string; name: string; email: string; primaryRole: string; roles: string[];
  phone: string | null; rollNo: string | null; designation: string | null; bureau: string | null;
  institutionId: string | null;
  institution: { id: string; code: string; name: string } | null;
}

export interface CaseRow {
  id: string; caseNumber: string; sourceSystem: string; sourceRecordId: string | null;
  institutionId: string; institution?: { id: string; code: string; name: string; permanentId?: string | null; region?: string | null };
  complainantId: string | null;
  complainant?: { id: string; name: string; masked: boolean } | null;
  category: string; categorySource: string; bureau: string | null; region?: string | null;
  subject: string; description: string; status: string; priority: string;
  assignedOfficerId: string | null; assignedOfficer?: { id: string; name: string } | null;
  dueAt: string | null; slaBreached: boolean; escalated: boolean;
  overlapFlag?: boolean; coordinationStatus?: string | null;
  transferredFromBureau?: string | null; transferReason?: string | null;
  nextActionLabel: string | null; nextActionDueAt: string | null;
  relatedCaseIds: string[]; masterIncidentId: string | null;
  resolvedAt: string | null; rating: number | null;
  ruleExplanation: string | null;
  createdAt: string; updatedAt: string; lastActionAt?: string;
  _count?: { events: number; evidenceFiles: number; responses: number };
}

export interface CaseEvent {
  id: string; caseId: string; eventType: string; summary: string;
  visibility: string; actorName: string | null; createdAt: string;
  actor?: { name: string; primaryRole: string } | null;
}

export interface EvidenceMeta {
  id: string; caseId: string; originalFileName: string; mimeType: string; sizeBytes: number;
  uploaderName: string | null; uploaderRole: string | null;
  accessLevel: string; verificationState: string; createdAt: string;
}

export interface CaseResponseRow {
  id: string; caseId: string; authorName: string | null; authorRole: string;
  message: string; requested: boolean; templateUsed: string | null;
  evidenceIds: string[]; createdAt: string;
}

export interface AssignmentRow {
  id: string; fromBureau: string | null; toBureau: string | null;
  fromOfficerId: string | null; toOfficerId: string | null;
  toOfficer?: { name: string } | null; reason: string | null; active: boolean; createdAt: string;
}

export interface Suggestion {
  id: string; primaryCaseId: string; candidateCaseId: string;
  primaryCaseNumber?: string; candidateCaseNumber?: string;
  candidateSubject?: string;
  score: number; algorithmVersion: string; reasons: string[];
  state: "PENDING" | "CONFIRMED" | "REJECTED";
  reviewedByName?: string | null; reviewReason?: string | null; createdAt: string;
}

export interface OverlapGroup {
  institutionId: string;
  institutionCode: string;
  institutionName: string;
  permanentId?: string | null;
  region?: string | null;
  state?: string | null;
  cases: CaseRow[];
  bureaus: string[];
  hasRegulationBureau: boolean;
  hasPGRC: boolean;
  coordinationStatus: string;
}

export interface NotificationRow {
  id: string; caseId: string | null; type: string; title: string; message: string;
  readAt: string | null; createdAt: string;
}

export interface InstitutionRow {
  id: string; code: string; name: string; state: string | null; district: string | null;
  permanentId?: string | null; region?: string | null; address?: string | null; approvalStatus?: string;
  dataSource: string; isSynthetic: boolean;
  totalCases?: number; openCases?: number; overdueCases?: number; resolvedCases?: number;
}

export interface Institution360 extends InstitutionRow {
  identifiers: string[];
  nodalOfficers: { name: string; email: string }[];
  cases: CaseRow[];
  score: { score: number | null; band: string; breakdown: { speed: number; sla: number; feedback: number }; note: string };
  reports: InternalReportRow[];
}

export interface AuditRow {
  id: string; sequence: number; actorEmail: string | null; action: string;
  targetType: string | null; targetId: string | null; summary: string;
  eventHash: string; previousHash: string; createdAt: string;
}

export interface InternalReportRow {
  id: string; institutionId: string; institution?: { code: string; name: string };
  caseNumber: string | null; subject: string; message: string; status: string;
  officerName: string | null; acknowledgedAt: string | null; createdAt: string;
}

export interface ReplyTemplateRow { id: string; title: string; category: string | null; body: string }

export interface SyncRunRow {
  id: string; sourceSystem: string; trigger: string; status: string;
  totalRows: number; importedRows: number; duplicateSkipped: number;
  rejectedRows: { row: number; reason: string; data?: string }[];
  startedAt: string; finishedAt: string | null;
}

export interface SummaryData {
  role: string;
  total: number; open: number; dueSoon: number; overdue: number; critical: number;
  unassigned: number; needsTriage: number; resolved: number;
  underProcess?: number; actionInitiated?: number; transferred?: number;
  overlapsCount?: number;
  byStatus: { status: string; count: number }[];
  byBureau: { bureau: string; count: number }[];
  byRegion?: { region: string; count: number }[];
  ageing: { bucket: string; count: number }[];
  priorityQueue: CaseRow[];
  recentEvents: { id: string; eventType: string; summary: string; createdAt: string; actorName: string | null; caseNumber: string | null }[];
  duplicateCandidates: number;
  mine?: { assigned: number; dueSoon: number; overdue: number };
  student?: { total: number; open: number; resolved: number };
  college?: { assigned: number; dueSoon: number; overdue: number; responseRequests: number; resolved: number };
  institutions?: number; users?: number;
}

export interface UserAdminRow {
  id: string; name: string; email: string; primaryRole: string; bureau: string | null;
  institution?: { code: string; name: string } | null; isActive: boolean; createdAt: string;
}
