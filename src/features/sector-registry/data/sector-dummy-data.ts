import type { Resident } from "@/features/resident-registry/types/resident";
import { calculateAge } from "@/features/resident-registry/utils/resident-utils";

import type { SectorCode, SectorDefinition, SectorMembership } from "../types/sector";

export const SECTOR_DEFINITIONS: SectorDefinition[] = [
  {
    code: "senior",
    name: "Senior Citizens",
    shortName: "Senior",
    description: "Residents aged 60 years and older.",
    issuingOffice: "Municipal Social Welfare and Development Office",
    color: "#8c66b2",
  },
  {
    code: "pwd",
    name: "Persons with Disabilities",
    shortName: "PWD",
    description: "Residents with an active disability classification.",
    issuingOffice: "Persons with Disability Affairs Office",
    color: "#397da8",
  },
  {
    code: "solo-parent",
    name: "Solo Parents",
    shortName: "Solo Parent",
    description: "Qualified solo parents and guardians.",
    issuingOffice: "Municipal Social Welfare and Development Office",
    color: "#c86c7a",
  },
  {
    code: "child",
    name: "Children",
    shortName: "Child",
    description: "Residents below 18 years old.",
    issuingOffice: "Municipal Social Welfare and Development Office",
    color: "#3d9c87",
  },
  {
    code: "youth",
    name: "Youth / SK",
    shortName: "Youth",
    description: "Residents aged 15 to 30 years.",
    issuingOffice: "Local Youth Development Office",
    color: "#398da0",
  },
  {
    code: "osy",
    name: "Out-of-School Youth",
    shortName: "OSY",
    description: "Youth currently outside formal education or training.",
    issuingOffice: "Local Youth Development Office",
    color: "#d4893d",
  },
  {
    code: "indigent",
    name: "Indigent Residents",
    shortName: "Indigent",
    description: "Residents assessed under the local indigency criteria.",
    issuingOffice: "Municipal Social Welfare and Development Office",
    color: "#b97645",
  },
  {
    code: "ip",
    name: "Indigenous Peoples",
    shortName: "IP",
    description: "Residents belonging to a recognized indigenous community.",
    issuingOffice: "Municipal Indigenous Peoples Desk",
    color: "#778a49",
  },
  {
    code: "4ps",
    name: "4Ps Beneficiaries",
    shortName: "4Ps",
    description: "Residents linked to an active 4Ps household benefit record.",
    issuingOffice: "Municipal Link Office",
    color: "#4f72ad",
  },
];

function sectorsFor(resident: Resident, index: number): SectorCode[] {
  const age = calculateAge(resident.birthDate);
  return [
    age >= 60 && "senior",
    resident.isPwd && "pwd",
    index % 17 === 0 && "solo-parent",
    age < 18 && "child",
    age >= 15 && age <= 30 && "youth",
    age >= 15 && age <= 24 && index % 4 === 0 && "osy",
    index % 5 === 0 && "indigent",
    index % 19 === 0 && "ip",
    index % 7 === 0 && "4ps",
  ].filter((value): value is SectorCode => Boolean(value));
}

export function createSectorMembershipDummyData(residents: Resident[]) {
  const memberships: SectorMembership[] = [];
  residents.forEach((resident, residentIndex) => {
    sectorsFor(resident, residentIndex).forEach((sectorCode, membershipIndex) => {
      const sequence = memberships.length + 1;
      const definition = SECTOR_DEFINITIONS.find((item) => item.code === sectorCode);
      if (!definition) return;
      const status: SectorMembership["status"] =
        sequence % 13 === 0 ? "Pending Review" : sequence % 29 === 0 ? "Expired" : "Active";
      const year = 2024 + (sequence % 3);
      memberships.push({
        id: `sector-membership-${String(sequence).padStart(6, "0")}`,
        residentId: resident.id,
        sectorCode,
        status,
        validityStart: `${year}-01-15`,
        validityEnd: sectorCode === "child" || sectorCode === "youth" ? "" : `${year + 3}-12-31`,
        supportingDocuments:
          sectorCode === "senior" || sectorCode === "child" || sectorCode === "youth"
            ? ["Resident registry birth date"]
            : [`${definition.shortName} supporting document`, "Barangay certification"],
        certifiedByBarangay: status !== "Pending Review",
        certifiedAt: status !== "Pending Review" ? `${year}-01-12T08:00:00.000Z` : "",
        issuingOffice: definition.issuingOffice,
        referenceNumber: `SEC-${sectorCode.toUpperCase()}-${String(sequence).padStart(7, "0")}`,
        remarks:
          status === "Pending Review"
            ? "Supporting document validation pending."
            : membershipIndex > 0
              ? "Connected secondary sector classification."
              : "Validated from resident and household information.",
        createdAt: `${year}-01-10T08:00:00.000Z`,
        updatedAt: `${year}-06-15T08:00:00.000Z`,
      });
    });
  });
  return memberships;
}
