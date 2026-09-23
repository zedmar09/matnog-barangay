export type DocumentTemplateCode =
  | "barangay-clearance"
  | "residency"
  | "indigency"
  | "good-moral"
  | "first-time-jobseeker"
  | "no-pending-case";

export type DocumentTemplate = {
  code: DocumentTemplateCode;
  shortCode: string;
  name: string;
  description: string;
  defaultPurpose: string;
  fee: number;
  requiresOr: boolean;
};

export type IssuedDocumentStatus =
  | "Draft"
  | "Pending Review"
  | "For Approval"
  | "Ready for Release"
  | "Released"
  | "Rejected"
  | "Revoked";

export type DocumentAuditEvent = {
  id: string;
  action: string;
  actor: string;
  note: string;
  occurredAt: string;
};

export type IssuedDocument = {
  id: string;
  controlNumber: string;
  templateCode: DocumentTemplateCode;
  residentId: string;
  barangayId: string;
  purpose: string;
  issueDate: string;
  officialReceipt: string;
  amountPaid: number;
  punongBarangay: string;
  barangaySecretary: string;
  status: IssuedDocumentStatus;
  requestedAt: string;
  updatedAt: string;
  releasedAt: string;
  releasedTo: string;
  paymentVerified: boolean;
  reviewNote: string;
  reprintCount: number;
  auditTrail: DocumentAuditEvent[];
  verificationToken: string;
};

export type ReprintRequest = {
  id: string;
  documentId: string;
  reason: string;
  requestedBy: string;
  status: "Pending" | "Approved" | "Printed" | "Rejected";
  requestedAt: string;
  reviewedAt: string;
  reviewedBy: string;
};

export type RevocationRecord = {
  id: string;
  documentId: string;
  reason: string;
  revokedAt: string;
  revokedBy: string;
};
