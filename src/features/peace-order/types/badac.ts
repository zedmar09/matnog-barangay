import type { IncidentParty } from "./blotter";

export type BadacRecordType = "Community Report" | "Voluntary Referral" | "Intervention Client" | "Agency Endorsement";
export type BadacPriority = "Urgent" | "High" | "Standard";
export type BadacStatus =
  | "Restricted Intake"
  | "Validation Review"
  | "Intervention"
  | "Agency Referral"
  | "Monitoring"
  | "Closed";

export type BadacAction = {
  id: string;
  type: "Validation Meeting" | "Intervention Conference" | "Agency Coordination" | "Monitoring Visit";
  scheduledAt: string;
  venue: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  notes: string;
};

export type BadacAuditEvent = {
  id: string;
  action: string;
  actor: string;
  accessReason: string;
  occurredAt: string;
};

export type BadacRecord = {
  id: string;
  recordNumber: string;
  barangayId: string;
  subject: IncidentParty;
  recordType: BadacRecordType;
  priority: BadacPriority;
  status: BadacStatus;
  intakeAt: string;
  sourceClass: "Confidential Community Source" | "Self-Referral" | "Authorized Agency";
  concernSummary: string;
  validationNotes: string;
  interventionPlan: string;
  assignedOfficer: string;
  agencyReferrals: string[];
  actions: BadacAction[];
  nextReviewAt: string;
  lawfulBasis: string;
  auditTrail: BadacAuditEvent[];
};

export type BadacRecordInput = Pick<
  BadacRecord,
  | "barangayId"
  | "subject"
  | "recordType"
  | "priority"
  | "sourceClass"
  | "concernSummary"
  | "validationNotes"
  | "interventionPlan"
  | "lawfulBasis"
>;
