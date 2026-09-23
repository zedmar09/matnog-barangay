import { MATNOG_BARANGAYS } from "@/data/barangays";
import type { Household, HouseholdStructure } from "@/features/household-registry/types/household";
import type { Resident } from "@/features/resident-registry/types/resident";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";

import type {
  DamageAssessment,
  EvacuationCentre,
  EvacuationEntry,
  EvacuationManifestRecord,
  FamilyAccessCard,
  ReliefDistribution,
  StructureHazard,
} from "../types/disaster";

export function createEvacuationCentres(structures: HouseholdStructure[]): EvacuationCentre[] {
  return MATNOG_BARANGAYS.map((barangay, index) => {
    const localStructure = structures.find((item) => item.barangayId === barangay.code);
    return {
      id: `centre-${barangay.code}`,
      code: `EC-${String(index + 1).padStart(3, "0")}`,
      barangayId: barangay.code,
      name: `${barangay.name} Evacuation Centre`,
      address: `${localStructure?.street || "Barangay Road"}, Brgy. ${barangay.name}, Matnog`,
      manager: `Centre Manager ${String(index + 1).padStart(2, "0")}`,
      contactNumber: `09${String(170000000 + index * 7919).slice(0, 9)}`,
      capacity: 80 + (index % 5) * 30,
      status: index % 9 === 0 ? "Standby" : "Open",
      facilities: ["Water", "Power", index % 3 === 0 ? "Medical desk" : "First-aid station", "WASH"],
      latitude: localStructure?.latitude ?? 12.58,
      longitude: localStructure?.longitude ?? 124.08,
      updatedAt: "2026-09-23T08:00:00.000Z",
    };
  });
}

export function createManifestRecords(
  entries: EvacuationEntry[],
  centres: EvacuationCentre[],
): EvacuationManifestRecord[] {
  return entries.map((entry, index) => {
    const centre = centres.find((item) => item.barangayId === entry.barangayId) ?? centres[0];
    const status = index % 17 === 0 ? "Checked Out" : index % 9 === 0 ? "Checked In" : "Expected";
    return {
      id: `manifest-${String(index + 1).padStart(5, "0")}`,
      activationCode: "ACT-2026-09-23-01",
      evacuationEntryId: entry.id,
      householdId: entry.householdId,
      householdNumber: entry.householdNumber,
      barangayId: entry.barangayId,
      centreId: centre.id,
      memberCount: entry.memberCount,
      priority: entry.priority,
      status,
      checkedInAt: status !== "Expected" ? `2026-09-23T${String(6 + (index % 8)).padStart(2, "0")}:15:00.000Z` : "",
      checkedOutAt: status === "Checked Out" ? "2026-09-23T17:30:00.000Z" : "",
      registeredBy: status === "Expected" ? "" : `Desk Officer ${(index % 6) + 1}`,
    };
  });
}

export function createFamilyAccessCards(
  entries: EvacuationEntry[],
  centres: EvacuationCentre[],
  households: Household[],
  residents: Resident[],
): FamilyAccessCard[] {
  return entries.map((entry, index) => {
    const household = households.find((item) => item.id === entry.householdId);
    const head = residents.find((item) => item.id === household?.headResidentId);
    const centre = centres.find((item) => item.barangayId === entry.barangayId) ?? centres[0];
    return {
      id: `family-card-${String(index + 1).padStart(5, "0")}`,
      cardNumber: `FAC-26-${String(index + 1).padStart(6, "0")}`,
      householdId: entry.householdId,
      householdNumber: entry.householdNumber,
      headResidentId: household?.headResidentId ?? "",
      headName: head ? formatResidentName(head) : "Household Head",
      barangayId: entry.barangayId,
      memberCount: entry.memberCount,
      centreId: centre.id,
      qrToken: `fac_${entry.householdId}_${String(index + 37).padStart(5, "0")}`,
      status: "Active",
      issuedAt: "2026-09-23T08:00:00.000Z",
      printedAt: index % 4 === 0 ? "2026-09-23T09:30:00.000Z" : "",
    };
  });
}

export function createReliefDistributions(
  entries: EvacuationEntry[],
  centres: EvacuationCentre[],
): ReliefDistribution[] {
  const assistanceTypes: ReliefDistribution["assistanceType"][] = [
    "Food Pack",
    "Hygiene Kit",
    "Water",
    "Sleeping Kit",
    "Medical Kit",
  ];
  const units = ["pack", "kit", "container", "kit", "kit"];
  const values = [850, 480, 180, 620, 950];
  const primary = entries.map((entry, index) => {
    const typeIndex = index % assistanceTypes.length;
    const assistanceType = assistanceTypes[typeIndex];
    const centre = centres.find((item) => item.barangayId === entry.barangayId) ?? centres[0];
    const released = index % 5 === 0;
    return {
      id: `relief-${String(index + 1).padStart(5, "0")}`,
      referenceNumber: `REL-26-${String(index + 1).padStart(6, "0")}`,
      activationCode: "ACT-2026-09-23-01",
      householdId: entry.householdId,
      householdNumber: entry.householdNumber,
      barangayId: entry.barangayId,
      centreId: centre.id,
      assistanceType,
      quantity: assistanceType === "Water" ? Math.max(2, entry.memberCount) : 1,
      unit: units[typeIndex],
      estimatedValue: values[typeIndex] * (assistanceType === "Water" ? Math.max(2, entry.memberCount) : 1),
      status: released ? "Released" : "Scheduled",
      duplicateKey: `ACT-2026-09-23-01|${entry.householdId}|${assistanceType}`,
      releasedAt: released ? `2026-09-23T${String(8 + (index % 8)).padStart(2, "0")}:20:00.000Z` : "",
      releasedBy: released ? `Relief Officer ${(index % 5) + 1}` : "",
      holdReason: "",
    } satisfies ReliefDistribution;
  });
  const duplicates = primary
    .filter((item) => item.status === "Released")
    .slice(0, 8)
    .map((item, index) => ({
      ...item,
      id: `relief-duplicate-${String(index + 1).padStart(3, "0")}`,
      referenceNumber: `REL-26-D${String(index + 1).padStart(4, "0")}`,
      status: "Scheduled" as const,
      releasedAt: "",
      releasedBy: "",
    }));
  return [...duplicates, ...primary];
}

export function createDamageAssessments(entries: EvacuationEntry[], hazards: StructureHazard[]): DamageAssessment[] {
  return entries.slice(0, 220).map((entry, index) => {
    const exposure = hazards.filter((item) => item.structureId === entry.structureId);
    const selectedHazard = exposure[index % Math.max(1, exposure.length)];
    const damageLevel: DamageAssessment["damageLevel"] =
      entry.highestSeverity === "Severe" && index % 3 === 0
        ? "Destroyed"
        : ["Severe", "High"].includes(entry.highestSeverity)
          ? "Major"
          : "Minor";
    const habitability: DamageAssessment["habitability"] =
      damageLevel === "Destroyed" ? "Unsafe" : damageLevel === "Major" ? "Restricted" : "Safe";
    const validated = index % 4 === 0;
    const baseLoss = damageLevel === "Destroyed" ? 280000 : damageLevel === "Major" ? 115000 : 28000;
    return {
      id: `damage-${String(index + 1).padStart(5, "0")}`,
      referenceNumber: `DA-26-${String(index + 1).padStart(6, "0")}`,
      structureId: entry.structureId,
      structureCode: entry.structureCode,
      householdId: entry.householdId,
      householdNumber: entry.householdNumber,
      barangayId: entry.barangayId,
      hazardType: selectedHazard?.hazardType ?? entry.hazards[0] ?? "Flood",
      damageLevel,
      habitability,
      estimatedLoss: baseLoss + (index % 7) * 7500,
      status: validated ? "Validated" : "Pending Validation",
      assessedAt: `2026-09-23T${String(7 + (index % 9)).padStart(2, "0")}:10:00.000Z`,
      assessedBy: `Rapid Assessment Team ${(index % 8) + 1}`,
      validatedAt: validated ? "2026-09-23T16:30:00.000Z" : "",
      validatedBy: validated ? "Municipal DRRM Validator" : "",
      evidenceCount: 2 + (index % 4),
      notes:
        damageLevel === "Destroyed"
          ? "Primary dwelling is no longer habitable; relocation assistance required."
          : damageLevel === "Major"
            ? "Structural components require engineering inspection before re-entry."
            : "Localized damage recorded; dwelling remains usable with repairs.",
    };
  });
}
