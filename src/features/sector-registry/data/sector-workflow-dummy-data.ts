import type { Resident } from "@/features/resident-registry/types/resident";

import type {
  BenefitAvailment,
  CertificationStatus,
  CredentialStatus,
  EligibilityAlert,
  SectorCertificationRequest,
  SectorCredential,
  SectorMembership,
} from "../types/sector";

const certificationStatuses: CertificationStatus[] = [
  "Submitted",
  "Barangay Certified",
  "Municipal Review",
  "Approved",
  "Rejected",
];
const credentialStatuses: CredentialStatus[] = [
  "Released",
  "Released",
  "Released",
  "Ready for Release",
  "Pending Production",
  "Expired",
];
const benefitNames = [
  "Medicine Assistance",
  "Food Pack Distribution",
  "Educational Assistance",
  "Livelihood Support",
  "Transportation Assistance",
  "Medical Consultation",
];

export function createSectorWorkflowDummyData(residents: Resident[], memberships: SectorMembership[]) {
  const residentById = new Map(residents.map((resident) => [resident.id, resident]));
  const eligibleMemberships = memberships.filter((item) => item.status !== "Inactive");

  const certificationRequests: SectorCertificationRequest[] = eligibleMemberships
    .slice(0, 360)
    .map((membership, index) => {
      const status = certificationStatuses[index % certificationStatuses.length];
      const resident = residentById.get(membership.residentId);
      const date = `2026-${String((index % 8) + 1).padStart(2, "0")}-${String((index % 25) + 1).padStart(2, "0")}`;
      return {
        id: `sector-certification-${String(index + 1).padStart(5, "0")}`,
        requestNumber: `CERT-2026-${String(index + 1).padStart(6, "0")}`,
        membershipId: membership.id,
        residentId: membership.residentId,
        sectorCode: membership.sectorCode,
        barangayId: resident?.address.barangayId ?? "",
        status,
        requestedAt: `${date}T08:00:00.000Z`,
        barangayCertifiedBy: status === "Submitted" ? "" : "Barangay Registry Officer",
        barangayCertifiedAt: status === "Submitted" ? "" : `${date}T10:15:00.000Z`,
        municipalReviewedBy: status === "Approved" || status === "Rejected" ? "Municipal Sector Desk" : "",
        municipalReviewedAt: status === "Approved" || status === "Rejected" ? `${date}T14:30:00.000Z` : "",
        decisionNote:
          status === "Rejected"
            ? "Supporting proof requires correction."
            : status === "Approved"
              ? "Eligibility and submitted documents verified."
              : "Request is moving through the certification workflow.",
        updatedAt: `${date}T14:30:00.000Z`,
      };
    });

  const credentials: SectorCredential[] = eligibleMemberships.slice(40, 760).map((membership, index) => {
    const status = credentialStatuses[index % credentialStatuses.length];
    const issuedYear = status === "Expired" ? 2022 : 2026;
    const credentialType =
      ["senior", "pwd", "solo-parent", "4ps"].includes(membership.sectorCode) && index % 3 === 0
        ? "Booklet"
        : "Sector ID";
    return {
      id: `sector-credential-${String(index + 1).padStart(5, "0")}`,
      credentialNumber: `${credentialType === "Booklet" ? "BKT" : "SID"}-${membership.sectorCode.toUpperCase()}-${String(index + 1).padStart(6, "0")}`,
      membershipId: membership.id,
      residentId: membership.residentId,
      sectorCode: membership.sectorCode,
      credentialType,
      status,
      issuedAt: `${issuedYear}-${String((index % 9) + 1).padStart(2, "0")}-12`,
      expiresAt: `${issuedYear + 3}-${String((index % 9) + 1).padStart(2, "0")}-11`,
      releasedAt:
        status === "Released" || status === "Expired"
          ? `${issuedYear}-${String((index % 9) + 1).padStart(2, "0")}-15`
          : "",
      releasedBy: status === "Released" || status === "Expired" ? "Municipal Releasing Officer" : "",
      replacementForId: "",
      reason: status === "Expired" ? "Validity period completed." : "Initial issuance",
      updatedAt: `${issuedYear}-${String((index % 9) + 1).padStart(2, "0")}-15T09:00:00.000Z`,
    };
  });

  const alerts: EligibilityAlert[] = eligibleMemberships.slice(120, 360).map((membership, index) => {
    const types: EligibilityAlert["alertType"][] = [
      "Newly Eligible",
      "Membership Expiring",
      "Credential Expiring",
      "Missing Documents",
      "Renewal Overdue",
    ];
    const alertType = types[index % types.length];
    return {
      id: `sector-alert-${String(index + 1).padStart(5, "0")}`,
      residentId: membership.residentId,
      membershipId: membership.id,
      sectorCode: membership.sectorCode,
      alertType,
      severity: index % 5 === 0 ? "High" : index % 2 === 0 ? "Medium" : "Low",
      dueDate: `2026-${String((index % 3) + 10).padStart(2, "0")}-${String((index % 25) + 1).padStart(2, "0")}`,
      status: index % 11 === 0 ? "Resolved" : "Open",
      detail:
        alertType === "Newly Eligible"
          ? "Resident now meets the configured age or profile eligibility rule."
          : `${alertType} requires barangay staff follow-up.`,
      createdAt: "2026-09-01T08:00:00.000Z",
      resolvedAt: index % 11 === 0 ? "2026-09-10T09:00:00.000Z" : "",
    };
  });

  const benefits: BenefitAvailment[] = eligibleMemberships.slice(0, 900).map((membership, index) => ({
    id: `sector-benefit-${String(index + 1).padStart(5, "0")}`,
    residentId: membership.residentId,
    membershipId: membership.id,
    sectorCode: membership.sectorCode,
    benefitName: benefitNames[index % benefitNames.length],
    provider: index % 3 === 0 ? "MSWDO Matnog" : index % 3 === 1 ? "Barangay Council" : "Municipal Health Office",
    amount: index % 4 === 0 ? 1500 : index % 4 === 1 ? 750 : 0,
    availedAt: `2026-${String((index % 9) + 1).padStart(2, "0")}-${String((index % 25) + 1).padStart(2, "0")}`,
    referenceNumber: `BEN-2026-${String(index + 1).padStart(6, "0")}`,
  }));

  return { certificationRequests, credentials, alerts, benefits };
}
