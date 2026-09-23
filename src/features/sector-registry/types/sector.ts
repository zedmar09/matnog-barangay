export type SectorCode = "senior" | "pwd" | "solo-parent" | "child" | "youth" | "osy" | "indigent" | "ip" | "4ps";
export type SectorMembershipStatus = "Active" | "Pending Review" | "Expired" | "Inactive";

export type SectorDefinition = {
  code: SectorCode;
  name: string;
  shortName: string;
  description: string;
  issuingOffice: string;
  color: string;
};

export type SectorMembership = {
  id: string;
  residentId: string;
  sectorCode: SectorCode;
  status: SectorMembershipStatus;
  validityStart: string;
  validityEnd: string;
  supportingDocuments: string[];
  certifiedByBarangay: boolean;
  certifiedAt: string;
  issuingOffice: string;
  referenceNumber: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
};

export type SectorMembershipInput = Pick<
  SectorMembership,
  "residentId" | "sectorCode" | "validityStart" | "validityEnd" | "supportingDocuments" | "remarks"
>;

export type CertificationStatus =
  | "Submitted"
  | "Barangay Certified"
  | "Municipal Review"
  | "Approved"
  | "Rejected"
  | "Cancelled";

export type SectorCertificationRequest = {
  id: string;
  requestNumber: string;
  membershipId: string;
  residentId: string;
  sectorCode: SectorCode;
  barangayId: string;
  status: CertificationStatus;
  requestedAt: string;
  barangayCertifiedBy: string;
  barangayCertifiedAt: string;
  municipalReviewedBy: string;
  municipalReviewedAt: string;
  decisionNote: string;
  updatedAt: string;
};

export type CredentialStatus =
  | "Pending Production"
  | "Ready for Release"
  | "Released"
  | "Expired"
  | "Replaced"
  | "Revoked";
export type CredentialType = "Sector ID" | "Booklet";

export type SectorCredential = {
  id: string;
  credentialNumber: string;
  membershipId: string;
  residentId: string;
  sectorCode: SectorCode;
  credentialType: CredentialType;
  status: CredentialStatus;
  issuedAt: string;
  expiresAt: string;
  releasedAt: string;
  releasedBy: string;
  replacementForId: string;
  reason: string;
  updatedAt: string;
};

export type EligibilityAlert = {
  id: string;
  residentId: string;
  membershipId: string;
  sectorCode: SectorCode;
  alertType: "Newly Eligible" | "Membership Expiring" | "Credential Expiring" | "Missing Documents" | "Renewal Overdue";
  severity: "High" | "Medium" | "Low";
  dueDate: string;
  status: "Open" | "Resolved" | "Dismissed";
  detail: string;
  createdAt: string;
  resolvedAt: string;
};

export type BenefitAvailment = {
  id: string;
  residentId: string;
  membershipId: string;
  sectorCode: SectorCode;
  benefitName: string;
  provider: string;
  amount: number;
  availedAt: string;
  referenceNumber: string;
};
