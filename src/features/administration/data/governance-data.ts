import { MATNOG_BARANGAYS } from "@/data/barangays";

import type { DataGovernanceCategory, RetentionPolicy, SecurityEvent } from "../types/access";
import { ACCESS_ACCOUNTS } from "./access-data";

export const GOVERNANCE_CATEGORIES: DataGovernanceCategory[] = [
  {
    id: "GOV-IDENTITY",
    name: "Resident identity and civil data",
    module: "Resident Registry",
    classification: "Confidential",
    lawfulBasis: "Legal obligation and public authority",
    legalReference: "RA 10173; Local Government Code; civil registration mandates",
    processingPurpose: "Maintain one authoritative municipal resident identity and residency history.",
    dataSubjects: "Residents and former residents",
    dataOwner: "Municipal Civil Registry Office",
    consentRequired: false,
    consentCoverage: 100,
    recordsCovered: 8240,
    reviewStatus: "Current",
    nextReview: "2027-01-15",
  },
  {
    id: "GOV-HOUSEHOLD",
    name: "Household and dwelling profile",
    module: "Households & Structures",
    classification: "Confidential",
    lawfulBasis: "Public task and vital interests",
    legalReference: "Local Government Code; CBMS Act; disaster risk mandates",
    processingPurpose: "Deliver household services, surveys, evacuation support, and vulnerability planning.",
    dataSubjects: "Household members and occupants",
    dataOwner: "Municipal Planning and Development Office",
    consentRequired: true,
    consentCoverage: 94,
    recordsCovered: 2940,
    reviewStatus: "Review due",
    nextReview: "2026-10-05",
  },
  {
    id: "GOV-SECTOR",
    name: "Sectoral eligibility and benefits",
    module: "Sectoral Registries",
    classification: "Restricted",
    lawfulBasis: "Legal obligation and consent",
    legalReference: "Sector-specific national laws and social protection mandates",
    processingPurpose: "Certify eligibility, issue IDs, and track authorized benefit delivery.",
    dataSubjects: "PWD, seniors, solo parents, IP, youth, indigent, and 4Ps members",
    dataOwner: "Municipal Social Welfare and Development Office",
    consentRequired: true,
    consentCoverage: 91,
    recordsCovered: 3610,
    reviewStatus: "Action required",
    nextReview: "2026-09-30",
  },
  {
    id: "GOV-DOCUMENT",
    name: "Certificates and clearances",
    module: "Certifications & Clearances",
    classification: "Internal",
    lawfulBasis: "Contractual service and public authority",
    legalReference: "Local Government Code and barangay service mandates",
    processingPurpose: "Review, issue, verify, revoke, and retain official barangay documents.",
    dataSubjects: "Applicants and document subjects",
    dataOwner: "Barangay Secretariats",
    consentRequired: false,
    consentCoverage: 100,
    recordsCovered: 12460,
    reviewStatus: "Current",
    nextReview: "2027-02-10",
  },
  {
    id: "GOV-PEACE",
    name: "Peace, VAW, BCPC, and BADAC cases",
    module: "Peace & Order",
    classification: "Highly restricted",
    lawfulBasis: "Legal obligation, vital interests, and public authority",
    legalReference: "Katarungang Pambarangay, VAWC, child protection, and anti-drug laws",
    processingPurpose: "Perform legally mandated case management, protection, referral, and aggregate reporting.",
    dataSubjects: "Complainants, respondents, survivors, children, and case parties",
    dataOwner: "Barangay Lupon and protected desks",
    consentRequired: false,
    consentCoverage: 100,
    recordsCovered: 1180,
    reviewStatus: "Current",
    nextReview: "2026-12-12",
  },
  {
    id: "GOV-ASSIST",
    name: "Assistance and benefit availment",
    module: "Assistance & Benefits",
    classification: "Confidential",
    lawfulBasis: "Public task, vital interests, and consent",
    legalReference: "Social protection and local assistance program authorities",
    processingPurpose: "Assess eligibility, prevent duplicate aid, release assistance, and liquidate funds.",
    dataSubjects: "Applicants, beneficiaries, and household members",
    dataOwner: "Municipal Social Welfare and Development Office",
    consentRequired: true,
    consentCoverage: 97,
    recordsCovered: 4760,
    reviewStatus: "Current",
    nextReview: "2027-01-05",
  },
  {
    id: "GOV-BUSINESS",
    name: "Business registration and collections",
    module: "Business Registry",
    classification: "Internal",
    lawfulBasis: "Legal obligation and contractual service",
    legalReference: "Local Government Code and local revenue ordinances",
    processingPurpose: "Issue barangay business clearances and coordinate municipal permitting.",
    dataSubjects: "Business owners and authorized representatives",
    dataOwner: "Barangay Treasurers and BPLO",
    consentRequired: false,
    consentCoverage: 100,
    recordsCovered: 1330,
    reviewStatus: "Current",
    nextReview: "2027-03-01",
  },
  {
    id: "GOV-AUDIT",
    name: "Security and audit telemetry",
    module: "Administration",
    classification: "Restricted",
    lawfulBasis: "Legitimate interest and legal obligation",
    legalReference: "RA 10173 security principle and government audit requirements",
    processingPurpose: "Detect misuse, establish accountability, investigate incidents, and prove system integrity.",
    dataSubjects: "Authorized users and administrators",
    dataOwner: "Municipal Data Protection Officer",
    consentRequired: false,
    consentCoverage: 100,
    recordsCovered: 182420,
    reviewStatus: "Current",
    nextReview: "2026-12-01",
  },
];

export const RETENTION_POLICIES: RetentionPolicy[] = GOVERNANCE_CATEGORIES.map((category, index) => ({
  id: `RET-${String(index + 1).padStart(3, "0")}`,
  name: category.name,
  module: category.module,
  classification: category.classification,
  retentionPeriod:
    index === 0
      ? "Permanent"
      : index === 4
        ? "10 years after case closure"
        : index === 7
          ? "5 years after event"
          : index % 3 === 0
            ? "7 years after transaction"
            : "5 years after last activity",
  trigger:
    index === 0
      ? "Resident record creation"
      : index === 4
        ? "Case closure or final disposition"
        : index === 7
          ? "Audit event timestamp"
          : "Transaction closure or last verified date",
  disposition:
    index === 0
      ? "Permanent archive"
      : index === 4
        ? "Transfer to municipal archive"
        : index % 2 === 0
          ? "Anonymize"
          : "Secure deletion",
  legalHold: index === 4 || index === 7,
  eligibleRecords: index === 0 ? 0 : 18 + index * 13,
  protectedRecords: index === 4 ? 26 : index === 7 ? 41 : index * 3,
  nextRun: `2026-10-${String(2 + index).padStart(2, "0")}`,
  lastRun: `2026-09-${String(2 + index).padStart(2, "0")}`,
  status: index === 2 ? "Review due" : index === 4 ? "Paused" : "Active",
}));

const SECURITY_TYPES = [
  "Repeated sign-in failures",
  "Sensitive record access anomaly",
  "Unrecognized device",
  "Bulk export threshold exceeded",
  "Expired permission used",
];
const SEVERITIES: SecurityEvent["severity"][] = ["Medium", "High", "Low", "Critical", "High"];

export const SECURITY_EVENTS: SecurityEvent[] = MATNOG_BARANGAYS.slice(0, 30).map((barangay, index) => {
  const account = ACCESS_ACCOUNTS.find((item) => item.barangayId === barangay.code) ?? ACCESS_ACCOUNTS[index];
  const severity = SEVERITIES[index % SEVERITIES.length];
  const status: SecurityEvent["status"] =
    index % 7 === 0 ? "Open" : index % 5 === 0 ? "Investigating" : index % 3 === 0 ? "Contained" : "Resolved";
  const type = SECURITY_TYPES[index % SECURITY_TYPES.length];
  const personalDataInvolved = type !== "Repeated sign-in failures" && type !== "Unrecognized device";
  return {
    id: `SEC-2026-${String(index + 1).padStart(4, "0")}`,
    detectedAt: `2026-09-${String(23 - (index % 13)).padStart(2, "0")}T${String(7 + (index % 10)).padStart(2, "0")}:${String((index * 9) % 60).padStart(2, "0")}:00+08:00`,
    type,
    severity,
    status,
    barangayId: barangay.code,
    accountId: account.id,
    ipAddress: `10.62.${index + 1}.${21 + (index % 2)}`,
    summary:
      type === "Bulk export threshold exceeded"
        ? "The account generated multiple resident-level exports within a short interval."
        : type === "Sensitive record access anomaly"
          ? "Protected records were opened outside the account's typical service pattern."
          : type === "Expired permission used"
            ? "A request attempted to use a sensitive access grant after its expiry time."
            : `${type} was detected and recorded by the security monitoring rules.`,
    affectedRecords: personalDataInvolved ? 4 + index * 2 : 0,
    personalDataInvolved,
    notificationRequired: severity === "Critical" && personalDataInvolved,
    assignedTo: severity === "Critical" ? "Municipal Data Protection Officer" : "Municipal System Administrator",
    evidence: [
      `Authentication log ${index + 101}`,
      `Audit sequence ${2200 + index}`,
      `Device fingerprint DF-${String(index + 1).padStart(4, "0")}`,
    ],
    responseSteps: [
      {
        label: "Alert acknowledged",
        completed: status !== "Open",
        completedAt: status !== "Open" ? "2026-09-23T10:10:00+08:00" : null,
      },
      {
        label: "Account and session reviewed",
        completed: status === "Contained" || status === "Resolved",
        completedAt: status === "Contained" || status === "Resolved" ? "2026-09-23T10:35:00+08:00" : null,
      },
      {
        label: "Risk contained",
        completed: status === "Contained" || status === "Resolved",
        completedAt: status === "Contained" || status === "Resolved" ? "2026-09-23T11:05:00+08:00" : null,
      },
      {
        label: "Incident resolved",
        completed: status === "Resolved",
        completedAt: status === "Resolved" ? "2026-09-23T14:20:00+08:00" : null,
      },
    ],
  };
});
