import { MATNOG_BARANGAYS } from "@/data/barangays";
import type { Resident } from "@/features/resident-registry/types/resident";
import { formatResidentName } from "@/features/resident-registry/utils/resident-utils";

import type { BlotterRecord, BlotterStatus, IncidentType } from "../types/blotter";

const types: IncidentType[] = [
  "Physical Injury",
  "Threats",
  "Property Dispute",
  "Noise Complaint",
  "Theft",
  "Public Disturbance",
  "Domestic Dispute",
  "Other",
];
const statuses: BlotterStatus[] = ["Filed", "Under Investigation", "Referred to Lupon", "Closed"];
function residentParty(resident: Resident) {
  return {
    kind: "Resident" as const,
    residentId: resident.id,
    fullName: formatResidentName(resident),
    contact: resident.contact.primaryMobile,
    address:
      `${resident.address.houseUnit} ${resident.address.street}, Brgy. ${MATNOG_BARANGAYS.find((item) => item.code === resident.address.barangayId)?.name}, Matnog`.trim(),
  };
}
export function createBlotterDummyData(residents: Resident[]) {
  return Array.from({ length: 160 }, (_, index): BlotterRecord => {
    const complainant = residents[(index * 3) % residents.length];
    const respondent = residents[(index * 7 + 5) % residents.length];
    const barangayId = complainant.address.barangayId;
    const status = statuses[index % statuses.length];
    const date = `2026-${String((index % 9) + 1).padStart(2, "0")}-${String((index % 25) + 1).padStart(2, "0")}`;
    return {
      id: `blotter-${String(index + 1).padStart(6, "0")}`,
      caseNumber: `BLT-${barangayId.toUpperCase()}-2026-${String(index + 1).padStart(5, "0")}`,
      barangayId,
      incidentType: types[index % types.length],
      incidentAt: `${date}T${String((index % 12) + 7).padStart(2, "0")}:30:00.000Z`,
      reportedAt: `${date}T${String((index % 12) + 8).padStart(2, "0")}:15:00.000Z`,
      location: `${complainant.address.purok || "Purok 1"}, ${complainant.address.street || "Barangay Road"}`,
      latitude: 12.58 + (index % 20) * 0.001,
      longitude: 124.08 + (index % 17) * 0.001,
      complainant: residentParty(complainant),
      respondent:
        index % 9 === 0
          ? {
              kind: "Non-Resident",
              residentId: "",
              fullName: `Non-resident Party ${index + 1}`,
              contact: "Not provided",
              address: "Outside Matnog",
            }
          : residentParty(respondent),
      narrative: `The complainant reported an incident classified as ${types[index % types.length].toLowerCase()} at the stated location. Initial statements were recorded for proper barangay action.`,
      status,
      priority: index % 7 === 0 ? "High" : "Standard",
      assignedOfficer: index % 3 === 0 ? "Barangay Kagawad Joel Ramos" : "Peace and Order Desk Officer",
      resolution: status === "Closed" ? "Parties were heard and the incident was recorded as resolved." : "",
      auditTrail: [
        {
          id: `blotter-audit-${index + 1}-1`,
          action: "Incident filed",
          actor: "Peace and Order Desk Officer",
          note: "Initial complaint and party information recorded.",
          occurredAt: `${date}T09:00:00.000Z`,
        },
        ...(status === "Filed"
          ? []
          : [
              {
                id: `blotter-audit-${index + 1}-2`,
                action: status,
                actor: "Barangay Kagawad",
                note: "Case status updated after initial assessment.",
                occurredAt: `${date}T11:00:00.000Z`,
              },
            ]),
      ],
    };
  });
}
