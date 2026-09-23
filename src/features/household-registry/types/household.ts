export type DwellingAttributes = {
  constructionMaterial: string;
  tenure: string;
  waterSource: string;
  toiletFacility: string;
  powerSource: string;
  wasteDisposal: string;
  internetAccess: string;
};

export type HouseholdStructure = {
  id: string;
  structureCode: string;
  barangayId: string;
  purok: string;
  sitio: string;
  zone: string;
  street: string;
  houseNumber: string;
  latitude: number;
  longitude: number;
  dwelling: DwellingAttributes;
};

export type HouseholdMember = {
  residentId: string;
  relationshipToHead: string;
  joinedAt: string;
  leftAt: string;
  temporarilyAbsent: boolean;
  absenceReason: string;
};

export type HouseholdVulnerabilities = {
  hasSenior: boolean;
  hasPwd: boolean;
  hasPregnantOrLactating: boolean;
  hasUnderFive: boolean;
  hasSoloParent: boolean;
  hasBedriddenOrOxygenDependent: boolean;
  hasIndigenousPeople: boolean;
};

export type Household = {
  id: string;
  householdNumber: string;
  headResidentId: string;
  structureId: string;
  barangayId: string;
  members: HouseholdMember[];
  monthlyIncomeBracket: string;
  primaryLivelihood: string;
  foodSecurity: string;
  vulnerabilities: HouseholdVulnerabilities;
  lastVerifiedAt: string;
  verifiedBy: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
};

export type HouseholdInput = Pick<
  Household,
  | "headResidentId"
  | "structureId"
  | "barangayId"
  | "members"
  | "monthlyIncomeBracket"
  | "primaryLivelihood"
  | "foodSecurity"
>;

export type HouseholdStructureInput = Omit<HouseholdStructure, "id" | "structureCode">;
