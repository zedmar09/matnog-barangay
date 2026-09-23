import { MATNOG_BARANGAYS } from "@/data/barangays";

import type { Resident, ResidentFilters, ResidentSortKey } from "../types/resident";

export const SENIOR_AGE = 60;

export function calculateAge(birthDate: string, today = new Date()) {
  if (!birthDate) return 0;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return 0;
  let age = today.getFullYear() - birth.getFullYear();
  const birthdayPassed =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!birthdayPassed) age -= 1;
  return Math.max(0, age);
}

export function isSenior(birthDate: string) {
  return calculateAge(birthDate) >= SENIOR_AGE;
}

export function formatResidentName(resident: Pick<Resident, "firstName" | "middleName" | "lastName" | "suffix">) {
  const given = [resident.firstName, resident.middleName, resident.suffix].filter(Boolean).join(" ");
  return `${resident.lastName}, ${given}`.replace(/\s+/g, " ").trim();
}

export function formatResidentAddress(address: Resident["address"], includeBarangay = true) {
  const barangay = MATNOG_BARANGAYS.find((item) => item.code === address.barangayId)?.name;
  return [
    address.houseUnit && `House ${address.houseUnit}`,
    address.buildingName,
    address.blockNumber && `Block ${address.blockNumber}`,
    address.lotNumber && `Lot ${address.lotNumber}`,
    address.street,
    address.subdivision,
    address.phase && `Phase ${address.phase}`,
    address.zone,
    address.purok,
    address.sitio,
    includeBarangay && barangay && `Brgy. ${barangay}`,
    address.municipality,
    address.province,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

export const EMPTY_FILTERS: ResidentFilters = {
  search: "",
  purok: "",
  gender: "",
  civilStatus: "",
  residentStatus: "",
  senior: "",
  pwd: "",
  lrn: "",
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  nickname: "",
  birthDateFrom: "",
  birthDateTo: "",
  ageFrom: "",
  ageTo: "",
  birthLocality: "",
  birthMunicipality: "",
  birthProvince: "",
  birthRegion: "",
  birthCountry: "",
  primaryCitizenship: "",
  secondaryCitizenship: "",
  barangayId: "",
  sitio: "",
  zone: "",
  street: "",
  subdivision: "",
  postalCode: "",
  employmentStatus: "",
  occupation: "",
  employer: "",
  hasMobile: "",
  hasSecondaryMobile: "",
  hasLandline: "",
  hasEmail: "",
  completeness: "",
  philsys: "",
  registrationDateFrom: "",
  registrationDateTo: "",
  updatedFrom: "",
  updatedTo: "",
};

const includes = (value: string, query: string) => value.toLocaleLowerCase().includes(query.toLocaleLowerCase());

export function filterResidents(residents: Resident[], filters: ResidentFilters, barangayScope: string) {
  return residents.filter((resident) => {
    if (barangayScope !== "all" && resident.address.barangayId !== barangayScope) return false;
    const searchable = [
      resident.lrn,
      resident.firstName,
      resident.middleName,
      resident.lastName,
      resident.suffix,
      resident.nickname,
      formatResidentName(resident),
      resident.contact.primaryMobile,
    ].join(" ");
    if (filters.search && !includes(searchable, filters.search)) return false;
    if (filters.purok && !includes(`${resident.address.purok} ${resident.address.sitio}`, filters.purok)) return false;
    if (filters.gender && resident.gender !== filters.gender) return false;
    if (filters.civilStatus && resident.civilStatus !== filters.civilStatus) return false;
    if (filters.residentStatus && resident.residentStatus !== filters.residentStatus) return false;
    if (filters.senior && (isSenior(resident.birthDate) ? "yes" : "no") !== filters.senior) return false;
    if (filters.pwd && (resident.isPwd ? "yes" : "no") !== filters.pwd) return false;
    if (filters.lrn && !includes(resident.lrn, filters.lrn)) return false;
    if (filters.firstName && !includes(resident.firstName, filters.firstName)) return false;
    if (filters.middleName && !includes(resident.middleName, filters.middleName)) return false;
    if (filters.lastName && !includes(resident.lastName, filters.lastName)) return false;
    if (filters.suffix && resident.suffix !== filters.suffix) return false;
    if (filters.nickname && !includes(resident.nickname, filters.nickname)) return false;
    if (filters.birthDateFrom && resident.birthDate < filters.birthDateFrom) return false;
    if (filters.birthDateTo && resident.birthDate > filters.birthDateTo) return false;
    const age = calculateAge(resident.birthDate);
    if (filters.ageFrom && age < Number(filters.ageFrom)) return false;
    if (filters.ageTo && age > Number(filters.ageTo)) return false;
    if (filters.birthLocality && !includes(resident.birthLocality, filters.birthLocality)) return false;
    if (filters.birthMunicipality && !includes(resident.birthMunicipality, filters.birthMunicipality)) return false;
    if (filters.birthProvince && !includes(resident.birthProvince, filters.birthProvince)) return false;
    if (filters.birthRegion && !includes(resident.birthRegion, filters.birthRegion)) return false;
    if (filters.birthCountry && !includes(resident.birthCountry, filters.birthCountry)) return false;
    if (filters.primaryCitizenship && !includes(resident.primaryCitizenship, filters.primaryCitizenship)) return false;
    if (filters.secondaryCitizenship && !includes(resident.secondaryCitizenship, filters.secondaryCitizenship))
      return false;
    if (filters.barangayId && resident.address.barangayId !== filters.barangayId) return false;
    if (filters.sitio && !includes(resident.address.sitio, filters.sitio)) return false;
    if (filters.zone && !includes(resident.address.zone, filters.zone)) return false;
    if (filters.street && !includes(resident.address.street, filters.street)) return false;
    if (filters.subdivision && !includes(resident.address.subdivision, filters.subdivision)) return false;
    if (filters.postalCode && !includes(resident.address.postalCode, filters.postalCode)) return false;
    if (filters.employmentStatus && resident.employmentStatus !== filters.employmentStatus) return false;
    if (filters.occupation && !includes(resident.occupation, filters.occupation)) return false;
    if (filters.employer && !includes(resident.employerName, filters.employer)) return false;
    if (filters.hasMobile && (resident.contact.primaryMobile ? "yes" : "no") !== filters.hasMobile) return false;
    if (filters.hasSecondaryMobile && (resident.contact.secondaryMobile ? "yes" : "no") !== filters.hasSecondaryMobile)
      return false;
    if (filters.hasLandline && (resident.contact.landline ? "yes" : "no") !== filters.hasLandline) return false;
    if (filters.hasEmail && (resident.contact.email ? "yes" : "no") !== filters.hasEmail) return false;
    if (filters.registrationDateFrom && resident.registrationDate < filters.registrationDateFrom) return false;
    if (filters.registrationDateTo && resident.registrationDate > filters.registrationDateTo) return false;
    if (filters.updatedFrom && resident.updatedAt.slice(0, 10) < filters.updatedFrom) return false;
    if (filters.updatedTo && resident.updatedAt.slice(0, 10) > filters.updatedTo) return false;
    if (filters.philsys === "yes" && resident.philsysStatus === "Not Provided") return false;
    if (filters.philsys === "no" && resident.philsysStatus !== "Not Provided") return false;
    if (filters.completeness === "photo" && resident.photoUrl) return false;
    if (filters.completeness === "mobile" && resident.contact.primaryMobile) return false;
    if (filters.completeness === "email" && resident.contact.email) return false;
    if (filters.completeness === "occupation" && resident.occupation) return false;
    if (filters.completeness === "birthPlace" && resident.birthMunicipality) return false;
    if (filters.completeness === "address" && resident.address.street && resident.address.houseUnit) return false;
    if (filters.completeness === "citizenship" && resident.primaryCitizenship) return false;
    return true;
  });
}

export function sortResidents(residents: Resident[], key: ResidentSortKey, direction: "asc" | "desc") {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...residents].sort((left, right) => {
    const values: Record<ResidentSortKey, [string | number, string | number]> = {
      lrn: [left.lrn, right.lrn],
      name: [formatResidentName(left), formatResidentName(right)],
      barangay: [left.address.barangayId, right.address.barangayId],
      birthDate: [left.birthDate, right.birthDate],
      age: [calculateAge(left.birthDate), calculateAge(right.birthDate)],
      civilStatus: [left.civilStatus, right.civilStatus],
      purok: [left.address.purok, right.address.purok],
      occupation: [left.occupation, right.occupation],
      residentStatus: [left.residentStatus, right.residentStatus],
      updatedAt: [left.updatedAt, right.updatedAt],
    };
    return String(values[key][0]).localeCompare(String(values[key][1]), undefined, { numeric: true }) * multiplier;
  });
}

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
