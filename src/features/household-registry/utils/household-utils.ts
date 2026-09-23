import type { Household, HouseholdStructure } from "../types/household";

export function isHouseholdStale(household: Household) {
  return household.lastVerifiedAt < "2025-09-23";
}

export function householdRiskLabels(household: Household) {
  const flags = household.vulnerabilities;
  return [
    flags.hasSenior && "Senior",
    flags.hasPwd && "PWD",
    flags.hasPregnantOrLactating && "Pregnant / lactating",
    flags.hasUnderFive && "Under 5",
    flags.hasSoloParent && "Solo parent",
    flags.hasBedriddenOrOxygenDependent && "Bedridden / oxygen-dependent",
    flags.hasIndigenousPeople && "IP",
  ].filter((value): value is string => Boolean(value));
}

export function formatStructureAddress(structure: HouseholdStructure) {
  return [
    structure.houseNumber && `House ${structure.houseNumber}`,
    structure.street,
    structure.zone,
    structure.purok,
    structure.sitio,
  ]
    .filter(Boolean)
    .join(", ");
}
