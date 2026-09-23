export type IncidentType =
  | "Physical Injury"
  | "Threats"
  | "Property Dispute"
  | "Noise Complaint"
  | "Theft"
  | "Public Disturbance"
  | "Domestic Dispute"
  | "Other";
export type BlotterStatus = "Filed" | "Under Investigation" | "Referred to Lupon" | "Closed";
export type IncidentParty = {
  kind: "Resident" | "Non-Resident";
  residentId: string;
  fullName: string;
  contact: string;
  address: string;
};
export type BlotterAuditEvent = {
  id: string;
  action: string;
  actor: string;
  note: string;
  occurredAt: string;
};
export type BlotterRecord = {
  id: string;
  caseNumber: string;
  barangayId: string;
  incidentType: IncidentType;
  incidentAt: string;
  reportedAt: string;
  location: string;
  latitude: number;
  longitude: number;
  complainant: IncidentParty;
  respondent: IncidentParty;
  narrative: string;
  status: BlotterStatus;
  priority: "High" | "Standard";
  assignedOfficer: string;
  resolution: string;
  auditTrail: BlotterAuditEvent[];
};
export type BlotterInput = Pick<
  BlotterRecord,
  | "barangayId"
  | "incidentType"
  | "incidentAt"
  | "location"
  | "latitude"
  | "longitude"
  | "complainant"
  | "respondent"
  | "narrative"
  | "priority"
>;
