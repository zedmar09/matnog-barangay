import { MATNOG_BARANGAYS } from "@/data/barangays";
import type { Resident } from "@/features/resident-registry/types/resident";
import { calculateAge } from "@/features/resident-registry/utils/resident-utils";

import type { Household, HouseholdStructure, HouseholdVulnerabilities } from "../types/household";

const materials = ["Concrete", "Mixed concrete and wood", "Wood", "Light materials"];
const tenures = ["Owned", "Rented", "Rent-free with consent", "Informal occupancy"];
const waterSources = ["Level III connection", "Community faucet", "Deep well", "Spring / protected source"];
const toiletFacilities = ["Water-sealed private", "Water-sealed shared", "Pit latrine", "None reported"];
const powerSources = ["Electric cooperative", "Solar", "Generator", "No regular connection"];
const wasteMethods = ["Barangay collection", "Municipal collection", "Composting", "Community disposal point"];
const incomeBrackets = ["Below ₱10,000", "₱10,000–₱19,999", "₱20,000–₱39,999", "₱40,000 and above"];
const livelihoods = [
  "Farming",
  "Fishing",
  "Retail / sari-sari store",
  "Construction",
  "Transport",
  "Government service",
  "Tourism services",
];
const foodSecurity = ["Food secure", "Mild concern", "Moderate concern", "Needs immediate assessment"];
const relationships = ["Spouse", "Child", "Parent", "Sibling", "Grandchild", "Other relative"];

function vulnerabilityFor(members: Resident[], index: number): HouseholdVulnerabilities {
  return {
    hasSenior: members.some((resident) => calculateAge(resident.birthDate) >= 60),
    hasPwd: members.some((resident) => resident.isPwd),
    hasPregnantOrLactating: index % 13 === 0,
    hasUnderFive: members.some((resident) => calculateAge(resident.birthDate) < 5),
    hasSoloParent: index % 17 === 0,
    hasBedriddenOrOxygenDependent: index % 31 === 0,
    hasIndigenousPeople: index % 19 === 0,
  };
}

export function createHouseholdDummyData(residents: Resident[]) {
  const structures: HouseholdStructure[] = [];
  const households: Household[] = [];
  let structureSequence = 1;
  let householdSequence = 1;

  MATNOG_BARANGAYS.forEach((barangay, barangayIndex) => {
    const barangayResidents = residents.filter((resident) => resident.address.barangayId === barangay.code);
    const assignedResidents = barangayResidents.slice(0, Math.max(1, barangayResidents.length - 2));
    const householdCount = 8;
    for (let localIndex = 0; localIndex < householdCount; localIndex += 1) {
      const start = Math.floor((localIndex * assignedResidents.length) / householdCount);
      const end = Math.floor(((localIndex + 1) * assignedResidents.length) / householdCount);
      const members = assignedResidents.slice(start, Math.max(start + 1, end));
      if (!members.length) continue;

      const sharesPreviousStructure = localIndex > 0 && localIndex % 5 === 0;
      let structure = sharesPreviousStructure ? structures.at(-1) : undefined;
      if (!structure) {
        const address = members[0].address;
        structure = {
          id: `structure-${String(structureSequence).padStart(5, "0")}`,
          structureCode: `STR-${barangay.code.toUpperCase()}-${String(structureSequence).padStart(4, "0")}`,
          barangayId: barangay.code,
          purok: address.purok || `Purok ${(localIndex % 7) + 1}`,
          sitio: address.sitio,
          zone: address.zone,
          street: address.street || "Barangay Road",
          houseNumber: address.houseUnit || String(10 + localIndex),
          latitude: 12.54 + (barangayIndex % 8) * 0.012 + (localIndex % 4) * 0.0015,
          longitude: 124.04 + Math.floor(barangayIndex / 8) * 0.018 + ((localIndex * 3) % 7) * 0.0016,
          dwelling: {
            constructionMaterial: materials[(householdSequence + 1) % materials.length],
            tenure: tenures[(householdSequence + 2) % tenures.length],
            waterSource: waterSources[householdSequence % waterSources.length],
            toiletFacility: toiletFacilities[(householdSequence + 1) % toiletFacilities.length],
            powerSource: powerSources[householdSequence % powerSources.length],
            wasteDisposal: wasteMethods[(householdSequence + 2) % wasteMethods.length],
            internetAccess:
              householdSequence % 3 === 0 ? "None" : householdSequence % 2 === 0 ? "Mobile data" : "Fixed broadband",
          },
        };
        structures.push(structure);
        structureSequence += 1;
      }

      const householdIndex = householdSequence - 1;
      const verifiedYear = householdIndex % 7 === 0 ? 2024 : householdIndex % 4 === 0 ? 2025 : 2026;
      const verifiedMonth = String((householdIndex % 9) + 1).padStart(2, "0");
      households.push({
        id: `household-${String(householdSequence).padStart(5, "0")}`,
        householdNumber: `HH-${barangay.code.toUpperCase()}-${String(householdSequence).padStart(6, "0")}`,
        headResidentId: members[0].id,
        structureId: structure.id,
        barangayId: barangay.code,
        members: members.map((resident, memberIndex) => ({
          residentId: resident.id,
          relationshipToHead:
            memberIndex === 0 ? "Head" : relationships[(householdIndex + memberIndex) % relationships.length],
          joinedAt: `${2014 + (householdIndex % 11)}-01-15`,
          leftAt: "",
          temporarilyAbsent: memberIndex > 0 && (householdIndex + memberIndex) % 23 === 0,
          absenceReason:
            memberIndex > 0 && (householdIndex + memberIndex) % 23 === 0
              ? ["OFW", "Student", "Hospitalized"][householdIndex % 3]
              : "",
        })),
        monthlyIncomeBracket: incomeBrackets[householdIndex % incomeBrackets.length],
        primaryLivelihood: livelihoods[householdIndex % livelihoods.length],
        foodSecurity: foodSecurity[householdIndex % foodSecurity.length],
        vulnerabilities: vulnerabilityFor(members, householdIndex),
        lastVerifiedAt: `${verifiedYear}-${verifiedMonth}-15T08:00:00.000Z`,
        verifiedBy: `Enumerator ${(householdIndex % 12) + 1}`,
        status: householdIndex % 29 === 0 ? "Inactive" : "Active",
        createdAt: `${2014 + (householdIndex % 11)}-01-15T08:00:00.000Z`,
        updatedAt: `${verifiedYear}-${verifiedMonth}-15T08:00:00.000Z`,
      });
      householdSequence += 1;
    }
  });
  return { households, structures };
}
