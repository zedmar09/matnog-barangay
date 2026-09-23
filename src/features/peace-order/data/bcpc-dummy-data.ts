import { MATNOG_BARANGAYS } from "@/data/barangays";
import type { Resident } from "@/features/resident-registry/types/resident";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";

import type { BcpcCase, BcpcCaseStatus, BcpcClassification, BcpcRiskLevel } from "../types/bcpc";

const statuses: BcpcCaseStatus[] = [
  "Intake",
  "Assessment",
  "Intervention Plan",
  "Diversion",
  "Referred",
  "Monitoring",
  "Closed",
];
const risks: BcpcRiskLevel[] = ["Urgent", "High", "Moderate"];
const classifications: BcpcClassification[] = ["Child at Risk", "Child in Conflict with the Law"];

function party(resident: Resident) {
  return {
    kind: "Resident" as const,
    residentId: resident.id,
    fullName: formatResidentName(resident),
    contact: resident.contact.primaryMobile,
    address: `${resident.address.street}, Brgy. ${MATNOG_BARANGAYS.find((item) => item.code === resident.address.barangayId)?.name}, Matnog`,
  };
}

export function createBcpcDummyData(residents: Resident[]): BcpcCase[] {
  return Array.from({ length: 32 }, (_, index) => {
    const child = residents[(index * 9 + 4) % residents.length];
    const guardian = residents[(index * 9 + 5) % residents.length];
    const classification = classifications[index % classifications.length];
    const status = statuses[index % statuses.length];
    const date = `2026-${String((index % 8) + 1).padStart(2, "0")}-${String((index % 24) + 1).padStart(2, "0")}`;
    return {
      id: `bcpc-${String(index + 1).padStart(5, "0")}`,
      caseNumber: `BCPC-${child.address.barangayId.toUpperCase()}-2026-${String(index + 1).padStart(4, "0")}`,
      barangayId: child.address.barangayId,
      child: party(child),
      childAge: 10 + (index % 8),
      guardian: party(guardian),
      classification,
      riskLevel: risks[index % risks.length],
      status,
      intakeAt: `${date}T09:30:00.000Z`,
      presentingConcern:
        classification === "Child at Risk"
          ? "The BCPC received a referral for protective assessment and coordinated family support."
          : "The BCPC received a referral requiring child-sensitive assessment and diversion review.",
      assessment: "Initial child-sensitive assessment completed with the guardian and assigned caseworker.",
      interventionPlan: "Coordinate education, psychosocial support, family conferencing, and scheduled follow-up.",
      diversionPlan:
        classification === "Child in Conflict with the Law"
          ? "Community-based diversion activities and family supervision were documented for review."
          : "",
      caseworker: index % 2 === 0 ? "BCPC Caseworker Ana Ramos" : "Barangay Child Protection Officer Joel Garcia",
      referrals:
        index % 3 === 0
          ? ["Municipal Social Welfare and Development Office", "Local Council for the Protection of Children"]
          : ["Municipal Social Welfare and Development Office"],
      conferences:
        status === "Intake"
          ? []
          : [
              {
                id: `conference-${index + 1}`,
                scheduledAt: "2026-09-29T09:00:00.000Z",
                venue: "Private BCPC Conference Room",
                participants: ["Child and guardian", "BCPC caseworker", "Social welfare representative"],
                status: status === "Assessment" ? "Scheduled" : "Completed",
                notes: "Child-sensitive case conference conducted with authorized participants.",
              },
            ],
      nextFollowUpAt: "2026-10-02T09:00:00.000Z",
      consentOrAuthority: "Guardian consent and applicable child-protection authority recorded.",
      auditTrail: [
        {
          id: `bcpc-audit-${index + 1}`,
          action: "Confidential BCPC intake created",
          actor: "BCPC Caseworker",
          reason: "Protective assessment and case management",
          occurredAt: `${date}T10:00:00.000Z`,
        },
      ],
    };
  });
}
