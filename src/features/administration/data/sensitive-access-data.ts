import { MATNOG_BARANGAYS } from "@/data/barangays";

import type { PurposeRule, SensitiveDomain, SensitiveGrant } from "../types/access";
import { ACCESS_ACCOUNTS } from "./access-data";

export const SENSITIVE_DOMAINS: SensitiveDomain[] = [
  "Peace & Order",
  "VAW Desk",
  "BCPC",
  "BADAC",
  "Health",
  "Sectoral",
];

const officials = ACCESS_ACCOUNTS.filter((account) => account.role === "Barangay Official");
const staff = ACCESS_ACCOUNTS.filter((account) => account.role === "Barangay Staff");

const barangayGrants: SensitiveGrant[] = MATNOG_BARANGAYS.flatMap((barangay, index) => {
  const official = officials.find((account) => account.barangayId === barangay.code) ?? officials[index];
  const staffAccount = staff.find((account) => account.barangayId === barangay.code) ?? staff[index];
  const rotatingDomain = SENSITIVE_DOMAINS[(index % (SENSITIVE_DOMAINS.length - 1)) + 1];
  const expiryMonth = String(10 + (index % 3)).padStart(2, "0");
  return [
    {
      id: `SG-${barangay.code}-01`,
      accountId: official.id,
      domain: "Peace & Order" as const,
      access: index % 3 === 0 ? ("Case manager" as const) : ("Read & update" as const),
      status: index % 19 === 0 ? ("Expiring" as const) : ("Active" as const),
      requiresPurpose: true,
      approvedBy: "Municipal Administrator",
      approvedAt: `2026-0${(index % 8) + 1}-${String((index % 20) + 1).padStart(2, "0")}`,
      expiresAt: `2026-${expiryMonth}-${String((index % 20) + 8).padStart(2, "0")}`,
      lastUsedAt: `2026-09-${String((index % 21) + 1).padStart(2, "0")}T${String(8 + (index % 8)).padStart(2, "0")}:20:00+08:00`,
    },
    {
      id: `SG-${barangay.code}-02`,
      accountId: index % 4 === 0 ? official.id : staffAccount.id,
      domain: rotatingDomain,
      access:
        rotatingDomain === "BADAC" || rotatingDomain === "VAW Desk" ? ("Read" as const) : ("Read & update" as const),
      status: index % 17 === 0 ? ("Revoked" as const) : index % 11 === 0 ? ("Expiring" as const) : ("Active" as const),
      requiresPurpose: true,
      approvedBy: index % 2 === 0 ? "Amelia Fortes" : "Municipal Data Protection Officer",
      approvedAt: `2026-0${(index % 7) + 1}-${String((index % 18) + 2).padStart(2, "0")}`,
      expiresAt: `2026-${expiryMonth}-${String((index % 19) + 9).padStart(2, "0")}`,
      lastUsedAt: index % 5 === 0 ? null : `2026-09-${String((index % 20) + 1).padStart(2, "0")}T11:45:00+08:00`,
    },
  ];
});

const municipalGrants: SensitiveGrant[] = ACCESS_ACCOUNTS.filter((account) => account.barangayId === null).flatMap(
  (account, index) => [
    {
      id: `SG-MUN-${index + 1}-01`,
      accountId: account.id,
      domain: index === 3 ? "BADAC" : "Sectoral",
      access: "Read" as const,
      status: "Active" as const,
      requiresPurpose: true,
      approvedBy: "Municipal Data Protection Officer",
      approvedAt: "2026-02-14",
      expiresAt: "2026-12-31",
      lastUsedAt: `2026-09-${18 + index}T09:30:00+08:00`,
    },
  ],
);

export const SENSITIVE_GRANTS: SensitiveGrant[] = [...municipalGrants, ...barangayGrants];

export const PURPOSE_RULES: PurposeRule[] = [
  {
    id: "PURPOSE-PO",
    domain: "Peace & Order",
    classification: "Restricted",
    description: "Blotter and Katarungang Pambarangay case records.",
    promptTitle: "State your official purpose for opening this case",
    purposes: ["Case intake", "Hearing preparation", "Settlement follow-up", "CFA processing", "Authorized audit"],
    reasonRequired: true,
    acknowledgementRequired: true,
    logEveryRead: true,
    municipalVisibility: "Aggregate only",
    retentionDays: 365,
  },
  {
    id: "PURPOSE-VAW",
    domain: "VAW Desk",
    classification: "Highly restricted",
    description: "Survivor records, protection orders, and case interventions.",
    promptTitle: "Confirm authorized VAW case access",
    purposes: [
      "Survivor intake",
      "Protection order processing",
      "Referral coordination",
      "Case follow-up",
      "Authorized compliance review",
    ],
    reasonRequired: true,
    acknowledgementRequired: true,
    logEveryRead: true,
    municipalVisibility: "Aggregate only",
    retentionDays: 730,
  },
  {
    id: "PURPOSE-BCPC",
    domain: "BCPC",
    classification: "Highly restricted",
    description: "Children at risk and children in conflict with the law.",
    promptTitle: "Confirm child-protection case purpose",
    purposes: [
      "Case intake",
      "Intervention planning",
      "Referral coordination",
      "Court or agency response",
      "Authorized case review",
    ],
    reasonRequired: true,
    acknowledgementRequired: true,
    logEveryRead: true,
    municipalVisibility: "Aggregate only",
    retentionDays: 730,
  },
  {
    id: "PURPOSE-BADAC",
    domain: "BADAC",
    classification: "Highly restricted",
    description: "Restricted anti-drug council records with explicit read logging.",
    promptTitle: "Provide the authorized BADAC access reason",
    purposes: ["Authorized case work", "Referral coordination", "Council action", "Compliance review"],
    reasonRequired: true,
    acknowledgementRequired: true,
    logEveryRead: true,
    municipalVisibility: "Aggregate only",
    retentionDays: 730,
  },
  {
    id: "PURPOSE-HEALTH",
    domain: "Health",
    classification: "Confidential",
    description: "Resident health indicators used for assistance and emergency response.",
    promptTitle: "State the service purpose for health data access",
    purposes: ["Emergency response", "Health referral", "Assistance eligibility", "Authorized reporting"],
    reasonRequired: true,
    acknowledgementRequired: true,
    logEveryRead: true,
    municipalVisibility: "Authorized records",
    retentionDays: 365,
  },
  {
    id: "PURPOSE-SECTOR",
    domain: "Sectoral",
    classification: "Confidential",
    description: "PWD, indigent, IP, 4Ps, solo parent, and other protected sector status.",
    promptTitle: "State the program purpose for sectoral access",
    purposes: [
      "Certification review",
      "Benefit eligibility",
      "ID or booklet issuance",
      "Program reporting",
      "Authorized audit",
    ],
    reasonRequired: true,
    acknowledgementRequired: false,
    logEveryRead: true,
    municipalVisibility: "Authorized records",
    retentionDays: 365,
  },
];
