import { MATNOG_BARANGAYS } from "@/data/barangays";
import type { Resident } from "@/features/resident-registry/types/resident";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";

import type { VawCase, VawCaseStatus, VawRiskLevel } from "../types/vaw";

const statuses: VawCaseStatus[] = [
  "Intake Review",
  "Risk Assessment",
  "BPO Pending",
  "BPO Active",
  "Referred",
  "Monitoring",
  "Closed",
];
const risks: VawRiskLevel[] = ["Critical", "High", "Moderate"];
const classifications: VawCase["classification"][] = ["Physical", "Psychological", "Economic", "Threat or Harassment"];

function party(resident: Resident) {
  return {
    kind: "Resident" as const,
    residentId: resident.id,
    fullName: formatResidentName(resident),
    contact: resident.contact.primaryMobile,
    address: `${resident.address.street}, Brgy. ${MATNOG_BARANGAYS.find((item) => item.code === resident.address.barangayId)?.name}, Matnog`,
  };
}

export function createVawDummyData(residents: Resident[]): VawCase[] {
  return Array.from({ length: 36 }, (_, index) => {
    const survivor = residents[(index * 11 + 2) % residents.length];
    const respondent = residents[(index * 13 + 9) % residents.length];
    const status = statuses[index % statuses.length];
    const riskLevel = risks[index % risks.length];
    const withOrder = ["BPO Active", "Referred", "Monitoring", "Closed"].includes(status);
    const date = `2026-${String((index % 8) + 1).padStart(2, "0")}-${String((index % 24) + 1).padStart(2, "0")}`;
    return {
      id: `vaw-${String(index + 1).padStart(5, "0")}`,
      caseNumber: `VAW-${survivor.address.barangayId.toUpperCase()}-2026-${String(index + 1).padStart(4, "0")}`,
      barangayId: survivor.address.barangayId,
      survivor: party(survivor),
      respondent: party(respondent),
      classification: classifications[index % classifications.length],
      incidentAt: `${date}T10:00:00.000Z`,
      location: `${survivor.address.purok || "Purok 1"}, ${survivor.address.street || "Barangay Road"}`,
      riskLevel,
      status,
      childrenAffected: index % 4,
      narrative:
        "The VAW Desk recorded the survivor's account, immediate concerns, and requested assistance using trauma-informed intake procedures.",
      safetyPlan: "Emergency contacts, a safe destination, and follow-up arrangements were reviewed with the survivor.",
      caseworker: index % 2 === 0 ? "VAW Desk Officer Maria Santos" : "Barangay Social Welfare Aide Liza Ramos",
      referrals:
        index % 3 === 0
          ? ["Municipal Social Welfare and Development Office", "Women and Children Protection Desk"]
          : ["Municipal Social Welfare and Development Office"],
      protectionOrders: withOrder
        ? [
            {
              id: `bpo-${index + 1}`,
              number: `BPO-${survivor.address.barangayId.toUpperCase()}-2026-${String(index + 1).padStart(4, "0")}`,
              issuedAt: `${date}T14:00:00.000Z`,
              expiresAt: "2026-10-20T17:00:00.000Z",
              status: status === "Closed" ? "Expired" : "Active",
              conditions:
                "No contact, intimidation, harassment, or approach within the safety distance recorded in the order.",
              servedAt: `${date}T16:00:00.000Z`,
            },
          ]
        : [],
      lastContactAt: `${date}T15:00:00.000Z`,
      nextFollowUpAt: "2026-09-30T09:00:00.000Z",
      consentRecorded: true,
      auditTrail: [
        {
          id: `vaw-audit-${index + 1}-1`,
          action: "Confidential intake created",
          actor: "VAW Desk Officer",
          reason: "Direct survivor assistance",
          occurredAt: `${date}T11:00:00.000Z`,
        },
      ],
    };
  });
}
