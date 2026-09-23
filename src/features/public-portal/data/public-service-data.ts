export type PublicDocumentStatus = "Valid" | "Expired" | "Revoked";

export type PublicDocumentRecord = {
  reference: string;
  token: string;
  type: string;
  barangayId: string;
  issuedAt: string;
  validUntil: string;
  status: PublicDocumentStatus;
  note: string;
};

export type PublicFeedbackStatus = "Received" | "Under review" | "Resolved";

export type PublicFeedbackRecord = {
  reference: string;
  barangayId: string;
  category: string;
  subject: string;
  projectId: string;
  status: PublicFeedbackStatus;
  submittedAt: string;
  updatedAt: string;
  update: string;
};

export const PUBLIC_DOCUMENT_RECORDS: PublicDocumentRecord[] = [
  {
    reference: "BC-2026-000001",
    token: "matnog-document-00000001",
    type: "Barangay Clearance",
    barangayId: "0506212033",
    issuedAt: "2026-09-18",
    validUntil: "2027-09-18",
    status: "Valid",
    note: "This document is active and was issued through the Matnog Barangay Affairs System.",
  },
  {
    reference: "BR-2026-000014",
    token: "matnog-document-00000014",
    type: "Certificate of Residency",
    barangayId: "0506212016",
    issuedAt: "2026-07-04",
    validUntil: "2027-07-04",
    status: "Valid",
    note: "This document is active and was issued through the Matnog Barangay Affairs System.",
  },
  {
    reference: "BC-2025-000099",
    token: "matnog-document-00000099",
    type: "Barangay Clearance",
    barangayId: "0506212033",
    issuedAt: "2025-05-10",
    validUntil: "2026-05-10",
    status: "Expired",
    note: "This document is no longer within its stated validity period.",
  },
];

export const PUBLIC_FEEDBACK_RECORDS: PublicFeedbackRecord[] = [
  {
    reference: "FB-2609-00001",
    barangayId: "0506212033",
    category: "Suggestion",
    subject: "Additional waiting area",
    projectId: "",
    status: "Under review",
    submittedAt: "2026-09-20T09:15:00.000Z",
    updatedAt: "2026-09-22T08:30:00.000Z",
    update: "Forwarded to the barangay administration for assessment.",
  },
  {
    reference: "FB-2609-00002",
    barangayId: "0506212016",
    category: "Project observation",
    subject: "Street light project coverage",
    projectId: "PUB-PRJ-0002",
    status: "Resolved",
    submittedAt: "2026-09-16T03:40:00.000Z",
    updatedAt: "2026-09-19T07:10:00.000Z",
    update: "The field team confirmed the installation area and published the latest project update.",
  },
];

export function findPublicDocument(query: string) {
  const normalized = query.trim().toLowerCase();
  return PUBLIC_DOCUMENT_RECORDS.find(
    (document) => document.reference.toLowerCase() === normalized || document.token.toLowerCase() === normalized,
  );
}
