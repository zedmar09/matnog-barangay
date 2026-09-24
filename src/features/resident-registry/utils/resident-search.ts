import type { AppRole } from "@/components/navigation";

import type { Resident } from "../types/resident";
import { formatResidentName } from "./resident-utils";

export type ResidentSearchCriteria = {
  query: string;
  birthDate: string;
  mothersMaidenName: string;
  mobile: string;
  gender: string;
  civilStatus: string;
  citizenship: string;
  occupation: string;
  addressKeyword: string;
  barangayId: string;
  residentStatus: string;
};

export type ResidentSearchAccess = {
  scope: "municipality" | "barangay" | "none";
  canViewProfile: boolean;
  canViewBirthDate: boolean;
  canViewContact: boolean;
  canViewExactAddress: boolean;
};

export type ResidentSearchResult = {
  resident: Resident;
  score: number;
  confidence: "Exact" | "Strong" | "Possible";
  signals: string[];
};

export const EMPTY_SEARCH_CRITERIA: ResidentSearchCriteria = {
  query: "",
  birthDate: "",
  mothersMaidenName: "",
  mobile: "",
  gender: "",
  civilStatus: "",
  citizenship: "",
  occupation: "",
  addressKeyword: "",
  barangayId: "",
  residentStatus: "",
};

export const SEARCH_ACCESS: Record<AppRole, ResidentSearchAccess> = {
  barangayStaff: {
    scope: "barangay",
    canViewProfile: true,
    canViewBirthDate: true,
    canViewContact: false,
    canViewExactAddress: true,
  },
  barangayOfficial: {
    scope: "barangay",
    canViewProfile: true,
    canViewBirthDate: true,
    canViewContact: true,
    canViewExactAddress: true,
  },
  municipalOfficeUser: {
    scope: "municipality",
    canViewProfile: true,
    canViewBirthDate: true,
    canViewContact: true,
    canViewExactAddress: true,
  },
  municipalAdministrator: {
    scope: "municipality",
    canViewProfile: true,
    canViewBirthDate: true,
    canViewContact: true,
    canViewExactAddress: true,
  },
  auditor: {
    scope: "municipality",
    canViewProfile: false,
    canViewBirthDate: false,
    canViewContact: false,
    canViewExactAddress: false,
  },
  publicUser: {
    scope: "none",
    canViewProfile: false,
    canViewBirthDate: false,
    canViewContact: false,
    canViewExactAddress: false,
  },
};

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function editDistance(left: string, right: string) {
  if (!left) return right.length;
  if (!right) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + cost,
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function similarity(left: string, right: string) {
  const a = normalized(left);
  const b = normalized(right);
  if (!a || !b) return 0;
  if (a.includes(b) || b.includes(a)) return a === b ? 1 : 0.92;
  return 1 - editDistance(a, b) / Math.max(a.length, b.length);
}

function nameMatch(resident: Resident, query: string) {
  const variants = [
    formatResidentName(resident),
    `${resident.firstName} ${resident.middleName} ${resident.lastName} ${resident.suffix}`,
    `${resident.firstName} ${resident.lastName}`,
    `${resident.nickname} ${resident.lastName}`,
    `${resident.firstName} ${resident.previousLastName}`,
  ].filter(Boolean);
  const queryValue = normalized(query);
  if (variants.some((variant) => normalized(variant) === queryValue)) {
    return { score: 80, signal: "Exact full name" };
  }
  const components = [
    resident.firstName,
    resident.middleName,
    resident.lastName,
    resident.nickname,
    resident.previousLastName,
  ].filter(Boolean);
  if (components.some((component) => normalized(component) === queryValue)) {
    return { score: 55, signal: "Exact name component" };
  }
  if (variants.some((variant) => normalized(variant).includes(queryValue))) {
    return { score: 52, signal: "Partial name" };
  }
  const match = Math.max(...variants.map((variant) => similarity(variant, query)));
  if (match >= 0.78) return { score: 48, signal: "Strong fuzzy name" };
  if (match >= 0.62) return { score: 32, signal: "Possible name variant" };
  return { score: 0, signal: "" };
}

export function maskMobile(value: string) {
  if (!value) return "—";
  return `${value.slice(0, 4)}•••${value.slice(-3)}`;
}

export function searchResidents(
  residents: Resident[],
  criteria: ResidentSearchCriteria,
  role: AppRole,
  selectedBarangay: string,
) {
  const access = SEARCH_ACCESS[role];
  if (access.scope === "none") return [];
  const hasIdentityCriteria = Boolean(
    criteria.query.trim() ||
      criteria.birthDate ||
      criteria.mothersMaidenName.trim() ||
      criteria.mobile.trim() ||
      criteria.gender ||
      criteria.civilStatus ||
      criteria.citizenship.trim() ||
      criteria.occupation.trim() ||
      criteria.addressKeyword.trim(),
  );
  if (!hasIdentityCriteria) return [];

  return residents
    .filter((resident) => {
      if (access.scope === "barangay" && resident.address.barangayId !== selectedBarangay) return false;
      if (criteria.barangayId && resident.address.barangayId !== criteria.barangayId) return false;
      if (criteria.residentStatus && resident.residentStatus !== criteria.residentStatus) return false;
      if (criteria.gender && resident.gender !== criteria.gender) return false;
      if (criteria.civilStatus && resident.civilStatus !== criteria.civilStatus) return false;
      return true;
    })
    .map((resident): ResidentSearchResult | undefined => {
      let score = 0;
      const signals: string[] = [];
      const query = criteria.query.trim();
      if (query) {
        if (normalized(query) === normalized(resident.lrn)) {
          score += 100;
          signals.push("Exact LRN");
        } else {
          const match = nameMatch(resident, query);
          score += match.score;
          if (match.signal) signals.push(match.signal);
          if (resident.nickname && similarity(resident.nickname, query) >= 0.75) {
            score += 12;
            signals.push("Nickname");
          }
          if (resident.previousLastName && similarity(resident.previousLastName, query) >= 0.75) {
            score += 12;
            signals.push("Previous / married name");
          }
        }
      }
      if (criteria.birthDate) {
        if (resident.birthDate !== criteria.birthDate) return undefined;
        score += 25;
        signals.push("Exact birth date");
      }
      if (criteria.mothersMaidenName.trim()) {
        const match = similarity(resident.mothersMaidenName, criteria.mothersMaidenName);
        if (match < 0.62) return undefined;
        score += match >= 0.9 ? 25 : 16;
        signals.push(match >= 0.9 ? "Mother’s maiden name" : "Fuzzy maiden name");
      }
      if (criteria.mobile.trim()) {
        const digits = criteria.mobile.replace(/\D/g, "");
        const primary = resident.contact.primaryMobile.replace(/\D/g, "");
        const secondary = resident.contact.secondaryMobile.replace(/\D/g, "");
        if (!primary.includes(digits) && !secondary.includes(digits)) return undefined;
        score += primary === digits || secondary === digits ? 25 : 15;
        signals.push("Mobile number");
      }
      if (criteria.gender) {
        score += 6;
        signals.push("Sex");
      }
      if (criteria.civilStatus) {
        score += 6;
        signals.push("Civil status");
      }
      if (criteria.citizenship.trim()) {
        const citizenship = normalized(criteria.citizenship);
        const primary = normalized(resident.primaryCitizenship);
        const secondary = normalized(resident.secondaryCitizenship);
        if (!primary.includes(citizenship) && !secondary.includes(citizenship)) return undefined;
        score += 10;
        signals.push("Citizenship");
      }
      if (criteria.occupation.trim()) {
        const occupation = normalized(criteria.occupation);
        if (!normalized(resident.occupation).includes(occupation)) return undefined;
        score += 10;
        signals.push("Occupation");
      }
      if (criteria.addressKeyword.trim()) {
        const addressKeyword = normalized(criteria.addressKeyword);
        const addressValues = [
          resident.address.purok,
          resident.address.sitio,
          resident.address.zone,
          resident.address.street,
          resident.address.subdivision,
          resident.address.landmark,
        ];
        if (!addressValues.some((value) => normalized(value).includes(addressKeyword))) return undefined;
        score += 10;
        signals.push("Address area");
      }
      if (!signals.length) return undefined;
      return {
        resident,
        score: Math.min(100, score),
        confidence: score >= 75 ? "Exact" : score >= 50 ? "Strong" : "Possible",
        signals,
      };
    })
    .filter((result): result is ResidentSearchResult => Boolean(result))
    .sort(
      (left, right) =>
        right.score - left.score || formatResidentName(left.resident).localeCompare(formatResidentName(right.resident)),
    );
}
