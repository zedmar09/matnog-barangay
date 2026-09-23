export type HazardType = "Flood" | "Landslide" | "Storm Surge";
export type HazardSeverity = "Severe" | "High" | "Moderate" | "Low";
export type EvacuationPriority = "Immediate" | "Priority" | "Prepare" | "Monitor";
export type EvacuationStatus = "For Notification" | "Notified" | "Ready" | "Evacuated" | "Unable to Contact";

export type StructureHazard = {
  structureId: string;
  structureCode: string;
  barangayId: string;
  latitude: number;
  longitude: number;
  hazardType: HazardType;
  severity: HazardSeverity;
};

export type EvacuationEntry = {
  id: string;
  householdId: string;
  householdNumber: string;
  structureId: string;
  structureCode: string;
  barangayId: string;
  address: string;
  memberCount: number;
  vulnerabilityFlags: string[];
  hazards: HazardType[];
  highestSeverity: HazardSeverity;
  priority: EvacuationPriority;
  status: EvacuationStatus;
  assignedTeam: string;
  destination: string;
  updatedAt: string;
};

export type EvacuationCentreStatus = "Open" | "Standby" | "Full";

export type EvacuationCentre = {
  id: string;
  code: string;
  barangayId: string;
  name: string;
  address: string;
  manager: string;
  contactNumber: string;
  capacity: number;
  status: EvacuationCentreStatus;
  facilities: string[];
  latitude: number;
  longitude: number;
  updatedAt: string;
};

export type ManifestStatus = "Expected" | "Checked In" | "Checked Out";

export type EvacuationManifestRecord = {
  id: string;
  activationCode: string;
  evacuationEntryId: string;
  householdId: string;
  householdNumber: string;
  barangayId: string;
  centreId: string;
  memberCount: number;
  priority: EvacuationPriority;
  status: ManifestStatus;
  checkedInAt: string;
  checkedOutAt: string;
  registeredBy: string;
};

export type FamilyAccessCardStatus = "Active" | "Replaced" | "Void";

export type FamilyAccessCard = {
  id: string;
  cardNumber: string;
  householdId: string;
  householdNumber: string;
  headResidentId: string;
  headName: string;
  barangayId: string;
  memberCount: number;
  centreId: string;
  qrToken: string;
  status: FamilyAccessCardStatus;
  issuedAt: string;
  printedAt: string;
};

export type ReliefStatus = "Scheduled" | "Released" | "Held";

export type ReliefDistribution = {
  id: string;
  referenceNumber: string;
  activationCode: string;
  householdId: string;
  householdNumber: string;
  barangayId: string;
  centreId: string;
  assistanceType: "Food Pack" | "Hygiene Kit" | "Water" | "Sleeping Kit" | "Medical Kit";
  quantity: number;
  unit: string;
  estimatedValue: number;
  status: ReliefStatus;
  duplicateKey: string;
  releasedAt: string;
  releasedBy: string;
  holdReason: string;
};

export type DamageLevel = "Minor" | "Major" | "Destroyed";
export type HabitabilityStatus = "Safe" | "Restricted" | "Unsafe";
export type DamageAssessmentStatus = "Pending Validation" | "Validated";

export type DamageAssessment = {
  id: string;
  referenceNumber: string;
  structureId: string;
  structureCode: string;
  householdId: string;
  householdNumber: string;
  barangayId: string;
  hazardType: HazardType;
  damageLevel: DamageLevel;
  habitability: HabitabilityStatus;
  estimatedLoss: number;
  status: DamageAssessmentStatus;
  assessedAt: string;
  assessedBy: string;
  validatedAt: string;
  validatedBy: string;
  evidenceCount: number;
  notes: string;
};
