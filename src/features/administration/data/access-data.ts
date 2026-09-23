import { MATNOG_BARANGAYS } from "@/data/barangays";

import type { AccessRole, AccountStatus, StaffAccount } from "../types/access";

const FIRST_NAMES = [
  "Maria",
  "Jose",
  "Ana",
  "Ramon",
  "Liza",
  "Renato",
  "Marites",
  "Joel",
  "Carmela",
  "Danilo",
  "Rosalie",
  "Edgar",
  "Janine",
  "Mario",
  "Teresa",
  "Noel",
  "Grace",
  "Rogelio",
  "Elena",
  "Victor",
];
const LAST_NAMES = [
  "Dela Cruz",
  "Sanchez",
  "Escandor",
  "Francia",
  "Guban",
  "Llaneta",
  "Miranda",
  "Ofracio",
  "Reyes",
  "Tomas",
  "Bermundo",
  "Espinas",
  "Fajardo",
  "Gatdula",
  "Hao",
  "Labalan",
  "Noble",
  "Paderes",
  "Salazar",
  "Velasco",
];

const permissionsFor = (role: AccessRole) => {
  if (role === "Barangay Staff") return ["Community Registry", "Documents", "Frontline Services"];
  if (role === "Barangay Official") return ["Community Registry", "Documents", "Planning", "Reports"];
  if (role === "Municipal Office") return ["Municipal Oversight", "Reports", "Planning"];
  if (role === "Auditor") return ["Audit Logs", "Reports", "Read-only Oversight"];
  return ["Administration", "Municipal Oversight", "All operational modules", "Audit Logs"];
};

const statusFor = (index: number): AccountStatus => {
  if (index % 29 === 0) return "Suspended";
  if (index % 17 === 0) return "Locked";
  if (index % 13 === 0) return "Invited";
  return "Active";
};

const barangayAccounts: StaffAccount[] = MATNOG_BARANGAYS.flatMap((barangay, barangayIndex) =>
  [0, 1].map((staffIndex) => {
    const index = barangayIndex * 2 + staffIndex;
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(index * 3 + staffIndex) % LAST_NAMES.length];
    const role: AccessRole = staffIndex === 0 ? "Barangay Official" : "Barangay Staff";
    const status = statusFor(index + 1);
    const date = String(((index * 7) % 22) + 1).padStart(2, "0");
    const hour = String(8 + (index % 9)).padStart(2, "0");
    const safeBarangay = barangay.name.toLowerCase().replace(/[^a-z0-9]+/g, ".");
    return {
      id: `USR-${barangay.code}-${staffIndex + 1}`,
      employeeNumber: `BA-${String(index + 1).padStart(4, "0")}`,
      name: `${firstName} ${lastName}`,
      initials: `${firstName[0]}${lastName[0]}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, "")}@${safeBarangay}.matnog.gov.ph`,
      mobile: `09${String(170000000 + index * 3719).slice(-9)}`,
      position:
        staffIndex === 0
          ? "Barangay Secretary"
          : index % 3 === 0
            ? "Barangay Records Officer"
            : "Barangay Administrative Aide",
      office: `Barangay ${barangay.name}`,
      role,
      barangayId: barangay.code,
      status,
      permissionGroups: permissionsFor(role),
      lastLoginAt: status === "Invited" ? null : `2026-09-${date}T${hour}:${index % 2 ? "42" : "18"}:00+08:00`,
      lastLoginIp: status === "Invited" ? null : `10.62.${barangayIndex + 1}.${21 + staffIndex}`,
      createdAt: `2026-${String((barangayIndex % 8) + 1).padStart(2, "0")}-${String((index % 24) + 1).padStart(2, "0")}`,
      twoFactorEnabled: role === "Barangay Official" || index % 8 !== 1,
    };
  }),
);

const municipalAccounts: StaffAccount[] = [
  [
    "USR-MUN-001",
    "MA-0001",
    "Amelia Fortes",
    "AF",
    "Municipal Administrator",
    "Office of the Municipal Administrator",
    "Municipal Administrator",
    "Active",
  ],
  [
    "USR-MUN-002",
    "MPDO-0021",
    "Gabriel Frilles",
    "GF",
    "Municipal Planning Officer",
    "Municipal Planning and Development Office",
    "Municipal Office",
    "Active",
  ],
  [
    "USR-MUN-003",
    "MCR-0016",
    "Corazon Espinas",
    "CE",
    "Municipal Civil Registrar",
    "Municipal Civil Registry Office",
    "Municipal Office",
    "Active",
  ],
  [
    "USR-MUN-004",
    "COA-0008",
    "Nestor Palma",
    "NP",
    "Internal Auditor",
    "Municipal Internal Audit Service",
    "Auditor",
    "Locked",
  ],
].map((record, index) => {
  const role = record[6] as AccessRole;
  return {
    id: record[0],
    employeeNumber: record[1],
    name: record[2],
    initials: record[3],
    email: `${record[2].toLowerCase().replace(/\s+/g, ".")}@matnog.gov.ph`,
    mobile: `09175550${String(110 + index)}`,
    position: record[4],
    office: record[5],
    role,
    barangayId: null,
    status: record[7] as AccountStatus,
    permissionGroups: permissionsFor(role),
    lastLoginAt: `2026-09-${22 - index}T${10 + index}:2${index}:00+08:00`,
    lastLoginIp: `10.62.0.${10 + index}`,
    createdAt: `2025-11-${String(10 + index).padStart(2, "0")}`,
    twoFactorEnabled: true,
  };
});

export const ACCESS_ACCOUNTS: StaffAccount[] = [...municipalAccounts, ...barangayAccounts];

export const ACCESS_ROLES: AccessRole[] = [
  "Barangay Staff",
  "Barangay Official",
  "Municipal Office",
  "Municipal Administrator",
  "Auditor",
];
