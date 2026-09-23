import type { IncidentParty } from "./blotter";

export type VawRiskLevel = "Critical" | "High" | "Moderate";
export type VawCaseStatus =
  | "Intake Review"
  | "Risk Assessment"
  | "BPO Pending"
  | "BPO Active"
  | "Referred"
  | "Monitoring"
  | "Closed";
export type ProtectionOrderStatus = "Pending" | "Active" | "Expired" | "Revoked";

export type ProtectionOrder = {
  id: string;
  number: string;
  issuedAt: string;
  expiresAt: string;
  status: ProtectionOrderStatus;
  conditions: string;
  servedAt: string;
};

export type VawAuditEvent = {
  id: string;
  action: string;
  actor: string;
  reason: string;
  occurredAt: string;
};

export type VawCase = {
  id: string;
  caseNumber: string;
  barangayId: string;
  survivor: IncidentParty;
  respondent: IncidentParty;
  classification: "Physical" | "Psychological" | "Economic" | "Sexual" | "Threat or Harassment";
  incidentAt: string;
  location: string;
  riskLevel: VawRiskLevel;
  status: VawCaseStatus;
  childrenAffected: number;
  narrative: string;
  safetyPlan: string;
  caseworker: string;
  referrals: string[];
  protectionOrders: ProtectionOrder[];
  lastContactAt: string;
  nextFollowUpAt: string;
  consentRecorded: boolean;
  auditTrail: VawAuditEvent[];
};

export type VawCaseInput = Pick<
  VawCase,
  | "barangayId"
  | "survivor"
  | "respondent"
  | "classification"
  | "incidentAt"
  | "location"
  | "riskLevel"
  | "childrenAffected"
  | "narrative"
  | "safetyPlan"
  | "consentRecorded"
>;
