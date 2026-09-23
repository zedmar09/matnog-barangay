import type { IncidentParty } from "./blotter";

export type JusticeStage =
  | "For Summons"
  | "Lupon Conciliation"
  | "Pangkat Hearing"
  | "Settlement"
  | "Repudiation Period"
  | "For CFA"
  | "CFA Issued"
  | "Closed";

export type SummonsStatus = "Pending" | "Served" | "Failed Service";
export type HearingStatus = "Scheduled" | "Completed" | "Reset" | "Cancelled";

export type JusticeHearing = {
  id: string;
  type: "Lupon Conciliation" | "Pangkat Hearing";
  scheduledAt: string;
  venue: string;
  status: HearingStatus;
  complainantSummons: SummonsStatus;
  respondentSummons: SummonsStatus;
  notes: string;
};

export type JusticeAuditEvent = {
  id: string;
  action: string;
  actor: string;
  note: string;
  occurredAt: string;
};

export type JusticeCase = {
  id: string;
  caseNumber: string;
  barangayId: string;
  sourceBlotterId: string;
  sourceBlotterNumber: string;
  subject: string;
  complainant: IncidentParty;
  respondent: IncidentParty;
  filedAt: string;
  stage: JusticeStage;
  statutoryDeadline: string;
  luponChairperson: string;
  pangkatMembers: string[];
  hearings: JusticeHearing[];
  outcome: "" | "Settled" | "Failed";
  settlementTerms: string;
  repudiationDeadline: string;
  cfaNumber: string;
  cfaIssuedAt: string;
  auditTrail: JusticeAuditEvent[];
};

export type JusticeCaseInput = Pick<
  JusticeCase,
  | "barangayId"
  | "sourceBlotterId"
  | "sourceBlotterNumber"
  | "subject"
  | "complainant"
  | "respondent"
  | "luponChairperson"
>;
