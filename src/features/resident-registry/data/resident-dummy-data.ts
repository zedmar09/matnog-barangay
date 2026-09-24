import { MATNOG_BARANGAYS } from "@/data/barangays";

import type { PhilSysStatus, Resident, ResidentStatus } from "../types/resident";

const firstNames = [
  "Juan",
  "Jose",
  "Maria",
  "Ana",
  "Carlo",
  "Miguel",
  "Angelo",
  "Patricia",
  "Joanna",
  "Mark",
  "Angela",
  "Rafael",
  "Paolo",
  "Kristine",
  "Joshua",
  "Camille",
];
const middleNames = [
  "Santos",
  "Reyes",
  "Garcia",
  "Mendoza",
  "Bautista",
  "Navarro",
  "Ramos",
  "Flores",
  "Aquino",
  "Castillo",
  "",
];
const lastNames = [
  "Dela Cruz",
  "Santos",
  "Reyes",
  "Garcia",
  "Mendoza",
  "Bautista",
  "Ramos",
  "Flores",
  "Aquino",
  "Navarro",
  "Castillo",
  "Villanueva",
  "Fernandez",
  "De Leon",
  "Del Rosario",
];
const suffixes = ["", "", "", "", "", "Jr.", "Sr.", "II", "III", "IV", "V"];
const occupations = [
  "Farmer",
  "Teacher",
  "Driver",
  "Vendor",
  "Carpenter",
  "Engineer",
  "Government Employee",
  "Private Employee",
  "Business Owner",
  "Fisherman",
  "Construction Worker",
  "Nurse",
  "Student",
  "Retired",
  "Unemployed",
];
const streets = ["Rizal St.", "Mabini St.", "Bonifacio St.", "Quezon St.", "Del Pilar St.", "Coastal Road", ""];
const sitios = ["Centro", "Baybay", "Ilawod", "Iraya", "Proper", ""];
const civilStatuses = ["Single", "Married", "Widowed", "Separated", "Divorced", "Other"];
const residentStatuses: ResidentStatus[] = [
  "Active",
  "Active",
  "Active",
  "Active",
  "Inactive",
  "Transferred Out",
  "Deceased",
  "Merged",
];
const philsysStatuses: PhilSysStatus[] = [
  "Not Provided",
  "Not Provided",
  "Not Provided",
  "On File",
  "Verified",
  "Verification Pending",
];

let seed = 772_931;
const random = () => {
  seed = (seed * 48271) % 2147483647;
  return seed / 2147483647;
};
const pick = <T>(values: T[]) => values[Math.floor(random() * values.length)];
const maybe = (value: string, chance: number) => (random() < chance ? value : "");
const pad = (value: number) => String(value).padStart(2, "0");

function avatarDataUrl(firstName: string, lastName: string, index: number) {
  const colors = ["#267a73", "#426f8b", "#7c6650", "#6b5e8c", "#49745b"];
  const initials = `${firstName[0]}${lastName[0]}`;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="220" viewBox="0 0 180 220"><rect width="180" height="220" fill="#edf4f2"/><circle cx="90" cy="78" r="42" fill="${colors[index % colors.length]}" opacity=".86"/><path d="M25 220c5-58 34-88 65-88s60 30 65 88" fill="${colors[index % colors.length]}" opacity=".86"/><text x="90" y="207" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="white">${initials}</text></svg>`)}`;
}

function makeBirthDate(index: number) {
  const roll = random();
  const age =
    roll < 0.2
      ? Math.floor(random() * 18)
      : roll < 0.76
        ? 18 + Math.floor(random() * 42)
        : 60 + Math.floor(random() * 39);
  const year = 2026 - age - (index % 3 === 0 ? 1 : 0);
  return `${year}-${pad(1 + Math.floor(random() * 12))}-${pad(1 + Math.floor(random() * 28))}`;
}

function buildBarangayWeights() {
  const tempSeed = 554_321;
  const weights = MATNOG_BARANGAYS.map((_, i) => {
    const s = ((tempSeed + i * 48271) * 48271) % 2147483647;
    return 12 + Math.floor((s / 2147483647) * 55);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const cumulative: number[] = [];
  let sum = 0;
  for (const w of weights) {
    sum += w / total;
    cumulative.push(sum);
  }
  cumulative[cumulative.length - 1] = 1;
  return cumulative;
}

export function createResidentDummyData(count = 1200): Resident[] {
  seed = 772_931;
  const cumulativeWeights = buildBarangayWeights();
  const residents = Array.from({ length: count }, (_, zeroIndex) => {
    const index = zeroIndex + 1;
    const roll = random();
    const barangayIndex = cumulativeWeights.findIndex((c) => roll <= c);
    const barangay = MATNOG_BARANGAYS[barangayIndex >= 0 ? barangayIndex : 0];
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    const occupation = pick(occupations);
    const employmentStatus =
      occupation === "Student"
        ? "Student"
        : occupation === "Retired"
          ? "Retired"
          : occupation === "Unemployed"
            ? "Unemployed"
            : random() < 0.66
              ? "Employed"
              : "Self-employed";
    const philsysStatus = pick(philsysStatuses);
    const updatedDate = new Date(Date.UTC(2026, 8, 23 - (index % 90)));
    return {
      id: `resident-${String(index).padStart(5, "0")}`,
      lrn: `LRN-${String(index).padStart(12, "0")}`,
      firstName,
      middleName: pick(middleNames),
      lastName,
      suffix: pick(suffixes),
      nickname: maybe(firstName.slice(0, 5), 0.28),
      previousLastName: maybe(pick(lastNames), 0.09),
      mothersMaidenName: `${pick(firstNames)} ${pick(middleNames) || "Santos"} ${pick(lastNames)}`,
      birthDate: makeBirthDate(index),
      birthLocality: maybe(barangay.name, 0.78),
      birthBarangay: maybe(barangay.name, 0.7),
      birthMunicipality: maybe("Matnog", 0.9),
      birthProvince: maybe("Sorsogon", 0.92),
      birthRegion: "Bicol Region",
      birthCountry: "Philippines",
      gender: index % 2 === 0 ? "Female" : "Male",
      civilStatus: pick(civilStatuses),
      primaryCitizenship: "Filipino",
      secondaryCitizenship: maybe("Filipino", 0.03),
      employmentStatus,
      occupation,
      employerName: maybe(`${pick(lastNames)} Enterprises`, 0.44),
      workplaceAddress: maybe("Matnog, Sorsogon", 0.5),
      address: {
        region: "Bicol Region",
        province: "Sorsogon",
        municipality: "Matnog",
        barangayId: barangay.code,
        district: "",
        purok: `Purok ${1 + (index % 7)}`,
        sitio: pick(sitios),
        zone: maybe(`Zone ${1 + (index % 4)}`, 0.35),
        subdivision: maybe("Matnog Village", 0.14),
        street: pick(streets),
        buildingName: maybe(`Building ${1 + (index % 12)}`, 0.08),
        houseUnit: maybe(String(1 + (index % 220)), 0.84),
        lotNumber: maybe(String(1 + (index % 30)), 0.3),
        blockNumber: maybe(String(1 + (index % 18)), 0.28),
        phase: maybe(String(1 + (index % 4)), 0.18),
        postalCode: "4708",
        landmark: maybe("Near barangay hall", 0.22),
      },
      contact: {
        primaryMobile: maybe(`09${String(100000000 + index * 7919).slice(-9)}`, 0.83),
        secondaryMobile: maybe(`09${String(200000000 + index * 6151).slice(-9)}`, 0.08),
        landline: maybe(`056-${String(8000000 + index).slice(-7)}`, 0.12),
        email: maybe(`${firstName}.${lastName.replaceAll(" ", "").toLowerCase()}${index}@example.test`, 0.38),
      },
      isPwd: random() < 0.085,
      residentStatus: pick(residentStatuses),
      photoUrl: index % 20 < 13 ? avatarDataUrl(firstName, lastName, index) : "",
      philsysStatus,
      philsysMockToken: philsysStatus === "Not Provided" ? "" : `mock-token-${index}`,
      philsysMockHash: philsysStatus === "Not Provided" ? "" : `mock-hash-${index}`,
      registrationDate: (() => {
        const yr = 2020 + Math.floor(random() * 7);
        const mo = 1 + Math.floor(random() * 12);
        const dy = 1 + Math.floor(random() * 28);
        return `${yr}-${pad(mo)}-${pad(dy)}`;
      })(),
      createdAt: `202${index % 6}-01-01T08:00:00.000Z`,
      updatedAt: updatedDate.toISOString(),
    };
  });

  // Intentional fictional near-duplicates make the frontend review workflow realistic.
  for (let targetIndex = 49; targetIndex < residents.length; targetIndex += 31) {
    const source = residents[targetIndex - 7];
    const target = residents[targetIndex];
    target.firstName = source.firstName;
    target.middleName = source.middleName;
    target.lastName = source.lastName;
    target.suffix = source.suffix;
    target.previousLastName = source.previousLastName;
    target.mothersMaidenName = source.mothersMaidenName;
    target.birthDate = source.birthDate;
    target.birthMunicipality = source.birthMunicipality;
    if (targetIndex % 2 === 1) target.contact.primaryMobile = source.contact.primaryMobile;
  }
  return residents;
}
