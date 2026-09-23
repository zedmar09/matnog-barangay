import type { LifeEvent, LifeEventStatus, LifeEventType, Resident } from "../types/resident";

const types: LifeEventType[] = ["Birth", "Death", "Marriage", "Civil Status Change", "Migration In", "Migration Out"];
const statuses: LifeEventStatus[] = [
  "Pending Review",
  "Pending Review",
  "Approved",
  "Approved",
  "Rejected",
  "Clarification Requested",
  "Cancelled",
];
const pad = (value: number) => String(value).padStart(2, "0");

export function createLifeEventDummyData(residents: Resident[], count = 220): LifeEvent[] {
  return Array.from({ length: count }, (_, index) => {
    const eventType = types[index % types.length];
    const status = statuses[index % statuses.length];
    const resident = eventType === "Birth" ? undefined : residents[(index * 11 + 5) % residents.length];
    const daysAgo = index % 180;
    const date = new Date(Date.UTC(2026, 8, 23 - daysAgo));
    const effectiveDate = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
    const barangayId = resident?.address.barangayId ?? residents[(index * 3) % residents.length].address.barangayId;
    return {
      id: `life-event-${String(index + 1).padStart(4, "0")}`,
      referenceNumber: `LEV-2026-${String(index + 1).padStart(5, "0")}`,
      residentId: resident?.id ?? "",
      generatedResidentId: "",
      eventType,
      effectiveDate,
      registrationDate: effectiveDate,
      barangayId,
      supportingDocumentCount: index % 4,
      details: {
        proposedFirstName: eventType === "Birth" ? ["Luningning", "Makisig", "Ligaya", "Bayani"][index % 4] : "",
        proposedMiddleName: eventType === "Birth" ? "Santos" : "",
        proposedLastName: eventType === "Birth" ? ["Dela Cruz", "Reyes", "Navarro"][index % 3] : "",
        proposedGender: eventType === "Birth" ? (index % 2 ? "Female" : "Male") : "",
        proposedCivilStatus:
          eventType === "Marriage"
            ? "Married"
            : eventType === "Civil Status Change"
              ? ["Married", "Widowed", "Separated"][index % 3]
              : "",
        proposedMarriedName: eventType === "Marriage" ? "Dela Cruz" : "",
        motherName: eventType === "Birth" ? "Maria Santos Reyes" : "",
        destination:
          eventType === "Migration Out"
            ? "Legazpi City, Albay"
            : eventType === "Migration In"
              ? "Matnog, Sorsogon"
              : "",
        causeOrBasis: eventType === "Death" ? "Civil registry notification" : "Supporting civil registry record",
      },
      status,
      requestedBy: "Barangay Registration Staff",
      requestedAt: `${effectiveDate}T08:00:00.000Z`,
      reviewedBy: status === "Pending Review" ? "" : "Municipal Registry Officer",
      reviewedAt: status === "Pending Review" ? "" : `${effectiveDate}T13:30:00.000Z`,
      decisionReason:
        status === "Rejected"
          ? "Supporting document requires correction."
          : status === "Clarification Requested"
            ? "Please confirm the effective date and civil registry reference."
            : status === "Approved"
              ? "Supporting record reviewed and approved."
              : status === "Cancelled"
                ? "Request withdrawn by the reporting party."
                : "",
      updatedAt: `${effectiveDate}T13:30:00.000Z`,
    };
  });
}
