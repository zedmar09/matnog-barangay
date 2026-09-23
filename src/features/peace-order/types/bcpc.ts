import type { IncidentParty } from "./blotter";

export type BcpcClassification = "Child at Risk" | "Child in Conflict with the Law";
export type BcpcRiskLevel = "Urgent" | "High" | "Moderate";
export type BcpcCaseStatus =
  | "Intake"
  | "Assessment"
  | "Intervention Plan"
  | "Diversion"
  | "Referred"
  | "Monitoring"
  | "Closed";

export type CaseConference = {
  id: string;
  scheduledAt: string;
  venue: string;
  participants: string[];
  status: "Scheduled" | "Completed" | "Reset";
  notes: string;
};

export type BcpcAuditEvent = {
  id: string;
  action: string;
  actor: string;
  reason: string;
  occurredAt: string;
};

export type BcpcCase = {
  id: string;
  caseNumber: string;
  barangayId: string;
  child: IncidentParty;
  childAge: number;
  guardian: IncidentParty;
  classification: BcpcClassification;
  riskLevel: BcpcRiskLevel;
  status: BcpcCaseStatus;
  intakeAt: string;
  presentingConcern: string;
  assessment: string;
  interventionPlan: string;
  diversionPlan: string;
  caseworker: string;
  referrals: string[];
  conferences: CaseConference[];
  nextFollowUpAt: string;
  consentOrAuthority: string;
  auditTrail: BcpcAuditEvent[];
};

export type BcpcCaseInput = Pick<
  BcpcCase,
  | "barangayId"
  | "child"
  | "childAge"
  | "guardian"
  | "classification"
  | "riskLevel"
  | "presentingConcern"
  | "assessment"
  | "interventionPlan"
  | "consentOrAuthority"
>;
