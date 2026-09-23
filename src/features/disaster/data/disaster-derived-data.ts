import type { Household, HouseholdStructure } from "@/features/household-registry/types/household";
import { formatStructureAddress } from "@/features/household-registry/utils/household-utils";

import type {
  EvacuationEntry,
  EvacuationPriority,
  HazardSeverity,
  HazardType,
  StructureHazard,
} from "../types/disaster";

const severityWeight: Record<HazardSeverity, number> = { Low: 1, Moderate: 2, High: 3, Severe: 4 };
const hazardTypes: HazardType[] = ["Flood", "Landslide", "Storm Surge"];

export function deriveHazards(structures: HouseholdStructure[]): StructureHazard[] {
  return structures.flatMap((structure, index) => {
    const count = index % 5 === 0 ? 3 : index % 2 === 0 ? 2 : 1;
    return hazardTypes.slice(0, count).map((hazardType, hazardIndex) => {
      const score = (index * 3 + hazardIndex * 2) % 10;
      const severity: HazardSeverity = score >= 8 ? "Severe" : score >= 5 ? "High" : score >= 2 ? "Moderate" : "Low";
      return {
        structureId: structure.id,
        structureCode: structure.structureCode,
        barangayId: structure.barangayId,
        latitude: structure.latitude,
        longitude: structure.longitude,
        hazardType,
        severity,
      };
    });
  });
}

function vulnerabilityFlags(household: Household) {
  const flags: string[] = [];
  if (household.vulnerabilities.hasSenior) flags.push("Senior citizen");
  if (household.vulnerabilities.hasPwd) flags.push("PWD");
  if (household.vulnerabilities.hasPregnantOrLactating) flags.push("Pregnant or lactating");
  if (household.vulnerabilities.hasUnderFive) flags.push("Child under 5");
  if (household.vulnerabilities.hasSoloParent) flags.push("Solo parent");
  if (household.vulnerabilities.hasBedriddenOrOxygenDependent) flags.push("Bedridden or oxygen-dependent");
  if (household.vulnerabilities.hasIndigenousPeople) flags.push("Indigenous People");
  return flags;
}

export function deriveEvacuationEntries(
  households: Household[],
  structures: HouseholdStructure[],
  hazards: StructureHazard[],
): EvacuationEntry[] {
  return households
    .filter((household) => household.status === "Active")
    .map((household, index) => {
      const structure = structures.find((item) => item.id === household.structureId) ?? structures[0];
      const exposure = hazards.filter((item) => item.structureId === structure.id);
      const flags = vulnerabilityFlags(household);
      const highest = exposure.reduce<HazardSeverity>(
        (current, item) => (severityWeight[item.severity] > severityWeight[current] ? item.severity : current),
        "Low",
      );
      const score =
        severityWeight[highest] * 2 +
        Math.min(flags.length, 4) +
        (flags.includes("Bedridden or oxygen-dependent") ? 2 : 0);
      const priority: EvacuationPriority =
        score >= 9 ? "Immediate" : score >= 7 ? "Priority" : score >= 4 ? "Prepare" : "Monitor";
      return {
        id: `evacuation-${household.id}`,
        householdId: household.id,
        householdNumber: household.householdNumber,
        structureId: structure.id,
        structureCode: structure.structureCode,
        barangayId: household.barangayId,
        address: formatStructureAddress(structure),
        memberCount: household.members.length,
        vulnerabilityFlags: flags,
        hazards: Array.from(new Set(exposure.map((item) => item.hazardType))),
        highestSeverity: highest,
        priority,
        status: index % 13 === 0 ? "Notified" : "For Notification",
        assignedTeam: `Evacuation Team ${(index % 8) + 1}`,
        destination: "Barangay Evacuation Centre",
        updatedAt: "2026-09-23T08:00:00.000Z",
      };
    });
}
