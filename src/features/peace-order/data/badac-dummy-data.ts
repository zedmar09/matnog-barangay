import { MATNOG_BARANGAYS } from "@/data/barangays";
import type { Resident } from "@/features/resident-registry/types/resident";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";

import type { BadacPriority, BadacRecord, BadacRecordType, BadacStatus } from "../types/badac";

const types: BadacRecordType[] = [
  "Community Report",
  "Voluntary Referral",
  "Intervention Client",
  "Agency Endorsement",
];
const priorities: BadacPriority[] = ["Urgent", "High", "Standard"];
const statuses: BadacStatus[] = [
  "Restricted Intake",
  "Validation Review",
  "Intervention",
  "Agency Referral",
  "Monitoring",
  "Closed",
];

function party(resident: Resident) {
  return {
    kind: "Resident" as const,
    residentId: resident.id,
    fullName: formatResidentName(resident),
    contact: resident.contact.primaryMobile,
    address: `${resident.address.street}, Brgy. ${MATNOG_BARANGAYS.find((item) => item.code === resident.address.barangayId)?.name}, Matnog`,
  };
}

export function createBadacDummyData(residents: Resident[]): BadacRecord[] {
  return Array.from({ length: 30 }, (_, index) => {
    const resident = residents[(index * 17 + 6) % residents.length];
    const recordType = types[index % types.length];
    const status = statuses[index % statuses.length];
    const date = `2026-${String((index % 8) + 1).padStart(2, "0")}-${String((index % 24) + 1).padStart(2, "0")}`;
    return {
      id: `badac-${String(index + 1).padStart(5, "0")}`,
      recordNumber: `BADAC-${resident.address.barangayId.toUpperCase()}-2026-${String(index + 1).padStart(4, "0")}`,
      barangayId: resident.address.barangayId,
      subject: party(resident),
      recordType,
      priority: priorities[index % priorities.length],
      status,
      intakeAt: `${date}T09:00:00.000Z`,
      sourceClass:
        recordType === "Voluntary Referral"
          ? "Self-Referral"
          : recordType === "Agency Endorsement"
            ? "Authorized Agency"
            : "Confidential Community Source",
      concernSummary:
        "A restricted BADAC record was received for authorized validation, assistance planning, and appropriate referral.",
      validationNotes: "Information is unverified until documented review is completed by authorized BADAC personnel.",
      interventionPlan:
        "Coordinate lawful assessment, health and social support referral, family engagement where appropriate, and scheduled monitoring.",
      assignedOfficer:
        index % 2 === 0 ? "BADAC Focal Person Mario Ramos" : "Barangay Anti-Drug Abuse Council Secretary",
      agencyReferrals:
        status === "Agency Referral" || status === "Monitoring"
          ? ["Municipal Anti-Drug Abuse Council", "Municipal Health Office"]
          : [],
      actions:
        status === "Restricted Intake"
          ? []
          : [
              {
                id: `badac-action-${index + 1}`,
                type: status === "Monitoring" ? "Monitoring Visit" : "Validation Meeting",
                scheduledAt: "2026-09-30T10:00:00.000Z",
                venue: "Restricted BADAC Meeting Room",
                status: status === "Validation Review" ? "Scheduled" : "Completed",
                notes: "Authorized personnel recorded the meeting outcome and next action.",
              },
            ],
      nextReviewAt: "2026-10-04T09:00:00.000Z",
      lawfulBasis: "Authorized local anti-drug abuse council case management and referral function.",
      auditTrail: [
        {
          id: `badac-audit-${index + 1}`,
          action: "Restricted BADAC intake created",
          actor: "BADAC Focal Person",
          accessReason: "Authorized intake and validation",
          occurredAt: `${date}T09:30:00.000Z`,
        },
      ],
    };
  });
}
