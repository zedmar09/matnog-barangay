import type { Resident } from "@/features/resident-registry/types/resident";

import type { IssuedDocument, IssuedDocumentStatus } from "../types/document";
import { DOCUMENT_TEMPLATES } from "./document-templates";

export function createIssuedDocumentDummyData(residents: Resident[]) {
  const statuses: IssuedDocumentStatus[] = [
    "Released",
    "Released",
    "Ready for Release",
    "For Approval",
    "Pending Review",
    "Draft",
  ];
  return residents.slice(0, 180).map((resident, index): IssuedDocument => {
    const template = DOCUMENT_TEMPLATES[index % DOCUMENT_TEMPLATES.length];
    const status = statuses[index % statuses.length];
    const date = `2026-${String((index % 9) + 1).padStart(2, "0")}-${String((index % 25) + 1).padStart(2, "0")}`;
    return {
      id: `document-${String(index + 1).padStart(6, "0")}`,
      controlNumber: `${template.shortCode}-2026-${String(index + 1).padStart(6, "0")}`,
      templateCode: template.code,
      residentId: resident.id,
      barangayId: resident.address.barangayId,
      purpose: template.defaultPurpose,
      issueDate: date,
      officialReceipt: template.requiresOr ? `OR-${String(820000 + index)}` : "",
      amountPaid: template.fee,
      punongBarangay: "Hon. Maria L. Santos",
      barangaySecretary: "Ana P. Reyes",
      status,
      requestedAt: `${date}T08:15:00.000Z`,
      updatedAt: `${date}T14:00:00.000Z`,
      releasedAt: status === "Released" ? `${date}T14:00:00.000Z` : "",
      releasedTo: status === "Released" ? `${resident.firstName} ${resident.lastName}` : "",
      paymentVerified: status === "Released" || status === "Ready for Release" || !template.requiresOr,
      reviewNote: status === "Draft" ? "Complete the required request information." : "Resident details verified.",
      reprintCount: index % 19 === 0 ? 1 : 0,
      auditTrail: [
        {
          id: `document-audit-${index + 1}-1`,
          action: "Request created",
          actor: "Barangay Front Desk",
          note: "Resident identity and requested document recorded.",
          occurredAt: `${date}T08:15:00.000Z`,
        },
        ...(status === "Draft"
          ? []
          : [
              {
                id: `document-audit-${index + 1}-2`,
                action: status,
                actor: status === "For Approval" ? "Barangay Secretary" : "Barangay Document Officer",
                note: "Resident details and documentary requirements checked.",
                occurredAt: `${date}T10:30:00.000Z`,
              },
            ]),
      ],
      verificationToken: `matnog-document-${String(index + 1).padStart(8, "0")}`,
    };
  });
}
