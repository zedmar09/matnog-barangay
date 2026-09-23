export type ResidentStatus = "Active" | "Inactive" | "Transferred Out" | "Deceased" | "Merged";
export type PhilSysStatus = "Not Provided" | "On File" | "Verified" | "Verification Pending" | "Needs Review";

export type ResidentAddress = {
  region: string;
  province: string;
  municipality: string;
  barangayId: string;
  district: string;
  purok: string;
  sitio: string;
  zone: string;
  subdivision: string;
  street: string;
  buildingName: string;
  houseUnit: string;
  lotNumber: string;
  blockNumber: string;
  phase: string;
  postalCode: string;
  landmark: string;
};

export type ResidentContact = {
  primaryMobile: string;
  secondaryMobile: string;
  landline: string;
  email: string;
};

export type Resident = {
  id: string;
  lrn: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  nickname: string;
  previousLastName: string;
  mothersMaidenName: string;
  birthDate: string;
  birthLocality: string;
  birthBarangay: string;
  birthMunicipality: string;
  birthProvince: string;
  birthRegion: string;
  birthCountry: string;
  gender: string;
  civilStatus: string;
  primaryCitizenship: string;
  secondaryCitizenship: string;
  employmentStatus: string;
  occupation: string;
  employerName: string;
  workplaceAddress: string;
  address: ResidentAddress;
  contact: ResidentContact;
  isPwd: boolean;
  residentStatus: ResidentStatus;
  photoUrl: string;
  philsysStatus: PhilSysStatus;
  philsysMockToken: string;
  philsysMockHash: string;
  registrationDate: string;
  createdAt: string;
  updatedAt: string;
};

export type ResidentInput = Omit<
  Resident,
  | "id"
  | "lrn"
  | "createdAt"
  | "updatedAt"
  | "registrationDate"
  | "philsysStatus"
  | "philsysMockToken"
  | "philsysMockHash"
> & {
  philsysReference?: string;
};

export type ResidentFilters = {
  search: string;
  purok: string;
  gender: string;
  civilStatus: string;
  residentStatus: string;
  senior: string;
  pwd: string;
  lrn: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  nickname: string;
  birthDateFrom: string;
  birthDateTo: string;
  ageFrom: string;
  ageTo: string;
  birthLocality: string;
  birthMunicipality: string;
  birthProvince: string;
  birthRegion: string;
  birthCountry: string;
  primaryCitizenship: string;
  secondaryCitizenship: string;
  barangayId: string;
  sitio: string;
  zone: string;
  street: string;
  subdivision: string;
  postalCode: string;
  employmentStatus: string;
  occupation: string;
  employer: string;
  hasMobile: string;
  hasSecondaryMobile: string;
  hasLandline: string;
  hasEmail: string;
  completeness: string;
  philsys: string;
  registrationDateFrom: string;
  registrationDateTo: string;
  updatedFrom: string;
  updatedTo: string;
};

export type ResidentSortKey =
  | "lrn"
  | "name"
  | "barangay"
  | "birthDate"
  | "age"
  | "civilStatus"
  | "purok"
  | "occupation"
  | "residentStatus"
  | "updatedAt";

export type DuplicateStatus = "Pending Review" | "Deferred" | "Different People" | "Merged" | "Reversed";
export type DuplicateRisk = "Very High" | "High" | "Possible";

export type DuplicateCandidate = {
  id: string;
  residentAId: string;
  residentBId: string;
  score: number;
  risk: DuplicateRisk;
  signals: string[];
  status: DuplicateStatus;
  detectedAt: string;
  reviewer: string;
  reviewedAt: string;
  note: string;
};

export type MergeFieldKey =
  | "firstName"
  | "middleName"
  | "lastName"
  | "suffix"
  | "nickname"
  | "previousLastName"
  | "mothersMaidenName"
  | "birthDate"
  | "gender"
  | "civilStatus"
  | "primaryCitizenship"
  | "primaryMobile"
  | "email"
  | "barangayId"
  | "purok"
  | "sitio"
  | "street"
  | "houseUnit";

export type MergeLog = {
  id: string;
  candidateId: string;
  survivingResidentId: string;
  retiredResidentId: string;
  survivingLrn: string;
  retiredLrn: string;
  reviewer: string;
  reason: string;
  mergedAt: string;
  reversedAt: string;
  reversalReason: string;
  beforeSurvivor: Resident;
  beforeRetired: Resident;
  fieldSelections: Partial<Record<MergeFieldKey, "a" | "b">>;
};

export type TransferStatus =
  | "Requested"
  | "Awaiting Acceptance"
  | "Accepted"
  | "Rejected"
  | "Clarification Requested"
  | "Cancelled";

export type ResidencyEntry = {
  id: string;
  residentId: string;
  barangayId: string;
  startDate: string;
  endDate: string;
  transferId: string;
  status: "Current" | "Historical";
  processedBy: string;
  remarks: string;
};

export type TransferTransaction = {
  id: string;
  referenceNumber: string;
  residentId: string;
  originBarangayId: string;
  destinationBarangayId: string;
  requestedEffectiveDate: string;
  reason: string;
  supportingDocumentCount: number;
  status: TransferStatus;
  requestedBy: string;
  requestedAt: string;
  releasedBy: string;
  releasedAt: string;
  reviewedBy: string;
  reviewedAt: string;
  completedAt: string;
  decisionReason: string;
  updatedAt: string;
};

export type TransferInput = Pick<
  TransferTransaction,
  "residentId" | "destinationBarangayId" | "requestedEffectiveDate" | "reason" | "supportingDocumentCount"
>;

export type LifeEventType = "Birth" | "Death" | "Marriage" | "Civil Status Change" | "Migration In" | "Migration Out";
export type LifeEventStatus = "Pending Review" | "Approved" | "Rejected" | "Clarification Requested" | "Cancelled";

export type LifeEventDetails = {
  proposedFirstName: string;
  proposedMiddleName: string;
  proposedLastName: string;
  proposedGender: string;
  proposedCivilStatus: string;
  proposedMarriedName: string;
  motherName: string;
  destination: string;
  causeOrBasis: string;
};

export type LifeEvent = {
  id: string;
  referenceNumber: string;
  residentId: string;
  generatedResidentId: string;
  eventType: LifeEventType;
  effectiveDate: string;
  registrationDate: string;
  barangayId: string;
  supportingDocumentCount: number;
  details: LifeEventDetails;
  status: LifeEventStatus;
  requestedBy: string;
  requestedAt: string;
  reviewedBy: string;
  reviewedAt: string;
  decisionReason: string;
  updatedAt: string;
};

export type LifeEventInput = Pick<
  LifeEvent,
  | "residentId"
  | "eventType"
  | "effectiveDate"
  | "registrationDate"
  | "barangayId"
  | "supportingDocumentCount"
  | "details"
>;

export type IdentityMediaStatus = "Verified" | "Pending Review" | "Recapture Required" | "Missing";

export type ResidentIdentityMedia = {
  residentId: string;
  photoUrl: string;
  signatureUrl: string;
  photoCapturedAt: string;
  signatureCapturedAt: string;
  capturedBy: string;
  status: IdentityMediaStatus;
  verifiedBy: string;
  verifiedAt: string;
};

export type MediaReviewStatus = "Pending Review" | "Approved" | "Rejected" | "Recapture Required";

export type IdentityMediaReview = {
  id: string;
  referenceNumber: string;
  residentId: string;
  proposedPhotoUrl: string;
  proposedSignatureUrl: string;
  status: MediaReviewStatus;
  replacementReason: string;
  qualityNotes: string[];
  requestedBy: string;
  requestedAt: string;
  reviewedBy: string;
  reviewedAt: string;
  decisionReason: string;
};

export type IdentityMediaInput = Pick<
  IdentityMediaReview,
  "residentId" | "proposedPhotoUrl" | "proposedSignatureUrl" | "replacementReason" | "qualityNotes"
>;

export type ResidentIdStatus =
  | "Pending Generation"
  | "Generated"
  | "Printed"
  | "Released"
  | "Expired"
  | "Revoked"
  | "Lost"
  | "Replaced";

export type ResidentIdCard = {
  id: string;
  cardNumber: string;
  residentId: string;
  barangayId: string;
  verificationToken: string;
  status: ResidentIdStatus;
  issueDate: string;
  expirationDate: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  issuingAuthority: string;
  generatedBy: string;
  generatedAt: string;
  printedBy: string;
  printedAt: string;
  releasedTo: string;
  releasedBy: string;
  releasedAt: string;
  replacementForId: string;
  actionReason: string;
  updatedAt: string;
};

export type ResidentIdInput = Pick<
  ResidentIdCard,
  | "residentId"
  | "issueDate"
  | "expirationDate"
  | "emergencyContactName"
  | "emergencyContactNumber"
  | "actionReason"
  | "replacementForId"
>;
